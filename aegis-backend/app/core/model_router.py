import logging
import json
import os
import time
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.core.llm_provider import LLMProvider, GeminiProvider, OpenAIProvider, StaticFallbackProvider
from app.harness.gatekeeper import gatekeeper

logger = logging.getLogger("aegis_enterprise.model_router")

class CircuitBreakerState:
    CLOSED = "CLOSED"
    OPEN = "OPEN"

class CircuitBreakerRecord:
    def __init__(self):
        self.state = CircuitBreakerState.CLOSED
        self.last_failure_time = 0
        self.failure_count = 0

class ModelRouter:
    """
    Multi-provider LLM router with fallback chain and circuit breakers.
    Ensures high availability and resilience for clinical triage.
    """
    def __init__(self):
        self.providers: List[LLMProvider] = []
        self._init_providers()
        self.current_provider_index = 0
        self.circuit_breakers: Dict[str, CircuitBreakerRecord] = {}
        self.recovery_timeout = 60  # seconds

    def _init_providers(self):
        # Order matters – highest priority first
        if settings.GOOGLE_GENAI_API_KEY:
            self.providers.append(GeminiProvider(settings.GOOGLE_GENAI_API_KEY, "gemini-2.5-pro"))
            self.providers.append(GeminiProvider(settings.GOOGLE_GENAI_API_KEY, "gemini-2.5-flash"))
            
        # Check for OpenAI key
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.providers.append(OpenAIProvider(openai_key, "gpt-4o"))
            
        # Always keep static fallback at the end
        self.providers.append(StaticFallbackProvider())
        
        logger.info(f"Initialized {len(self.providers)} LLM providers.")

    async def _get_working_provider(self) -> LLMProvider:
        """Try providers in order, skip those that are circuit‑broken."""
        start = self.current_provider_index
        now = time.time()
        
        for i in range(len(self.providers)):
            idx = (start + i) % len(self.providers)
            provider = self.providers[idx]
            
            # Check circuit breaker state
            cb = self.circuit_breakers.get(provider.name)
            if cb and cb.state == CircuitBreakerState.OPEN:
                # Check if recovery timeout has passed
                if now - cb.last_failure_time > self.recovery_timeout:
                    logger.info(f"Circuit breaker for {provider.name} entering HALF-OPEN state (timeout passed).")
                    cb.state = CircuitBreakerState.CLOSED # Try it again
                else:
                    continue # Skip this provider
                    
            self.current_provider_index = idx
            return provider
            
        # If all providers are down, fall back to static template provider
        return self.providers[-1]  # StaticFallbackProvider

    async def execute_triage(self, prompt: str, schema: Any, **kwargs) -> Any:
        # 1. Gatekeeper Emergency Bypass Check
        if gatekeeper.check_for_bypass(prompt):
            logger.warning("Gatekeeper emergency bypass triggered in ModelRouter. Returning immediate ER care level.")
            return {
                "care_level": "EMERGENCY_ROOM",
                "guidance_notes": "EMERGENCY DETECTED. Proceed to the nearest emergency room immediately.",
                "extracted_symptoms": ["Critical symptoms detected via bypass"],
                "risk_score": 10,
                "clinical_reasoning": "Emergency regex triggered.",
                "mental_health_flag": False
            }

        provider = await self._get_working_provider()
        
        try:
            logger.info(f"Executing triage using provider: {provider.name}")
            start_time = time.time()
            
            result = await provider.generate_structured(prompt, schema, **kwargs)
            
            duration = time.time() - start_time
            logger.info(f"Provider {provider.name} succeeded in {duration:.2f}s.")
            
            # On success, close circuit if it was open
            if provider.name in self.circuit_breakers:
                cb = self.circuit_breakers[provider.name]
                cb.state = CircuitBreakerState.CLOSED
                cb.failure_count = 0
                
            # TODO: Log token usage here if provider returns it
            
            return result
            
        except Exception as e:
            # Mark this provider as failed and retry with next
            logger.warning(f"Provider {provider.name} failed: {e}. Opening circuit and trying next.")
            
            if provider.name not in self.circuit_breakers:
                self.circuit_breakers[provider.name] = CircuitBreakerRecord()
                
            cb = self.circuit_breakers[provider.name]
            cb.state = CircuitBreakerState.OPEN
            cb.last_failure_time = time.time()
            cb.failure_count += 1
            
            # Recursively try again (avoid infinite loop by ensuring we don't reuse same provider)
            return await self.execute_triage(prompt, schema, **kwargs)

    async def execute_text(self, prompt: str, **kwargs) -> str:
        provider = await self._get_working_provider()
        
        try:
            logger.info(f"Executing text generation using provider: {provider.name}")
            start_time = time.time()
            
            result = await provider.generate_text(prompt, **kwargs)
            
            duration = time.time() - start_time
            logger.info(f"Provider {provider.name} succeeded in {duration:.2f}s.")
            
            # On success, close circuit if it was open
            if provider.name in self.circuit_breakers:
                cb = self.circuit_breakers[provider.name]
                cb.state = CircuitBreakerState.CLOSED
                cb.failure_count = 0
                
            return result
            
        except Exception as e:
            logger.warning(f"Provider {provider.name} failed: {e}. Opening circuit and trying next.")
            
            if provider.name not in self.circuit_breakers:
                self.circuit_breakers[provider.name] = CircuitBreakerRecord()
                
            cb = self.circuit_breakers[provider.name]
            cb.state = CircuitBreakerState.OPEN
            cb.last_failure_time = time.time()
            cb.failure_count += 1
            
            return await self.execute_text(prompt, **kwargs)

llm_router = ModelRouter()
