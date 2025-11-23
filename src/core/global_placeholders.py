from sqlalchemy import select

from database.models import Config
from database.orm import Session

# пример словаря с плейсхолдерами
PLACEHOLDERS = {
    "{{директор}}": "Петров Андрей Говнянович",
    "{{наименование компании}}": "ООО Рога и Копыта",
    "{{адрес компании}}": "г. Москва, ул. Ленина, д. 1",
    "{{профессия подписанта}}": "Генеральный директор",
    "{{дата приказа о ЛНА}}": "01.01.2024",
    "{{номер приказа о ЛНА}}": "123-к",
    "{{фио подписанта}}": "Иванов Иван Иванович",
}


def doc_contains_placeholder(doc, placeholder) -> bool:
    for p in doc.paragraphs:
        if placeholder in p.text:
            return True

    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    if placeholder in p.text:
                        return True

    for section in doc.sections:
        for header_footer in [section.header, section.footer]:
            for p in header_footer.paragraphs:
                if placeholder in p.text:
                    return True
            for table in header_footer.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for p in cell.paragraphs:
                            if placeholder in p.text:
                                return True

    return False

async def get_placeholders() -> dict[str, str]:
    async with Session() as session:
        query = select(Config).where(Config.id == 1)
        config = await session.scalar(query)
        placeholders = config.placeholders
        global_placeholders = placeholders.get("global_placeholders", {})
        placeholders_dict = {}
        for key, item in global_placeholders.items():
            placeholders_dict[item["key"]] = item["value"]
        return placeholders_dict


def replace_in_paragraphs(doc, placeholders: dict[str, str]):
    for p in doc.paragraphs:
        for ph, val in placeholders.items():
            if ph in p.text:
                p.text = p.text.replace(ph, val)
    return doc

def replace_in_tables(doc, placeholders: dict[str, str]):
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    for ph, val in placeholders.items():
                        if ph in p.text:
                            p.text = p.text.replace(ph, val)
    return doc


def replace_in_headers_footers(doc, placeholders: dict[str, str]):
    for section in doc.sections:
        for header in [section.header, section.footer]:
            for p in header.paragraphs:
                for ph, val in placeholders.items():
                    if ph in p.text:
                        p.text = p.text.replace(ph, val)
            for table in header.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for p in cell.paragraphs:
                            for ph, val in placeholders.items():
                                if ph in p.text:
                                    p.text = p.text.replace(ph, val)
    return doc


async def replace_global_placeholders_in_doc(doc):
    placeholders = await get_placeholders()
    doc = replace_in_paragraphs(doc, placeholders)
    doc = replace_in_tables(doc,placeholders)
    doc = replace_in_headers_footers(doc, placeholders)
    return doc


async def fill_template_placeholders(doc, placeholders):
    '''placeholders: list of Placeholder models
    {'key': str, 'value': str}
    '''
    placeholders_dict = {ph.key: ph.value for ph in placeholders}
    doc = replace_in_paragraphs(doc, placeholders_dict)
    doc = replace_in_tables(doc, placeholders_dict)
    doc = replace_in_headers_footers(doc, placeholders_dict)
    return doc
