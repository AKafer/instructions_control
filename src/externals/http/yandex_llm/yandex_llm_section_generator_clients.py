import json
from typing import Any, Dict, List, Mapping

from externals.http.yandex_llm.promts import INS_GENERATE_PROMTS, INTRO_BRIEFING_PROMPTS
from externals.http.yandex_llm.yandex_llm_base import (
    YandexLLMClient,
    LLMResonseError,
)

__all__ = [
    'BaseLLMSectionsGenerator',
    'InsGeneratorClient',
    'PrimaryBriefingGeneratorClient',
]


DEFAULT_SEARCH_INDEX = 'fvtd67hlbh1rluemifdn'



class BaseLLMSectionsGenerator(YandexLLMClient):
    LLM_DEFAULT_SEARCH_INDEX: str = DEFAULT_SEARCH_INDEX
    SECTION_PROMPTS: Mapping[str, str] = {}
    RESPONSE_JSON_SCHEMA: dict = {
        'schema': {
            'type': 'object',
            'properties': {
                'title': {'type': 'string'},
                'text': {'type': 'string'},
            },
            'required': ['title', 'text'],
        }
    }

    def __init__(self, **kwargs):
        self.search_index = kwargs.pop('search_index', self.LLM_DEFAULT_SEARCH_INDEX)
        super().__init__(**kwargs)


    def normalize_content(self, content: Any) -> dict:
        raise NotImplementedError

    def build_system_prompt(self, content_dict: dict, section: str) -> str:
        raise NotImplementedError

    def get_sections(self) -> List[str]:
        return list(self.SECTION_PROMPTS.keys())

    def build_user_payload(self, content_dict: dict, section: str) -> str:
        return json.dumps(
            {**content_dict, '_section': section},
            ensure_ascii=False,
        )

    def _build_messages(self, content_dict: dict, section: str) -> List[dict]:
        system_prompt = self.build_system_prompt(content_dict, section).strip()
        system_prompt += (
            '\n\nВозвращай строго JSON-объект в формате:\n'
            '{"title": "<название раздела>", "text": "<сам текст раздела>"}\n'
            'Ничего больше — только валидный JSON (либо JSON в кодовом блоке).'
        )

        user_text = self.build_user_payload(content_dict, section)

        return [
            {'role': 'system', 'text': system_prompt},
            {'role': 'user', 'text': user_text},
        ]

    def _build_payload(self, messages: list) -> dict:
        payload = {
            'modelUri': f'gpt://{self.LLM_FOLDER_ID}/yandexgpt/latest',
            'completionOptions': {
                'stream': False,
                'temperature': self.LLM_COMPLETION_TEMPERATURE,
                'maxTokens': self.LLM_COMPLETION_MAX_TOKENS,
            },
            'messages': messages,
            'json_schema': self.RESPONSE_JSON_SCHEMA,
        }
        if self.search_index:
            payload['searchIndex'] = self.search_index
        return payload

    async def _call_llm(self, payload: dict) -> dict:
        headers = self.get_headers()
        try:
            resp = await self.post(self.llm_uri, json=payload, headers=headers)
        except Exception as exc:
            self.logger.exception('HTTP error when calling LLM')
            raise LLMResonseError(f'HTTP request to LLM failed: {exc}') from exc

        try:
            return self.parse_response(resp)
        except LLMResonseError:
            raise
        except Exception as exc:
            self.logger.exception('Failed to parse LLM response')
            raw = getattr(resp, 'parsed_response', None)
            raise LLMResonseError(
                f'Failed to parse LLM response: {exc}; raw: {raw}'
            ) from exc

    async def generate_section(self, content: Any, section: str) -> Dict[str, str]:
        cd = self.normalize_content(content)
        messages = self._build_messages(cd, section)
        payload = self._build_payload(messages)

        self.logger.debug(
            'LLM payload for section %s: %s',
            section,
            {k: v for k, v in payload.items() if k != 'messages'},
        )
        self.logger.debug(
            'system prompt preview (len=%d), user preview: %s',
            len(messages[0]['text']),
            messages[1]['text'][:200],
        )

        parsed = await self._call_llm(payload)
        if not isinstance(parsed, dict):
            raise LLMResonseError(f'Unexpected parsed response type: {type(parsed)}')

        title = parsed.get('title') or section
        text = parsed.get('text') or ''
        return {'title': title, 'text': text}

    async def generate_all_sections(self, content: Any) -> Dict[str, Dict[str, str]]:
        results: Dict[str, Dict[str, str]] = {}
        for sec in self.get_sections():
            try:
                results[sec] = await self.generate_section(content, sec)
            except LLMResonseError as e:
                self.logger.error('LLM error on section %s: %s', sec, e)
                raise
            except Exception as e:
                self.logger.exception('Unexpected error while generating section %s', sec)
                raise LLMResonseError(f'Unexpected error on section {sec}: {e}') from e
        return results

    async def get_llm_answer(self, content):
        return await self.generate_all_sections(content)


class InsGeneratorClient(BaseLLMSectionsGenerator):
    SECTION_PROMPTS = INS_GENERATE_PROMTS

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def normalize_content(self, content: Any) -> dict:
        if isinstance(content, dict):
            data = content
        else:
            try:
                data = json.loads(content or '{}')
            except json.JSONDecodeError:
                data = {'description': str(content or '')}

        return {
            'profession': (data.get('profession') or '').strip(),
            'description': data.get('description', '') or '',
            'sizo': data.get('sizo', '') or '',
        }

    def build_system_prompt(self, content_dict: dict, section: str) -> str:
        section_template = self.SECTION_PROMPTS.get(
            section, self.SECTION_PROMPTS.get('general', '')
        )
        return section_template.format(
            profession=content_dict['profession'] or 'указанная профессия',
            description=content_dict['description'] or 'указанное описание',
            sizo=content_dict['sizo'] or 'перечень СИЗ',
        ).strip()



class PrimaryBriefingGeneratorClient(BaseLLMSectionsGenerator):
    SECTION_PROMPTS = INTRO_BRIEFING_PROMPTS

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def normalize_content(self, content: Any) -> dict:
        if isinstance(content, dict):
            data = content
        else:
            try:
                data = json.loads(content or '{}')
            except json.JSONDecodeError:
                data = {}

        return {
            'profession': (data.get('profession') or '').strip(),
            'manager_title': (data.get('manager_title') or '').strip(),
            'equipment_hint': (data.get('equipment_hint') or '').strip(),
        }

    def build_system_prompt(self, content_dict: dict, section: str) -> str:
        template = self.SECTION_PROMPTS.get(
            section, self.SECTION_PROMPTS.get('general', '')
        )
        return template.format(
            profession=content_dict['profession'] or 'указанная профессия',
            manager_title=content_dict['manager_title'] or 'непосредственный руководитель',
            equipment_hint=content_dict['equipment_hint'] or 'используемое оборудование',
        ).strip()

