import logging
from copy import deepcopy
from datetime import datetime, date
from io import BytesIO
from typing import Any, Sequence, List
from zipfile import ZipFile, ZIP_DEFLATED

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from docx import Document

from constants import personal_placeholders
from core.global_placeholders import replace_global_placeholders_in_doc, fill_template_placeholders, \
    replace_in_paragraphs, replace_in_tables, replace_in_headers_footers, doc_contains_placeholder
from database.models import User, Documents, DocumentTypes
from web.documents.schemas import CreateDocument, Placeholder


logger = logging.getLogger("control")


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


def replace_list_placeholders_in_doc(
    doc: Document,
    items: List[str],
    placeholder: str
) -> Document:
    target_table = None
    for t in doc.tables:
        for row in t.rows:
            row_text = "\n".join([c.text for c in row.cells])
            if '{{номер пп}}' in row_text and placeholder in row_text:
                target_table = t
                break
        if target_table:
            break

    if not target_table:
        raise DocumentCreateError(
            f'Not found target table containing "{{номер пп}}" and "{placeholder}"'
        )

    template_row = None
    template_index = None
    for i, row in enumerate(target_table.rows):
        text = "\n".join([cell.text for cell in row.cells])
        if '{{номер пп}}' in text and placeholder in text:
            template_row = row
            template_index = i
            break

    if not template_row:
        raise DocumentCreateError('Template row not found in the table.')

    while len(target_table.rows) > template_index + 1:
        target_table._tbl.remove(target_table.rows[-1]._tr)

    for counter, item_value in enumerate(items, 1):
        new_tr = deepcopy(template_row._tr)
        target_table._tbl.append(new_tr)
        row = target_table.rows[-1]
        for cell in row.cells:
            text = cell.text
            text = text.replace('{{номер пп}}', str(counter))
            text = text.replace(placeholder, item_value)
            cell.text = text

    target_table._tbl.remove(template_row._tr)
    return doc


def replace_ins_generate_in_doc(doc, sections, profession) -> Document:
    name_mapping = {
        'general': 'Часть 1',
        'before': 'Часть 2',
        'during': 'Часть 3',
        'accidents': 'Часть 4',
        'after': 'Часть 5',
    }
    for paragraph in doc.paragraphs:
        if "{{профессия}}" in paragraph.text:
            paragraph.text = paragraph.text.replace("{{профессия}}", profession)

        for key, part_name in name_mapping.items():
            if "{{" + part_name + "}}" in paragraph.text:
                section_text = sections.get(key)
                if section_text:
                    paragraph.text = paragraph.text.replace("{{" + part_name + "}}", section_text.get("text", ""))
                else:
                    paragraph.text = paragraph.text.replace("{{" + part_name + "}}", "")

    return doc


async def generate_document_in_memory(
    template_path: str,
    callback: replace_ins_generate_in_doc,
    **kwargs

) -> BytesIO:
    doc = Document(template_path)
    callback_map = {
        'replace_ins_generate_in_doc': replace_ins_generate_in_doc,
        'replace_list_placeholders_in_doc': replace_list_placeholders_in_doc,
    }
    local_placeholders_replace = callback_map.get(callback)
    doc = local_placeholders_replace(doc, **kwargs)
    doc = await replace_global_placeholders_in_doc(doc)
    buf = BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf


def get_nested_value(obj: Any, path: str) -> Any:
    parts = path.split('.')
    current = obj
    try:
        for part in parts:
            if current is None:
                return ''
            if isinstance(current, dict):
                current = current.get(part, None)
            else:
                current = getattr(current, part, None)
        if isinstance(current, (datetime, date)):
            return current.strftime('%d.%m.%Y')
        return current if current is not None else ''
    except Exception as e:
        logger.error(f"Error getting nested value for path '{path}': {e}")
        return ''


async def fill_user_data_in_doc(doc: Document, user: Any) -> Document:
    placeholders_dict = {}
    for item in personal_placeholders:
        key = item['key']
        path = item['value']
        value = get_nested_value(user, path)
        placeholders_dict[key] = str(value) if value is not None else '-'

    replace_in_paragraphs(doc, placeholders_dict)
    replace_in_tables(doc, placeholders_dict)
    replace_in_headers_footers(doc, placeholders_dict)

    return doc


async def fill_user_tables_ins_in_doc(doc: Document, user: User) -> Document:
    ins_titles = [ins.title for ins in user.instructions]
    doc = replace_list_placeholders_in_doc(
        doc,
        items=ins_titles,
        placeholder='{{наименование инструкции работника}}'
    )

    return doc


async def fill_user_tables_norm_siz_in_doc(doc: Document, user) -> Document:
    norm = user.profession.norm
    material_norm_types = []
    if norm:
        material_norm_types = norm.material_norm_types or []

    target_table = None
    for t in doc.tables:
        for row in t.rows:
            row_text = "\n".join([c.text for c in row.cells])
            if "{{номер пп}}" in row_text and "{{Наименование СИЗ}}" in row_text:
                target_table = t
                break
        if target_table:
            break

    if not target_table:
        raise DocumentCreateError("Not found target table for SIZ in the document.")

    template_row = None
    template_index = None
    for i, row in enumerate(target_table.rows):
        text = "\n".join([cell.text for cell in row.cells])
        if "{{номер пп}}" in text and "{{Наименование СИЗ}}" in text:
            template_row = row
            template_index = i
            break

    if not template_row:
        raise DocumentCreateError("Not found template row in the SIZ table.")

    while len(target_table.rows) > template_index + 1:
        target_table._tbl.remove(target_table.rows[-1]._tr)

    if material_norm_types:
        for counter, mat in enumerate(material_norm_types, 1):
            new_tr = deepcopy(template_row._tr)
            target_table._tbl.append(new_tr)
            row = target_table.rows[-1]

            for cell in row.cells:
                text = cell.text
                text = text.replace("{{номер пп}}", str(counter))
                text = text.replace("{{пункт 767}}", str(mat.npa_link))
                text = text.replace("{{Наименование СИЗ}}", mat.material_type.title)
                text = text.replace("{{кол СИЗ}}", str(mat.quantity))
                text = text.replace("{{шт-пар}}", mat.material_type.unit_of_measurement)
                cell.text = text
    else:
        new_tr = deepcopy(template_row._tr)
        target_table._tbl.append(new_tr)
        row = target_table.rows[-1]
        for cell in row.cells:
            cell.text = "-"

    target_table._tbl.remove(template_row._tr)
    return doc


async def fill_user_tables_fact_siz_in_doc(doc: Document, user) -> Document:
    materials = user.materials or []

    target_table = None
    for t in doc.tables:
        for row in t.rows:
            row_text = "\n".join([c.text for c in row.cells])
            if "{{номер пп}}" in row_text and "{{Наименование СИЗ}}" in row_text:
                target_table = t
                break
        if target_table:
            break

    if not target_table:
        raise DocumentCreateError("Not found target table for fact SIZ in the document.")

    template_row = None
    template_index = None
    for i, row in enumerate(target_table.rows):
        text = "\n".join([cell.text for cell in row.cells])
        if "{{номер пп}}" in text and "{{Наименование СИЗ}}" in text:
            template_row = row
            template_index = i
            break

    if not template_row:
        raise DocumentCreateError("Not found template row in the fact SIZ table.")

    while len(target_table.rows) > template_index + 1:
        target_table._tbl.remove(target_table.rows[-1]._tr)

    if materials:
        for counter, mat in enumerate(materials, 1):
            new_tr = deepcopy(template_row._tr)
            target_table._tbl.append(new_tr)
            row = target_table.rows[-1]

            for cell in row.cells:
                text = cell.text
                text = text.replace("{{номер пп}}", str(counter))
                text = text.replace("{{Наименование СИЗ}}", mat.material_type.title)
                text = text.replace("{{кол СИЗ}}", str(mat.quantity))
                text = text.replace("{{шт-пар}}", mat.material_type.unit_of_measurement)
                text = text.replace("{{дата выдачи СИЗ}}", mat.start_date.strftime("%d.%m.%Y") if mat.start_date else "-")
                cell.text = text
    else:
        new_tr = deepcopy(template_row._tr)
        target_table._tbl.append(new_tr)
        row = target_table.rows[-1]
        for cell in row.cells:
            cell.text = "-"

    target_table._tbl.remove(template_row._tr)
    return doc



async def generate_zip_personals_in_memory(
    template_path: str,
    users_data: Sequence[User],
    placeholders: list[Placeholder],
) -> BytesIO:
    zip_buffer = BytesIO()

    with ZipFile(zip_buffer, mode='w', compression=ZIP_DEFLATED) as zip_file:
        for user in users_data:
            doc = Document(template_path)
            doc = await fill_template_placeholders(doc, placeholders)
            doc = await fill_user_data_in_doc(doc, user)
            if doc_contains_placeholder(
                    doc, '{{наименование инструкции работника}}'
            ):
                doc = await fill_user_tables_ins_in_doc(doc, user)
            if doc_contains_placeholder(doc, '{{Наименование СИЗ}}'):
                doc = await fill_user_tables_norm_siz_in_doc(doc, user)
                doc = await fill_user_tables_fact_siz_in_doc(doc, user)
            doc = await replace_global_placeholders_in_doc(doc)

            doc_buffer = BytesIO()
            doc.save(doc_buffer)
            doc_buffer.seek(0)

            user_file_name = f'{user.last_name} {user.name}'
            filename_in_zip = f"{user_file_name }.docx"
            zip_file.writestr(filename_in_zip, doc_buffer.read())

    zip_buffer.seek(0)
    return zip_buffer
