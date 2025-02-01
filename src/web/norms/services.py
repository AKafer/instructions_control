from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Norms
from database.models.material_types import MaterialTypes


async def update_norm_db(
    db_session: AsyncSession, norm: Norms, **update_data: dict
) -> Norms:
    for field, value in update_data.items():
        setattr(norm, field, value)
    await db_session.commit()
    await db_session.refresh(norm)
    return norm
