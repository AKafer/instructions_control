# CACHE
MATERIAL_TYPE_SIMPLE_NEEDS_CACHE_KEY = 'material_type_simple_needs_{id}'
MATERIAL_TYPE_SIMPLE_NEEDS_TTL = 60 * 60 * 24

# API clients
DEFAULT_REQUEST_TIMEOUT_SECONDS = 60

# Failsafe
FAILSAFE_ALLOWED_RETRIES: int = 3
FAILSAFE_BACKOFF_SECONDS: float = 0.2

# LLM
COMPLETION_TEMPERATURE = 0.2
COMPLETION_MAX_TOKENS = 5000

# PLACEHOLDERS
PROFESSION = '{{профессия}}'
POINT_NUMBER = '{{номер пп}}'
INSTRUCTION_NAME = '{{наименование инструкции}}'
INSTRUCTION_USER_NAME = '{{наименование инструкции работника}}'
INSTRUCTION_NUMBER = '{{номер инструкции}}'
NPA_SIZ = '{{пункт 767}}'
QUANTITY_SIZ = '{{кол СИЗ}}'
NAME_SIZ = '{{Наименование СИЗ}}'
START_DATE_SIZ = '{{дата выдачи СИЗ}}'
UNIT_OF_MEASUREMENT_SIZ = '{{шт-пар}}'
NON_QUALIFY_PROF = '{{профессии освобожденные от первичного инструктажа}}'
REQUIRING_TRAINING_SIZ = '{{СИЗ требующие обучения}}'
TRAINEE_WORKERS = '{{профессии кому нужна стажировка}}'
EDUCATION_WORKERS_LIST = '{{профессия}}'
HARM_FACTORS = '{{возможные вредные факторы}}'
PROF_RISKS = '{{возможные проф риски}}'
PRIMARY_PLACEHOLDER = '{{список должностей с первичным}}'
SHOE_PLACEHOLDER = '{{список должностей СИЗ ног}}'

personal_placeholders = [
    {'key': '{{фамилия работника}}', 'value': 'last_name'},
    {'key': '{{имя работника}}', 'value': 'name'},
    {'key': '{{отчество работника}}', 'value': 'father_name'},
    {'key': '{{фио работника}}', 'value': 'last_name_with_initials'},
    {'key': '{{табельный номер}}', 'value': 'number'},
    {'key': '{{профессия работника}}', 'value': 'profession.title'},
    {'key': '{{дата рождения работника}}', 'value': 'date_of_birth'},
    {'key': '{{подразделение работника}}', 'value': 'division.title'},
    {'key': '{{дата поступления на работу}}', 'value': 'started_work'},
    {'key': '{{пол}}', 'value': 'additional_features.gender'},
    {'key': '{{рост}}', 'value': 'additional_features.height'},
    {'key': '{{р-р одежды}}', 'value': 'additional_features.clothing_size'},
    {'key': '{{р-р обуви}}', 'value': 'additional_features.shoe_size'},
    {'key': '{{р-р головы}}', 'value': 'additional_features.head_size'},
    {'key': '{{р-р рук}}', 'value': 'additional_features.gloves_size'},
]
