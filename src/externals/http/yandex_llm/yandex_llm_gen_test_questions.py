from externals.http.yandex_llm.promts import (
    QUESTIONS_FOR_TESTS_PROMPT_TEMPLATE,
)
from externals.http.yandex_llm.yandex_llm_base import YandexLLMClient


MIN_NUMBER_OF_QUESTIONS = 1
MAX_NUMBER_OF_QUESTIONS = 20
WORDS_PER_QUESTION = 100


class QuestionsForTestsLLMClient(YandexLLMClient):
    def estimate_target_questions(
        self, content: str, min_q: int, max_q: int
    ) -> int:
        words = max(1, len(content.split()))
        target = round(words / WORDS_PER_QUESTION)
        return max(min_q, min(max_q, target or min_q))

    def build_prompt(self, content: str, *args, **kwargs) -> str:
        min_q = MIN_NUMBER_OF_QUESTIONS
        max_q = MAX_NUMBER_OF_QUESTIONS
        target_q = self.estimate_target_questions(content, min_q, max_q)
        return QUESTIONS_FOR_TESTS_PROMPT_TEMPLATE.format(
            min_q=min_q, max_q=max_q, target_q=target_q
        )

    def get_json_schema(self, content, *args, **kwargs) -> dict:
        min_q = MIN_NUMBER_OF_QUESTIONS
        max_q = MAX_NUMBER_OF_QUESTIONS
        target_q = self.estimate_target_questions(content, min_q, max_q)
        return {
            'schema': {
                'properties': {
                    'questions': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'integer'},
                                'question': {'type': 'string'},
                                'answers': {
                                    'type': 'array',
                                    'items': {
                                        'type': 'object',
                                        'properties': {
                                            'id': {'type': 'integer'},
                                            'text': {'type': 'string'},
                                        },
                                        'required': ['id', 'text'],
                                    },
                                    'minItems': 3,
                                    'maxItems': 4,
                                },
                                'correct_answer_id': {'type': 'integer'},
                            },
                            'required': [
                                'id',
                                'question',
                                'answers',
                                'correct_answer_id',
                            ],
                        },
                        'minItems': min(1, target_q),
                        'maxItems': max(1, target_q),
                    }
                },
            },
            'required': ['questions'],
            'type': 'object',
        }
