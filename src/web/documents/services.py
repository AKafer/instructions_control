import os
from copy import deepcopy
from io import BytesIO
import random
import string

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from docx import Document

from core.global_placeholders import replace_global_placeholders_in_doc
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


def replace_local_placeholders_in_doc(doc, professions) -> Document:
    target_table = None
    for t_idx, t in enumerate(doc.tables):
        for row in t.rows:
            row_text = "\n".join([c.text for c in row.cells])
            if "{{номер пп}}" in row_text and "{{профессии освобожденные от первичного инструктажа}}" in row_text:
                target_table = t
                break
        if target_table:
            break

    if not target_table:
        raise DocumentCreateError('Not found target table in the document.')

    template_row = None
    template_index = None
    for i, row in enumerate(target_table.rows):
        text = '\n'.join([cell.text for cell in row.cells])
        if '{{номер пп}}' in text and '{{профессии освобожденные от первичного инструктажа}}' in text:
            template_row = row
            template_index = i
            break

    if not template_row:
        raise DocumentCreateError('Not found template row in the table.')

    while len(target_table.rows) > template_index + 1:
        target_table._tbl.remove(target_table.rows[-1]._tr)

    for counter, item in enumerate(professions, 1):
        new_tr = deepcopy(template_row._tr)
        target_table._tbl.append(new_tr)
        row = target_table.rows[-1]
        for cell in row.cells:
            text = cell.text
            text = text.replace('{{номер пп}}', str(counter))
            text = text.replace('{{профессии освобожденные от первичного инструктажа}}', item)
            cell.text = text

    target_table._tbl.remove(template_row._tr)
    return doc


async def generate_doc_non_qualify_prof_list_in_memory(
    template_path: str, professions: list[str]
) -> BytesIO:
    doc = Document(template_path)
    doc = replace_local_placeholders_in_doc(doc, professions)

    output_dir = '/tmp/ias_output'
    os.makedirs(output_dir, exist_ok=True)
    random_name = ''.join(random.choices(string.ascii_letters + string.digits, k=8)) + '.docx'
    file_path = os.path.join(output_dir, random_name)
    doc.save(file_path)
    doc = await replace_global_placeholders_in_doc(doc)

    buf = BytesIO()
    doc.save(buf)
    if os.path.exists(file_path):
        os.remove(file_path)

    buf.seek(0)
    return buf
