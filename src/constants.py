MATERIAL_TYPE_SIMPLE_NEEDS_CACHE_KEY = 'material_type_simple_needs_{id}'
MATERIAL_TYPE_SIMPLE_NEEDS_TTL = 60 * 60 * 24

# API clients
DEFAULT_REQUEST_TIMEOUT_SECONDS = 10


# Failsafe
FAILSAFE_ALLOWED_RETRIES: int = 3
FAILSAFE_BACKOFF_SECONDS: float = 0.2

# LLM
MIN_NUMBER_OF_QUESTIONS = 1
MAX_NUMBER_OF_QUESTIONS = 20
WORDS_PER_QUESTION = 120
PROMPT_TEMPLATE = """
Ты генерируешь тест по переданному тексту.
ОТВЕЧАЙ СТРОГО В ВИДЕ ВАЛИДНОГО JSON, БЕЗ ЛИШНИХ ПРЕАМБУЛ И БЕЗ ``` КОД-БЛОКОВ.

Сделай ~{target_q} вопросов (можно отклониться при необходимости),
но в пределах {min_q}–{max_q} вопросов, в зависимости от объёма и разнообразия идей текста.

СХЕМА ОТВЕТА:
{{
  "questions": [
    {{
      "id": 1,
      "question": "Текст вопроса",
      "answers": [
        {{"id": 1, "text": "вариант ответа 1"}},
        {{"id": 2, "text": "вариант ответа 2"}},
        {{"id": 3, "text": "вариант ответа 3"}}
      ],
      "correct_answer_id": 1
    }}
  ]
}}

ТРЕБОВАНИЯ:
- Каждый вопрос с 3-4 ответами.
- correct_answer_id ∈ {{1,2,3,4}}.
- Русский язык.
- НИКАКИХ лишних полей и текста вне JSON.
- НИКАКИХ код-блоков и подсветки.
"""
