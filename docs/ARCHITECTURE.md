# 🏛️ System Architecture

Aegis Triage OS follows a decoupled, event‑driven architecture with clear trust boundaries.

## High‑Level Data Flow

1. **Patient** interacts with the Next.js PWA (mobile‑first).  
2. **Voice** is captured via `MediaRecorder` (WebM) and sent as REST upload to the backend.  
3. **Backend** transcribes audio (Vosk local or cloud), redacts PII (Presidio), and invokes the **LangGraph clinical council**.  
4. **LangGraph** executes a directed state machine of agents (supervisor, diagnostician, temporal, billing, red‑team, pharmacology).  
5. **Results** are persisted to Supabase, logged to an immutable audit ledger, and made available to the doctor dashboard.  
6. **Doctor** retrieves the priority queue (polling or WebSocket) and can approve medication orders, which are staged via FHIR R4 to an EHR gateway.  
7. **Admin** configures risk thresholds and model fallback via database‑backed settings.

## Key Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Patient Portal** | Next.js 14, Tailwind, shadcn/ui | Consent capture, symptom chat, voice upload, PHQ‑9 |
| **API Gateway** | FastAPI, Pydantic | JWT auth, rate limiting, request tracing |
| **PII Vault** | Microsoft Presidio + custom regex | Redacts names, phones, emails before LLM |
| **Clinical Council** | LangGraph (Python) | Multi‑agent reasoning with deterministic safety rails |
| **MCP Gateway** | JSON‑RPC 2.0 + FHIR validation | Staging medication orders to EHR |
| **Outbreak Engine** | HDBSCAN (scikit‑learn) | Real‑time clustering of geolocated triage sessions |
| **Audit Ledger** | Supabase + SHA‑256 chaining | Immutable log of every clinical decision |
| **Storage** | Supabase (PostgreSQL + Storage) | Triage sessions, PDF reports, audit logs |

## Security & Compliance

- **Zero‑trust JWT** – tokens are scoped by role and session.
- **DPDP** – explicit consent before triage, revocable, logged with IP hash.
- **Row Level Security** – Supabase RLS blocks direct public access to clinical tables.
- **Encryption** – Fernet encryption for sensitive profile data (optional).
- **Medical Disclaimer** – Every response includes `X-Medical-Disclaimer` header.

## Scalability Notes

- Backend is stateless (except for checkpoints – use PostgreSQL checkpointer).
- Rate limiting can be distributed with Redis.
- Audio processing is CPU‑bound; consider horizontal scaling with a message queue for large deployments.
