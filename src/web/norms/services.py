from sqlalchemy.ext.asyncio import AsyncSession

from database.models.material_types import MaterialTypes


async def update_material_type_db(
    db_session: AsyncSession, material_type: MaterialTypes, **update_data: dict
) -> MaterialTypes:
    for field, value in update_data.items():
        setattr(material_type, field, value)
    await db_session.commit()
    await db_session.refresh(material_type)
    return material_type
