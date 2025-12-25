from externals.http.yandex_llm.promts import (
    NON_QUALIFY_PROF_LIST_PROMPT_TEMPLATE,
    TRAINEE_WORKERS_LIST_PROMPT_TEMPLATE,
    EDUCATION_WORKERS_LIST_PROMPT_TEMPLATE,
    REQUIRING_TRAINING_SIZ_LIST_PROMPT_TEMPLATE, INTRODUCTORY_BRIEFING_PROGRAM_PROMPT,
    NORM_ISSUANCE_SIZ_PROMPT_TEMPLATE,
)

from externals.http.yandex_llm.yandex_llm_base import YandexLLMClient


class RequiringTrainingSIZListClient(YandexLLMClient):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def build_prompt(self, content: str, *args, **kwargs) -> str:
        return REQUIRING_TRAINING_SIZ_LIST_PROMPT_TEMPLATE

    def get_json_schema(self, content, *args, **kwargs) -> dict:
        return {
            'schema': {
                'type': 'object',
                'properties': {
                    'exempt': {'type': 'array', 'items': {'type': 'string'}}
                },
                'required': ['exempt'],
            }
        }


class NonQualifyProfListClient(YandexLLMClient):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def build_prompt(self, content: str, *args, **kwargs) -> str:
        return NON_QUALIFY_PROF_LIST_PROMPT_TEMPLATE

    def get_json_schema(self, content, *args, **kwargs) -> dict:
        return {
            'schema': {
                'type': 'object',
                'properties': {
                    'exempt': {'type': 'array', 'items': {'type': 'string'}}
                },
                'required': ['exempt'],
            }
        }


class TraineeWorkersListClient(YandexLLMClient):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def build_prompt(self, content: str, *args, **kwargs) -> str:
        return TRAINEE_WORKERS_LIST_PROMPT_TEMPLATE

    def get_json_schema(self, content, *args, **kwargs) -> dict:
        return {
            'schema': {
                'type': 'object',
                'properties': {
                    'exempt': {'type': 'array', 'items': {'type': 'string'}}
                },
                'required': ['exempt'],
            }
        }


class EducationWorkersListClient(YandexLLMClient):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def build_prompt(self, content: str, *args, **kwargs) -> str:
        return EDUCATION_WORKERS_LIST_PROMPT_TEMPLATE

    def get_json_schema(self, content, *args, **kwargs) -> dict:
        return {
            'schema': {
                'type': 'object',
                'properties': {
                    'exempt': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'profession': {'type': 'string'},
                                'programs': {
                                    'type': 'array',
                                    'items': {'type': 'string'},
                                    'description': 'Список кодов программ: ПП, СИЗ, А, Б, В',
                                },
                            },
                            'required': ['profession', 'programs'],
                        },
                    }
                },
                'required': ['exempt'],
            }
        }


class IntroductoryBriefingProgramClient(YandexLLMClient):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def build_prompt(self, content: str, *args, **kwargs) -> str:
        return INTRODUCTORY_BRIEFING_PROGRAM_PROMPT

    def get_json_schema(self, content, *args, **kwargs) -> dict:
        return {
            'schema': {
                'type': 'object',
                'properties': {
                    'exempt': {
                        'type': 'object',
                        'properties': {
                            'factors': {'type': 'array', 'items': {'type': 'string'}},
                            'risks': {'type': 'array', 'items': {'type': 'string'}},
                        },
                        'required': ['factors', 'risks'],
                    }
                },
                'required': ['exempt'],
            }
        }


class NormIssuanceSIZClient(YandexLLMClient):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def build_prompt(self, content: str, *args, **kwargs) -> str:
        return NORM_ISSUANCE_SIZ_PROMPT_TEMPLATE

    def get_json_schema(self, content, *args, **kwargs) -> dict:
        return {
            "schema": {
                "type": "object",
                "properties": {
                    "exempt": {
                        "type": "object",
                        "properties": {
                            "with_primary": {
                                "type": "array",
                                "items": {"type": "string"},
                            }
                        },
                        "required": ["with_primary"],
                    }
                },
                "required": ["exempt"],
            }
        }
