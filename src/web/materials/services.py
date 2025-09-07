from datetime import timedelta, datetime, date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import User, MaterialTypes, Materials
from web.materials.exceptions import MaterialCreateError
from web.materials.schemas import CreateMaterial, CreateMaterialBulk


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


async def check_material_bulk_create(
        db_session: AsyncSession, material_bulk_input: CreateMaterialBulk
) -> CreateMaterialBulk:
    query = select(User).filter(User.id == material_bulk_input.user_id)
    user = await db_session.scalar(query)
    if user is None:
        raise MaterialCreateError('User not found')
    material_types_ids = [material.material_type_id for material in material_bulk_input.materials_data]
    query = select(MaterialTypes.id).filter(MaterialTypes.id.in_(material_types_ids))
    result = await db_session.execute(query)
    material_types_db_ids = result.scalars().all()
    verified_material_bulk_input = CreateMaterialBulk(
        user_id=material_bulk_input.user_id,
        number_of_document=material_bulk_input.number_of_document,
        materials_data=[material for material in material_bulk_input.materials_data
                        if material.material_type_id in material_types_db_ids]
    )
    return verified_material_bulk_input


def get_date_params(material: Materials) -> tuple | tuple[None, None]:
    sd = material.start_date
    period = material.period
    today = date.today()

    end_date, term_to_control = None, None
    if sd and period is not None:
        end = sd + timedelta(days=period)
        if isinstance(end, datetime):
            end = end.date()
        if isinstance(today, datetime):
            today = today.date()
        end_date = end
        term_to_control = (end - today).days

    return end_date, term_to_control
