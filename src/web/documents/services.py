from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import User, Documents, DocumentTypes
from web.documents.schemas import CreateDocument

class DocumentCreateError(Exception):
    pass


async def update_document_db(
    document: Documents, **update_data: dict
) -> Documents:
    for field, value in update_data.items():
        setattr(document, field, value)
    return document


async def check_document_create(
        db_session: AsyncSession, document_input: CreateDocument
) -> None:
    query = select(User).filter(User.id == document_input.user_id)
    user = await db_session.scalar(query)
    if user is None:
        raise DocumentCreateError('User not found')
    query = select(DocumentTypes).filter(
        DocumentTypes.id == document_input.document_type_id
    )
    document_type = await db_session.scalar(query)
    if document_type is None:
        raise DocumentCreateError('Document type not found')
