import json
from typing import Any, Dict

from externals.http.yandex_llm.promts import INS_GENERATE_PROMTS
from externals.http.yandex_llm.yandex_llm_base import YandexLLMClient, LLMResonseError

DEFAULT_SEARCH_INDEX = "fvtd67hlbh1rluemifdn"


class InsGeneratorClient(YandexLLMClient):
    LLM_DEFAULT_SEARCH_INDEX: str = DEFAULT_SEARCH_INDEX

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.search_index = kwargs.pop('search_index', self.LLM_DEFAULT_SEARCH_INDEX)

    def _normalize_content(self, content: Any) -> dict:
        if isinstance(content, dict):
            data = content
        else:
            try:
                data = json.loads(content or "{}")
            except json.JSONDecodeError:
                data = {"description": str(content or "")}
        return {
            "profession": (data.get("profession") or "").strip(),
            "description": data.get("description", "") or "",
            "sizo": data.get("sizo", "") or "",
        }

    def _build_messages_and_schema(self, content_dict: dict, section: str):
        section_template = INS_GENERATE_PROMTS.get(section, INS_GENERATE_PROMTS.get("general", ""))
        system_prompt = section_template.format(
            profession=content_dict["profession"] or "указанная профессия",
            description=content_dict["description"] or "указанное описание",
            sizo=content_dict["sizo"] or "перечень СИЗ",
        ).strip()
        system_prompt += (
            "\n\nВозвращай строго JSON-объект в формате:\n"
            '{"title": "<название раздела>", "text": "<сам текст раздела>"}\n'
            "Ничего больше — только валидный JSON (либо JSON в кодовом блоке)."
        )
        user_text = json.dumps({
            "profession": content_dict["profession"],
            "description": content_dict["description"],
            "sizo": content_dict["sizo"],
            "_section": section
        }, ensure_ascii=False)

        json_schema = {
            "schema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "text": {"type": "string"},
                },
                "required": ["title", "text"],
            }
        }
        messages = [
            {"role": "system", "text": system_prompt},
            {"role": "user", "text": user_text},
        ]

        return messages, json_schema

    def _build_payload(self, messages: list, json_schema: dict) -> dict:
        payload = {
            "modelUri": f"gpt://{self.LLM_FOLDER_ID}/yandexgpt/latest",
            "completionOptions": {
                "stream": False,
                "temperature": self.LLM_COMPLETION_TEMPERATURE,
                "maxTokens": self.LLM_COMPLETION_MAX_TOKENS,
            },
            "messages": messages,
            "json_schema": json_schema,
        }
        if self.search_index:
            payload["searchIndex"] = self.search_index
        return payload

    async def _call_llm(self, payload: dict) -> dict:
        headers = self.get_headers()
        try:
            resp = await self.post(self.llm_uri, json=payload, headers=headers)
        except Exception as exc:
            self.logger.exception("HTTP error when calling LLM")
            raise LLMResonseError(f"HTTP request to LLM failed: {exc}") from exc
        try:
            parsed = self.parse_response(resp)
            return parsed
        except LLMResonseError:
            raise
        except Exception as exc:
            self.logger.exception("Failed to parse LLM response")
            raw = getattr(resp, "parsed_response", None)
            raise LLMResonseError(f"Failed to parse LLM response: {exc}; raw: {raw}") from exc

    async def generate_section(self, content: Any, section: str) -> Dict[str, str]:
        cd = self._normalize_content(content)
        messages, json_schema = self._build_messages_and_schema(cd, section)
        payload = self._build_payload(messages, json_schema)
        self.logger.debug("LLM payload for section %s: %s", section, {k: v for k, v in payload.items() if k != "messages"} )
        self.logger.debug("system prompt preview (len=%d), user preview: %s", len(messages[0]["text"]), messages[1]["text"][:200])
        parsed = await self._call_llm(payload)
        if not isinstance(parsed, dict):
            raise LLMResonseError(f"Unexpected parsed response type: {type(parsed)}")
        title = parsed.get("title") or section
        text = parsed.get("text") or ""
        return {"title": title, "text": text}

    async def generate_all_sections(self, content: Any) -> Dict[str, Dict[str, str]]:
        results: Dict[str, Dict[str, str]] = {}
        for sec in INS_GENERATE_PROMTS.keys():
            try:
                results[sec] = await self.generate_section(content, sec)
            except LLMResonseError as e:
                self.logger.error("LLM error on section %s: %s", sec, e)
                raise
            except Exception as e:
                self.logger.exception("Unexpected error while generating section %s", sec)
                raise LLMResonseError(f"Unexpected error on section {sec}: {e}") from e
        return results

    async def get_llm_answer(self, content):
        return await self.generate_all_sections(content)
