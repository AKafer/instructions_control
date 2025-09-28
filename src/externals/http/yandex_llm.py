import settings
from constants import (
    WORDS_PER_QUESTION,
    PROMPT_TEMPLATE,
    MIN_NUMBER_OF_QUESTIONS,
    MAX_NUMBER_OF_QUESTIONS,
)
from externals.http.base import BaseApiClient


class YandexLLMClient(BaseApiClient):
    base_url = settings.YANDEX_LLM_API_URL
    llm_uri = settings.YANDEX_LLM_API_URI

    def estimate_target_questions(
        self, content: str, min_q: int, max_q: int
    ) -> int:
        words = max(1, len(content.split()))
        target = round(words / WORDS_PER_QUESTION)
        return max(min_q, min(max_q, target or min_q))

    def build_prompt(
        self,
        content: str,
        min_q=MIN_NUMBER_OF_QUESTIONS,
        max_q=MAX_NUMBER_OF_QUESTIONS,
        target_q=None,
    ) -> str:
        target_q = target_q or self.estimate_target_questions(
            content, min_q, max_q
        )
        return PROMPT_TEMPLATE.format(
            min_q=min_q, max_q=max_q, target_q=target_q
        )

    def get_data(self, content: str, target_q=10) -> dict:
        prompt = self.build_prompt(content, target_q=target_q)
        return {
            'modelUri': f'gpt://{settings.YANDEX_LLM_FOLDER_ID}/yandexgpt/latest',
            'completionOptions': {
                'stream': False,
                'temperature': 0.2,
                'maxTokens': 5000,
            },
            'messages': [
                {'role': 'system', 'text': prompt},
                {'role': 'user', 'text': content},
            ],
        }

    def get_headers(self):
        return {
            'Authorization': f'Bearer {settings.YANDEX_LLM_API_KEY}',
            'Content-Type': 'application/json',
            'x-folder-id': settings.YANDEX_LLM_FOLDER_ID,
        }

    async def get_llm_questions(self, content):
        headers = self.get_headers()
        data = self.get_data(content)
        return await self.post(self.llm_uri, json=data, headers=headers)
