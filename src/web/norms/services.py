from collections import defaultdict
from typing import Union

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Norms, NormMaterials, User
from web.material_types.schemas import CalculateNeedInput


async def update_norm_db(
    db_session: AsyncSession, norm: Norms, **update_data: dict
) -> Norms:
    for field, value in update_data.items():
        setattr(norm, field, value)
    await db_session.commit()
    await db_session.refresh(norm)
    return norm


async def _get_norm_materials(
    db_session: AsyncSession,
    material_ids: list[int],
) -> list['NormMaterials']:
    query = select(NormMaterials).where(
        NormMaterials.material_type_id.in_(material_ids)
    )
    result = await db_session.scalars(query)
    return result.all()


async def _get_norms_for_materials(
    db_session: AsyncSession,
    norm_materials: list['NormMaterials'],
) -> dict[int, 'Norms']:
    norm_ids = {nm.norm_id for nm in norm_materials}
    if not norm_ids:
        return {}
    query = select(Norms).where(Norms.id.in_(norm_ids))
    norms = await db_session.scalars(query)
    norms_list = norms.all()
    return {n.id: n for n in norms_list}


async def _get_users_for_norms(
    db_session: AsyncSession,
    norms_by_id: dict[int, 'Norms'],
) -> tuple[dict[int, list['User']], dict[int, list['User']]]:
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
    norm_materials: list['NormMaterials'],
    norms_by_id: dict[int, 'Norms'],
    prof_users_map: dict[int, list['User']],
    act_users_map: dict[int, list['User']],
) -> dict[int, dict[str, Union[str, dict[str, Union[int, dict[str, int]]]]]]:
    nm_by_material_id = defaultdict(list)
    for nm in norm_materials:
        nm_by_material_id[nm.material_type_id].append(nm)
    result: dict[
        int, dict[str, Union[str, dict[str, Union[int, dict[str, int]]]]]
    ] = {}
    for material_id, norm_materials_list in nm_by_material_id.items():
        size_type_for_material = 'with_size'
        total_need = 0
        size_distribution = defaultdict(int)
        for nm in norm_materials_list:
            norm = norms_by_id.get(nm.norm_id)
            if not norm:
                continue
            if norm.profession_id is not None:
                users_list = prof_users_map.get(norm.profession_id, [])
            elif norm.activity_id is not None:
                users_list = act_users_map.get(norm.activity_id, [])
            else:
                users_list = []
            if nm.size_type:
                size_type_for_material = nm.size_type
                for user in users_list:
                    user_size = user.additional_features.get(nm.size_type)
                    if user_size is None:
                        size_distribution['without_size'] += nm.quantity
                        total_need += nm.quantity
                    else:
                        user_size_str = str(user_size)
                        size_distribution[user_size_str] += nm.quantity
                        total_need += nm.quantity
            else:
                total = nm.quantity * len(users_list)
                size_distribution['without_size'] += total
                total_need += total
        result[material_id] = {
            'size_type': size_type_for_material,
            'need': {
                'total': total_need,
                'structure': dict(size_distribution),
            },
        }
    return result


async def calculate_need_process(
    db_session: AsyncSession,
    calculate_input: 'CalculateNeedInput',
) -> dict[int, dict[str, Union[str, dict[str, Union[int, dict[str, int]]]]]]:
    norm_materials = await _get_norm_materials(
        db_session, calculate_input.list_of_material_ids
    )
    if not norm_materials:
        return {}
    norms_by_id = await _get_norms_for_materials(db_session, norm_materials)
    prof_users_map, act_users_map = await _get_users_for_norms(
        db_session, norms_by_id
    )
    result = _calculate_material_need(
        norm_materials, norms_by_id, prof_users_map, act_users_map
    )
    return result
