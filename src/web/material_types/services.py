from collections import defaultdict
from typing import Dict, Union, List, Tuple
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

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
) -> Dict[
    int,
    Dict[str, Union[str, Dict[str, Dict[str, Union[int, Dict[str, int]]]]]],
]:
    """
    return sructure:
    {
      material_type_id: {
        "size_type": "...",
        "result": {
          "total": {
            "norm": <int>,
            "given": <int>,
            "need": <int>
          },
          "structure": {
            "<size_str>": {
              "norm": <int>,
              "given": <int>,
              "need": <int>
            },
            "without_size": {
              "norm": <int>,
              "given": <int>,
              "need": <int>
            },
            ...
          }
        }
      },
      ...
    }
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

        size_norm = defaultdict(int)
        size_given = defaultdict(int)

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

        # 2.3. Теперь распределяем это по "размерам" (или without_size).
        #      Для каждого пользователя определяем, какой size_str ему нужен.
        #      Если size_type_for_material есть -> смотрим user.additional_features[size_type_for_material].
        #      Иначе "without_size".
        #      Потом size_norm[size_str] += user_norm_sum[user], size_given[size_str] += user_given_sum[user].

        for user in all_users:
            if (
                size_type_for_material
                and size_type_for_material != 'no_size_type'
            ):
                user_size = user.additional_features.get(
                    size_type_for_material
                )
                if user_size is not None:
                    size_str = str(user_size)
                else:
                    size_str = 'without_size'
            else:
                size_str = 'without_size'

            size_norm[size_str] += user_norm_sum[user]
            size_given[size_str] += user_given_sum[user]

        structure = {}
        for size_str in set(size_norm.keys()).union(size_given.keys()):
            n_val = size_norm[size_str]
            g_val = size_given[size_str]
            need_val = n_val - g_val
            if need_val < 0:
                need_val = 0
            structure[size_str] = {
                'norm': n_val,
                'given': g_val,
                'need': need_val,
            }

        total_norm = sum(v['norm'] for v in structure.values())
        total_given = sum(v['given'] for v in structure.values())
        total_need = sum(v['need'] for v in structure.values())

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
    calculate_input: 'CalculateNeedInput',
) -> Dict[int, Dict[str, Union[str, Dict[str, Dict[str, Dict[str, int]]]]]]:
    norm_materials = await _get_norm_materials(
        db_session, calculate_input.list_of_material_ids
    )
    if not norm_materials:
        return {}
    norms_by_id = await _get_norms_for_materials(db_session, norm_materials)
    prof_users_map, act_users_map = await _get_users_for_norms(
        db_session, norms_by_id
    )
    return _calculate_material_need(
        norm_materials, norms_by_id, prof_users_map, act_users_map
    )
