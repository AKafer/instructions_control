from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import User, MaterialTypes, Materials
from web.materials.exceptions import MaterialCreateError
from web.materials.schemas import CreateMaterial


async def update_material_db(
    material: Materials, **update_data: dict
) -> Materials:
    for field, value in update_data.items():
        setattr(material, field, value)
    return material


async def check_material_create(
        db_session: AsyncSession, material_input: CreateMaterial
) -> None:
    query = select(User).filter(User.id == material_input.user_id)
    user = await db_session.scalar(query)
    if user is None:
        raise MaterialCreateError('User not found')
    query = select(MaterialTypes).filter(
        MaterialTypes.id == material_input.material_type_id
    )
    material_type = await db_session.scalar(query)
    if material_type is None:
        raise MaterialCreateError('Material type not found')
