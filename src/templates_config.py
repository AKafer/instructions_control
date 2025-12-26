from enum import Enum
from typing import Any, Dict, List, Optional, Type

from constants import (
    EDUCATION_WORKERS_LIST,
    NON_QUALIFY_PROF,
    REQUIRING_TRAINING_SIZ,
    TRAINEE_WORKERS,
)
from database.models import MaterialTypes, Professions
from externals.http.yandex_llm.yandex_llm_section_generator_clients import (
    InsGeneratorClient,
    PrimaryBriefingGeneratorClient,
)
from externals.http.yandex_llm.yandex_llm_simple_list_clients import (
    EducationWorkersListClient,
    IntroductoryBriefingProgramClient,
    NonQualifyProfListClient,
    NormIssuanceSIZClient,
    RequiringTrainingSIZListClient,
    TraineeWorkersListClient,
)

MODEL_MAPPING = {
    'profession': Professions,
    'siz': MaterialTypes,
    'skip': None,
}

# FILE TEMPLATES
TEMPLATE_MAPPING: Dict[str, Dict[str, Any]] = {
    # ===================== AI ASSISTANT =====================
    'non_qualify_prof_list': {
        'key': 'NON_QUALIFY_PROF_LIST',
        'group': 'ai_assistant',
        'client_class': NonQualifyProfListClient,
        'placeholder': NON_QUALIFY_PROF,
        'callback': 'replace_simple_list_placeholders_in_doc',
        'content': (
            'Список профессий: {items_list_str}\n\n'
            'Выбери только те профессии, которые могут быть '
            'освобождены от первичного инструктажа.'
        ),
    },
    'requiring_training_siz_list': {
        'key': 'REQUIRING_TRAINING_SIZ_LIST',
        'group': 'ai_assistant',
        'client_class': RequiringTrainingSIZListClient,
        'placeholder': REQUIRING_TRAINING_SIZ,
        'callback': 'replace_simple_list_placeholders_in_doc',
        'content': (
            'Список средств индивидуальной защиты: {items_list_str}\n\n'
            'Выбери только те СИЗ, применение которых требует практических навыков. '
            'Не включай простые элементы (например, сигнальные жилеты, белье, очки без особой настройки).'
        ),
    },
    'trainee_workers_list': {
        'key': 'TRAINEE_WORKERS_LIST',
        'group': 'ai_assistant',
        'client_class': TraineeWorkersListClient,
        'placeholder': TRAINEE_WORKERS,
        'callback': 'replace_simple_list_placeholders_in_doc',
        'content': (
            'Список профессий: {items_list_str}\n\n'
            'Выбери только те профессии, для которых '
            'обязательно прохождение стажировки на рабочем месте.'
        ),
    },
    'education_workers_list': {
        'key': 'EDUCATION_WORKERS_LIST',
        'group': 'ai_assistant',
        'client_class': EducationWorkersListClient,
        'placeholder': EDUCATION_WORKERS_LIST,
        'callback': 'replace_program_matrix_in_doc',
        'content': (
            'Вот список профессий: {items_list_str}\n\n'
            'Распредели программы обучения согласно правилам выше.'
        ),
    },
    'iot_blank': {
        'key': 'IOT_BLANK',
        'group': 'ai_assistant',
        'client_class': InsGeneratorClient,
        'placeholder': None,
        'callback': None,
        'content': ('profession', 'description', 'sizo'),
    },
    'introductory_briefing_program': {
        'key': 'INTRODUCTORY_BRIEFING_PROGRAM',
        'group': 'ai_assistant',
        'client_class': IntroductoryBriefingProgramClient,
        'placeholder': None,
        'callback': 'replace_introductory_briefing_program_in_doc',
        'content': '',
    },
    'primary_briefing_program': {
        'key': 'PRIMARY_BRIEFING_PROGRAM',
        'group': 'ai_assistant',
        'client_class': PrimaryBriefingGeneratorClient,
        'placeholder': None,
        'callback': None,
        'content': ('profession', 'manager_title', 'equipment_hint'),
    },
    'norms_dsiz_issuance': {
        'key': 'NORMS_DSIZ_ISSUANCE',
        'group': 'ai_assistant',
        'client_class': NormIssuanceSIZClient,
        'placeholder': None,
        'callback': 'replace_norms_dsiz_issuance_in_doc',
        'content': 'Вот список профессий: {items_list_str}\n\n',
    },
    # ===================== PERSONAL =====================
    'act_reg_intro': {
        'key': 'ACT_REG_INTRO',
        'group': 'personal',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'act_reg_civil_def': {
        'key': 'ACT_REG_CIVIL_DEF',
        'group': 'personal',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'act_reg_primary': {
        'key': 'ACT_REG_PRIMARY',
        'group': 'personal',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'journal_intro_primary': {
        'key': 'JOURNAL_INTRO_PRIMARY',
        'group': 'personal',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'lnna_ack': {
        'key': 'LNNA_ACK',
        'group': 'personal',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'lk_siz': {
        'key': 'LK_SIZ',
        'group': 'personal',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'order_internship': {
        'key': 'ORDER_INTERNSHIP',
        'group': 'personal',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'internship_sheet': {
        'key': 'INTERNSHIP_SHEET',
        'group': 'personal',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'ref_medical_exam': {
        'key': 'REF_MEDICAL_EXAM',
        'group': 'personal',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'knowledge_testing_protocol': {
        'key': 'KNOWLEDGE_TESTING_PROTOCOL',
        'group': 'personal',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    # ===================== ORGANIZATION =====================
    'journal_microdamage': {
        'key': 'JOURNAL_MICRODAMAGE',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'journal_accidents': {
        'key': 'JOURNAL_ACCIDENTS',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'iot_first_aid': {
        'key': 'IOT_FIRST_AID',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'iot_siz': {
        'key': 'IOT_SIZ',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'list_instructions': {
        'key': 'LIST_INSTRUCTIONS',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'policy_siz': {
        'key': 'POLICY_SIZ',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'policy_accidents': {
        'key': 'POLICY_ACCIDENTS',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'policy_training': {
        'key': 'POLICY_TRAINING',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'policy_suot': {
        'key': 'POLICY_SUOT',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'order_approve_lna': {
        'key': 'ORDER_APPROVE_LNA',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'order_san_posts': {
        'key': 'ORDER_SAN_POSTS',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'order_start_suot': {
        'key': 'ORDER_START_SUOT',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'order_responsible_ot': {
        'key': 'ORDER_RESPONSIBLE_OT',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'program_siz_usage': {
        'key': 'PROGRAM_SIZ_USAGE',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'program_general_suot': {
        'key': 'PROGRAM_GENERAL_SUOT',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'program_first_aid': {
        'key': 'PROGRAM_FIRST_AID',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'program_hazard_factors': {
        'key': 'PROGRAM_HAZARD_FACTORS',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'program_workplace_internship': {
        'key': 'PROGRAM_WORKPLACE_INTERNSHIP',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
    'norm_issuance_siz': {
        'key': 'NORM_ISSUANCE_SIZ',
        'group': 'organization',
        'client_class': None,
        'placeholder': None,
        'callback': None,
        'content': '',
    },
}


class TemplateRegistry:
    mapping: Dict[str, Dict[str, Any]] = TEMPLATE_MAPPING
    _enum: Optional[Type[Enum]] = None

    @classmethod
    def enum(cls) -> Type[Enum]:
        if cls._enum is None:
            cls._enum = Enum(
                'FileTemplatesNamingEnum',
                {v['key']: k for k, v in cls.mapping.items()},
                type=str,
            )
        return cls._enum

    @classmethod
    def get(cls, template_code: str) -> Dict[str, Any]:
        return cls.mapping[template_code]

    @classmethod
    def get_by_enum(cls, enum_member: Enum) -> Dict[str, Any]:
        return cls.mapping[enum_member.value]

    @classmethod
    def groups(cls) -> Dict[str, List[str]]:
        """
        {'ai_assistant': [...], 'personal': [...], 'organization': [...]}
        """
        groups: Dict[str, List[str]] = {}
        for code, data in cls.mapping.items():
            grp = data.get('group')
            if not grp:
                continue
            groups.setdefault(grp, []).append(code)
        return groups

    @classmethod
    def values_of_group(cls, group_name: str) -> List[str]:
        return cls.groups().get(group_name, [])

    @classmethod
    def members_of_group(cls, group_name: str) -> List[Enum]:
        enum_cls = cls.enum()
        values = set(cls.values_of_group(group_name))
        return [m for m in enum_cls if m.value in values]

    @classmethod
    def is_in_group(cls, template_code: str, group_name: str) -> bool:
        return template_code in cls.values_of_group(group_name)

    @classmethod
    def validate(cls) -> None:
        keys = []
        for code, data in cls.mapping.items():
            if 'key' not in data:
                raise ValueError(f"Template '{code}' missing 'key'")
            if 'group' not in data:
                raise ValueError(f"Template '{code}' missing 'group'")
            keys.append(data['key'])

        if len(keys) != len(set(keys)):
            raise ValueError(
                "Duplicate 'key' values found in TEMPLATE_MAPPING"
            )


FileTemplatesNamingEnum = TemplateRegistry.enum()
