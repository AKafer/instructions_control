from enum import Enum
from typing import List, Dict, ClassVar

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

#FILE TEMPLATES
from enum import Enum
from typing import List

class FileTemplatesNamingEnum(str, Enum):
    # AI helper
    NON_QUALIFY_PROF_LIST = 'non_qualify_prof_list'
    IOT_BLANK = 'iot_blank'
    REQUIRING_TRAINING_SIZ_LIST = 'requiring_training_siz_list'
    TRAINEE_WORKERS_LIST = 'trainee_workers_list'
    INTRODUCTORY_BRIEFING_PROGRAM = 'introductory_briefing_program'

    # Personals
    ACT_REG_INTRO = 'act_reg_intro'
    ACT_REG_CIVIL_DEF = 'act_reg_civil_def'
    ACT_REG_PRIMARY = 'act_reg_primary'
    JOURNAL_INTRO_PRIMARY = 'journal_intro_primary'
    LNNA_ACK = 'lnna_ack'
    LK_SIZ = 'lk_siz'
    ORDER_INTERNSHIP = 'order_internship'
    INTERNSHIP_SHEET = 'internship_sheet'

    # Organization
    JOURNAL_MICRODAMAGE = 'journal_microdamage'
    JOURNAL_ACCIDENTS = 'journal_accidents'
    IOT_FIRST_AID = 'iot_first_aid'
    IOT_SIZ = 'iot_siz'
    LIST_INSTRUCTIONS = 'list_instructions'
    POLICY_SIZ = 'policy_siz'
    POLICY_ACCIDENTS = 'policy_accidents'
    POLICY_TRAINING = 'policy_training'
    POLICY_SUOT = 'policy_suot'
    ORDER_APPROVE_LNA = 'order_approve_lna'
    ORDER_SAN_POSTS = 'order_san_posts'
    ORDER_START_SUOT = 'order_start_suot'
    ORDER_RESPONSIBLE_OT = 'order_responsible_ot'
    PROGRAM_SIZ_USAGE = 'program_siz_usage'
    PROGRAM_GENERAL_SUOT = 'program_general_suot'
    PROGRAM_FIRST_AID = 'program_first_aid'
    PROGRAM_HAZARD_FACTORS = 'program_hazard_factors'
    PROGRAM_WORKPLACE_INTERNSHIP = 'program_workplace_internship'

    @classmethod
    def groups(cls) -> Dict[str, List[str]]:
        return {
            'ai_assistant': [
                'non_qualify_prof_list',
                'iot_blank',
                'requiring_training_siz_list',
                'trainee_workers_list',
                'introductory_briefing_program',
            ],
            'personal': [
                'act_reg_intro',
                'act_reg_civil_def',
                'act_reg_primary',
                'journal_intro_primary',
                'lnna_ack',
                'lk_siz',
                'order_internship',
                'internship_sheet',
            ],
            'organization': [
                'journal_microdamage',
                'journal_accidents',
                'iot_first_aid',
                'iot_siz',
                'list_instructions',
                'policy_siz',
                'policy_accidents',
                'policy_training',
                'policy_suot',
                'order_approve_lna',
                'order_san_posts',
                'order_start_suot',
                'order_responsible_ot',
                'program_siz_usage',
                'program_general_suot',
                'program_first_aid',
                'program_hazard_factors',
                'program_workplace_internship',
            ],
        }

    @classmethod
    def members_of_group(cls, group_name: str) -> List['FileTemplatesNamingEnum']:
        keys = cls.groups().get(group_name, [])
        return [cls(key) for key in keys if key in cls._value2member_map_]

    @classmethod
    def values_of_group(cls, group_name: str) -> List[str]:
        return [m.value for m in cls.members_of_group(group_name)]

    def is_in_group(self, group_name: str) -> bool:
        return self.value in self.groups().get(group_name, [])


personal_placeholders = [
    {'key': '{{фамилия работника}}', 'value': 'last_name'},
    {'key': '{{имя работника}}', 'value': 'name'},
    {'key': '{{отчество работника}}', 'value': 'father_name'},
    {'key': '{{фио подписанта}}', 'value': 'last_name_with_initials'},
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

personal_list_placeholders = [
    {'key': '{{наименование инструкции работника}}', 'value': 'instructions'},
    {'key': '{{наименование инструкции работника}}', 'value': 'meterials'},
]

