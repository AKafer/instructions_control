from collections import defaultdict
from typing import Dict, Union, List, Tuple
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
import openpyxl
from openpyxl.styles import Alignment
from typing import List, Dict, Tuple, Union
from collections import defaultdict
from io import BytesIO

from starlette.responses import StreamingResponse

from database.models import NormMaterials, Norms, User
from database.models.material_types import MaterialTypes


async def update_material_type_db(
    db_session: AsyncSession, material_type: MaterialTypes, **update_data: dict
) -> MaterialTypes:
    for field, value in update_data.items():
        setattr(material_type, field, value)
    await db_session.commit()
    await db_session.refresh(material_type)
    return material_type


async def _get_norm_materials(
    db_session: AsyncSession,
    material_ids: List[int],
) -> List['NormMaterials']:
    query = select(NormMaterials).where(
        NormMaterials.material_type_id.in_(material_ids)
    )
    result = await db_session.scalars(query)
    return result.all()


async def _get_norms_for_materials(
    db_session: AsyncSession,
    norm_materials: List['NormMaterials'],
) -> Dict[int, 'Norms']:
    norm_ids = {nm.norm_id for nm in norm_materials}
    if not norm_ids:
        return {}
    query = select(Norms).where(Norms.id.in_(norm_ids))
    norms = await db_session.scalars(query)
    norms_list = norms.all()
    return {n.id: n for n in norms_list}


async def _get_users_for_norms(
    db_session: AsyncSession,
    norms_by_id: Dict[int, 'Norms'],
) -> Tuple[Dict[int, List['User']], Dict[int, List['User']]]:
    profession_ids = set()
    activity_ids = set()
    for norm in norms_by_id.values():
        if norm.profession_id:
            profession_ids.add(norm.profession_id)
        elif norm.activity_id:
            activity_ids.add(norm.activity_id)

    if not profession_ids and not activity_ids:
        return {}, {}

    query = select(User).where(
        or_(
            User.profession_id.in_(profession_ids),
            User.activity_id.in_(activity_ids),
        )
    )
    users = await db_session.scalars(query)
    users_list = users.all()

    prof_users_map = defaultdict(list)
    act_users_map = defaultdict(list)
    for user in users_list:
        if user.profession_id is not None:
            prof_users_map[user.profession_id].append(user)
        if user.activity_id is not None:
            act_users_map[user.activity_id].append(user)

    return prof_users_map, act_users_map


def _calculate_material_need(
        norm_materials: List['NormMaterials'],
        norms_by_id: Dict[int, 'Norms'],
        prof_users_map: Dict[int, List['User']],
        act_users_map: Dict[int, List['User']],
        with_height: bool = False,
) -> Dict[
    int,
    Dict[str, Union[str, Dict[str, Dict[str, Dict[str, int]]]]],
]:
    """
    Если with_height=True, структура "structure" будет двухуровневой:
    structure[size_str][height_str or 'without_height'] = { 'norm', 'given', 'need' }

    Если with_height=False, структура остаётся как было:
    structure[size_str] = { 'norm', 'given', 'need' }
    """

    nm_by_material_id = defaultdict(list)
    for nm in norm_materials:
        nm_by_material_id[nm.material_type_id].append(nm)

    result: Dict[int, Dict[str, Union[str, Dict]]] = {}

    for material_id, norm_list in nm_by_material_id.items():
        all_users = set()
        size_type_for_material = 'no_size_type'

        for nm in norm_list:
            norm = norms_by_id.get(nm.norm_id)
            if not norm:
                continue
            if nm.size_type:
                size_type_for_material = nm.size_type

            if norm.profession_id is not None:
                for u in prof_users_map.get(norm.profession_id, []):
                    all_users.add(u)
            elif norm.activity_id is not None:
                for u in act_users_map.get(norm.activity_id, []):
                    all_users.add(u)

        user_norm_sum = defaultdict(int)
        user_given_sum = defaultdict(int)

        for nm in norm_list:
            norm = norms_by_id.get(nm.norm_id)
            if not norm:
                continue

            if norm.profession_id is not None:
                users_list = prof_users_map.get(norm.profession_id, [])
            elif norm.activity_id is not None:
                users_list = act_users_map.get(norm.activity_id, [])
            else:
                users_list = []

            for user in users_list:
                user_norm_sum[user] += nm.quantity

        for user in all_users:
            total_user_has_for_material = 0
            for um in user.materials:
                if um.material_type_id == material_id:
                    total_user_has_for_material += um.quantity
            user_given_sum[user] = total_user_has_for_material

        if with_height:
            size_norm = defaultdict(lambda: defaultdict(int))
            size_given = defaultdict(lambda: defaultdict(int))
        else:
            size_norm = defaultdict(int)
            size_given = defaultdict(int)

        for user in all_users:
            if size_type_for_material and size_type_for_material != 'no_size_type':
                user_size = user.additional_features.get(size_type_for_material)
                if user_size is not None:
                    size_str = str(user_size)
                else:
                    size_str = 'without_size'
            else:
                size_str = 'without_size'

            if with_height:
                user_height = user.additional_features.get('height')
                if user_height is None:
                    height_str = 'without_height'
                else:
                    height_str = str(user_height)

                size_norm[size_str][height_str] += user_norm_sum[user]
                size_given[size_str][height_str] += user_given_sum[user]
            else:
                size_norm[size_str] += user_norm_sum[user]
                size_given[size_str] += user_given_sum[user]
        structure = {}
        if with_height:
            for size_str in size_norm.keys():
                structure[size_str] = {}
                all_height_keys = set(size_norm[size_str].keys()).union(size_given[size_str].keys())
                for h_str in all_height_keys:
                    n_val = size_norm[size_str][h_str]
                    g_val = size_given[size_str][h_str]
                    need_val = max(n_val - g_val, 0)
                    structure[size_str][h_str] = {
                        'norm': n_val,
                        'given': g_val,
                        'need': need_val,
                    }
            total_norm = 0
            total_given = 0
            total_need = 0
            for size_str, height_map in structure.items():
                for h_str, data in height_map.items():
                    total_norm += data['norm']
                    total_given += data['given']
                    total_need += data['need']

        else:
            all_size_keys = set(size_norm.keys()).union(size_given.keys())
            for size_str in all_size_keys:
                n_val = size_norm[size_str]
                g_val = size_given[size_str]
                need_val = max(n_val - g_val, 0)
                structure[size_str] = {
                    'norm': n_val,
                    'given': g_val,
                    'need': need_val,
                }

            total_norm = sum(s['norm'] for s in structure.values())
            total_given = sum(s['given'] for s in structure.values())
            total_need = sum(s['need'] for s in structure.values())

        result[material_id] = {
            'size_type': size_type_for_material,
            'result': {
                'total': {
                    'norm': total_norm,
                    'given': total_given,
                    'need': total_need,
                },
                'structure': structure,
            },
        }

    return result


async def calculate_need_process(
    db_session: AsyncSession,
    list_of_material_ids: list,
    with_height: bool = False
) -> Dict[int, Dict[str, Union[str, Dict[str, Dict[str, Dict[str, int]]]]]]:
    norm_materials = await _get_norm_materials(
        db_session, list_of_material_ids
    )
    if not norm_materials:
        return {}
    norms_by_id = await _get_norms_for_materials(db_session, norm_materials)
    prof_users_map, act_users_map = await _get_users_for_norms(
        db_session, norms_by_id
    )
    return _calculate_material_need(
        norm_materials, norms_by_id, prof_users_map, act_users_map, with_height=with_height
    )


def _parse_range_str(range_str: str) -> Tuple[int, int]:
    parts = range_str.split("-")
    start = int(parts[0])
    end = int(parts[1])
    return start, end


async def calculate_table_process(
    db_session,
    material_type_id: int,
    size_range: List[str],
    height_range: List[str],
    like_file: bool = False,
):
    calc_result = await calculate_need_process(
        db_session=db_session,
        list_of_material_ids=[material_type_id],
        with_height=True
    )

    material_key = material_type_id
    if material_key not in calc_result:
        if like_file:
            return b""
        else:
            return {}

    structure_dict = calc_result[material_key]["result"]["structure"]  # dict size_str -> dict height_str -> {need,...}
    extended_size_range = list(size_range) + ["without_size"]
    extended_height_range = list(height_range) + ["without_height"]

    table_data = {
        sr: {hr: 0 for hr in extended_height_range}
        for sr in extended_size_range
    }

    for size_str, height_map in structure_dict.items():
        if size_str == "without_size":
            matched_size_range = "without_size"
        else:
            try:
                s_val = int(size_str)
                matched_size_range = None
                for sr in size_range:
                    start, end = _parse_range_str(sr)
                    if start <= s_val <= end:
                        matched_size_range = sr
                        break
                if matched_size_range is None:
                    matched_size_range = "without_size"
            except ValueError:
                matched_size_range = "without_size"

        for h_str, data_dict in height_map.items():
            needed = data_dict["need"]
            if h_str == "without_height":
                matched_height_range = "without_height"
            else:
                try:
                    h_val = int(h_str)
                    matched_height_range = None
                    for hr in height_range:
                        start, end = _parse_range_str(hr)
                        if start <= h_val <= end:
                            matched_height_range = hr
                            break
                    if matched_height_range is None:
                        matched_height_range = "without_height"
                except ValueError:
                    matched_height_range = "without_height"
            table_data[matched_size_range][matched_height_range] += needed

    if not like_file:
        return table_data
    else:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "NeedData"
        ws.cell(row=1, column=1, value="Size/Height")
        for col_idx, hr in enumerate(extended_height_range, start=2):
            ws.cell(row=1, column=col_idx, value=hr)
        row_idx = 2
        for sr in extended_size_range:
            ws.cell(row=row_idx, column=1, value=sr)
            for col_idx, hr in enumerate(extended_height_range, start=2):
                val = table_data[sr][hr]
                ws.cell(row=row_idx, column=col_idx, value=val)
            row_idx += 1
        bio = BytesIO()
        wb.save(bio)
        bio.seek(0)

        return StreamingResponse(
            BytesIO(bio.getvalue()),
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': 'attachment; filename="needs.xlsx"'
            },
        )


