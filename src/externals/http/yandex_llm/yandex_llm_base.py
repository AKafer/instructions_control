import json
import re

import settings
from constants import (
    COMPLETION_TEMPERATURE,
    COMPLETION_MAX_TOKENS,
)
from externals.http.base import BaseApiClient


class LLMResonseError(Exception):
    pass


class YandexLLMClient(BaseApiClient):
    base_url = settings.YANDEX_LLM_API_URL
    llm_uri = settings.YANDEX_LLM_API_URI

    LLM_API_KEY: str = settings.YANDEX_LLM_API_KEY
    LLM_FOLDER_ID: str = settings.YANDEX_LLM_FOLDER_ID
    LLM_COMPLETION_TEMPERATURE: float = COMPLETION_TEMPERATURE
    LLM_COMPLETION_MAX_TOKENS: int = COMPLETION_MAX_TOKENS
    MAX_TEXT_LEN: int = 300

    def __init__(self, **kwargs):
        self.search_index = kwargs.pop('search_index', None)
        super().__init__(**kwargs)

    def build_prompt(self, content, *args, **kwargs) -> str:
        return ''

    def get_data(self, content: str) -> dict:
        prompt = self.build_prompt(content)
        messages = [{'role': 'system', 'text': prompt}]
        if content and content.strip():
            messages.append({'role': 'user', 'text': content})

        payload = {
            'modelUri': f'gpt://{self.LLM_FOLDER_ID}/yandexgpt/latest',
            'completionOptions': {
                'stream': False,
                'temperature': self.LLM_COMPLETION_TEMPERATURE,
                'maxTokens': self.LLM_COMPLETION_MAX_TOKENS,
            },
            'messages': messages,
            'json_schema': self.get_json_schema(content),
        }

        if self.search_index:
            payload['searchIndex'] = self.search_index

        return payload

    def get_headers(self):
        return {
            'Authorization': f'Bearer {self.LLM_API_KEY}',
            'Content-Type': 'application/json',
            'x-folder-id': self.LLM_FOLDER_ID,
        }

    def get_json_schema(self, content, *args, **kwargs) -> dict:
        return {}

    async def get_llm_answer(self, content):
        headers = self.get_headers()
        data = self.get_data(content)
        llm_response = await self.post(
            self.llm_uri, json=data, headers=headers
        )
        return self.parse_response(llm_response)

    def extract_json_from_text(self, text: str):
        s = text.strip()
        s = re.sub(r'^\s*```(?:json)?\s*', '', s, flags=re.IGNORECASE)
        s = re.sub(r'\s*```\s*$', '', s)
        i, j = s.find('{'), s.rfind('}')
        if i == -1 or j == -1 or i >= j:
            raise ValueError('No JSON object found in LLM response text')
        return json.loads(s[i : j + 1])

    def parse_response(self, response):
        if response.status != 200:
            raise LLMResonseError(
                f'LLM request failed with status'
                f' {response.status}: {response.parsed_response}'
            )
        try:
            text = response.parsed_response['result']['alternatives'][0][
                'message'
            ]['text']
        except (TypeError, KeyError, IndexError):
            raise LLMResonseError(
                f'Bad LLM response structure {response.parsed_response}'
            )

        text_str = str(text)
        if len(text_str) > self.MAX_TEXT_LEN:
            text_str = text_str[: self.MAX_TEXT_LEN] + '...'

        try:
            return self.extract_json_from_text(text)
        except Exception as e:
            raise LLMResonseError(
                f'Failed to parse JSON: {e}, response text: {text_str}'
            )
