# 🏛️ System Architecture

Aegis Triage OS operates on an Enterprise Domain-Driven Design (DDD), decoupling the frontend interface from the heavy ML inference engine.

## The Pipeline
1. **Patient Interface (Next.js PWA):** The patient interacts via a mobile-first Progressive Web App. Voice data is captured via `MediaRecorder` and packaged into a `.webm` or `.wav` blob.
2. **Offline Resilience Wrapper:** Service Workers (`next-pwa`) ensure the app caches locally. If rural 4G drops, the UI queues the payload and synchronizes when the network returns.
3. **The API Gateway (FastAPI):** The payload hits our Render-hosted Python backend. 
4. **The PII Vault:** Before inference, Microsoft Presidio and custom regex engines scrub the payload of Names, Emails, and Phone Numbers.
5. **The Cognitive Router:** Gemini 2.5 Flash handles fast intent classification. Complex medical routing is escalated to Gemini 2.5 Pro via a LangGraph state machine.
6. **The Doctor Dashboard:** The Next.js dashboard polls the Supabase PostgreSQL database every 10 seconds, surfacing emergencies dynamically.

## Interoperability (HL7 FHIR R4)
To ensure our AI doesn't create data silos, the Next.js frontend includes a strictly typed `fhir-mapper.ts` utility. This converts the backend's AI output directly into a standard FHIR `Observation` JSON object, allowing immediate ingestion by existing hospital Electronic Health Records (EHR).
