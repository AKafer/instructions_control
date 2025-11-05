from externals.http.yandex_llm.promts import (
    NON_QUALIFY_PROF_LIST_PROMPT_TEMPLATE,
)


from externals.http.yandex_llm.yandex_llm_base import YandexLLMClient


class NonQualifyProfListClient(YandexLLMClient):
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
