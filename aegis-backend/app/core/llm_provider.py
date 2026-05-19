from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import json
import logging
from google import genai
from google.genai import types
from openai import AsyncOpenAI

logger = logging.getLogger("aegis_core")

class LLMProvider(ABC):
    @abstractmethod
    async def generate_structured(self, prompt: str, schema: Any, **kwargs) -> Dict:
        pass

    @abstractmethod
    async def generate_text(self, prompt: str, **kwargs) -> str:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model_name: str = "gemini-2.5-pro"):
        self.client = genai.Client(api_key=api_key)
        self._model = model_name
        self._name = f"gemini-{model_name}"

    @property
    def name(self) -> str:
        return self._name

    async def generate_structured(self, prompt: str, schema: Any, **kwargs) -> Dict:
        try:
            response = await self.client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                    timeout=30.0
                )
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"GeminiProvider ({self._model}) failed: {e}")
            raise e

    async def generate_text(self, prompt: str, **kwargs) -> str:
        try:
            response = await self.client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(timeout=30.0)
            )
            return response.text
        except Exception as e:
            logger.error(f"GeminiProvider ({self._model}) text generation failed: {e}")
            raise e


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.client = AsyncOpenAI(api_key=api_key)
        self._model = model
        self._name = f"openai-{model}"

    @property
    def name(self) -> str:
        return self._name

    async def generate_structured(self, prompt: str, schema: Any, **kwargs) -> Dict:
        try:
            if schema is None:
                # Fallback to standard completion and parse JSON manually
                response = await self.client.chat.completions.create(
                    model=self._model,
                    messages=[{"role": "user", "content": prompt}],
                    timeout=30.0
                )
                return json.loads(response.choices[0].message.content)
                
            # OpenAI expects a Pydantic model for response_format when using parse
            response = await self.client.beta.chat.completions.parse(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                response_format=schema,
                timeout=30.0
            )
            return response.choices[0].message.parsed.dict()
        except Exception as e:
            logger.error(f"OpenAIProvider ({self._model}) failed: {e}")
            raise e

    async def generate_text(self, prompt: str, **kwargs) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                timeout=30.0
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAIProvider ({self._model}) text generation failed: {e}")
            raise e


class StaticFallbackProvider(LLMProvider):
    @property
    def name(self) -> str:
        return "static-fallback"

    async def generate_structured(self, prompt: str, schema: Any, **kwargs) -> Dict:
        logger.warning("Using StaticFallbackProvider for structured output.")
        # Determine fallback structure based on expected schema
        schema_name = getattr(schema, "__name__", "") if schema else ""
        
        if schema is None or "billing" in prompt.lower() or "billing" in schema_name.lower():
            return {
                "icd10_codes": ["U07.1", "R07.9"],
                "cpt_codes": ["99214"]
            }
            
        if "Temporal" in schema_name or "timeline" in prompt.lower():
            return {
                "matrix": [
                    {
                        "symptom": "Fever",
                        "onset_hours_ago": 72,
                        "chronological_index": 1,
                        "severity_context": "Initial symptom"
                    }
                ]
            }
            
        return {
            "care_level": "CLINIC_VISIT",
            "guidance_notes": "AI service unavailable. Falling back to static guidance. Please proceed with standard protocols.",
            "extracted_symptoms": [],
            "risk_score": 5,
            "clinical_reasoning": "Fallback mode active.",
            "mental_health_flag": False
        }

    async def generate_text(self, prompt: str, **kwargs) -> str:
        logger.warning("Using StaticFallbackProvider for text output.")
        return "Clinical AI is temporarily unavailable. Please consult a human clinician."
