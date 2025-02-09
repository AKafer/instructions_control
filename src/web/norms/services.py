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


async def update_norm_material_db(
    db_session: AsyncSession,
    norm_material: NormMaterials,
    **update_data: dict
) -> NormMaterials:
    for field, value in update_data.items():
        setattr(norm_material, field, value)
    await db_session.commit()
    await db_session.refresh(norm_material)
    return norm_material
