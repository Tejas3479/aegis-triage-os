# 🧠 AI, NLP & Privacy Models

## Clinical Reasoning Engine

We use **LangGraph** to orchestrate a stateful, multi‑agent conversation. The graph maintains a session‑scoped state that persists across turns, allowing the AI to remember previous symptoms and refine its diagnosis.

The underlying LLM is **Gemini 2.5 Pro** (configurable fallback). Structured outputs are enforced using Gemini’s `response_schema` (JSON schema) to guarantee that every clinical assessment contains required fields: `extracted_symptoms`, `care_level`, `risk_score`, etc.

## Speech‑to‑Text (STT)

Two modes are supported:

- **Local (default)** – Uses Vosk (offline) with ffmpeg to convert audio to 16kHz mono WAV. No audio leaves the hospital network.
- **Cloud** – Uses Gemini’s speech recognition (only when `STT_PROVIDER=cloud`).

## PII Redaction (Presidio)

Before sending any patient narrative to the LLM, the `pii_vault` scans for:

- Person names (`PERSON`)
- Phone numbers (Indian format)
- Email addresses
- Aadhaar numbers (XXXX XXXX XXXX)
- Custom medical IDs

Matched entities are replaced with `[ANONYMIZED_PATIENT_DATA]`. If Presidio is unavailable, a regex fallback is used.

## Outbreak Clustering

The `/public-health/outbreaks` endpoint runs **HDBSCAN** on geolocation data from triage sessions. It uses the **Haversine** metric (true spherical distance) to cluster points within ~1.5 km. The result is a set of clusters with their center coordinates and case density.

## Model Fallback & Resilience

The `ModelRouter` maintains a chain of providers (Gemini → OpenAI → Anthropic → static fallback). Each call is wrapped with a circuit breaker and exponential backoff retries. Token usage per provider is logged for cost monitoring.
