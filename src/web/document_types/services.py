from sqlalchemy.ext.asyncio import AsyncSession

from database.models import DocumentTypes


async def update_document_type_db(
    db_session: AsyncSession, document_type: DocumentTypes, **update_data: dict
) -> DocumentTypes:
    for field, value in update_data.items():
        setattr(document_type, field, value)
    await db_session.commit()
    await db_session.refresh(document_type)
    return document_type
