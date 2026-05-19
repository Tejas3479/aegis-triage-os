# Aegis Triage OS – Backend Engine

Enterprise‑grade FastAPI backend for clinical triage, multi‑agent reasoning, and geospatial outbreak monitoring.

## Tech Stack

- **Framework**: FastAPI (async)
- **AI Orchestration**: LangGraph + Google Gemini 2.5 (with fallback to OpenAI/Anthropic)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **PII Redaction**: Microsoft Presidio + regex fallback
- **STT**: Vosk (local) / Gemini Cloud (optional)
- **Reporting**: ReportLab PDF generation
- **Spatial Clustering**: HDBSCAN with Haversine distance

## API Overview

| Prefix | Description |
|--------|-------------|
| `/api/v1/auth` | JWT authentication, role‑based access |
| `/api/v1/patient` | DPDP consent, patient profile |
| `/api/v1/triage` | Chat/voice triage, assessment submission |
| `/api/v1/doctor` | Priority queue, report download, order approval |
| `/api/v1/admin` | System settings (database‑backed) |
| `/api/v1/public-health` | Outbreak cluster detection |
| `/api/v2/clinical` | ICE (Interoperable Care‑Continuity) endpoints |

## Configuration

Copy `.env.example` to `.env`. Critical variables:

- `SUPABASE_URL`, `SUPABASE_KEY`
- `GOOGLE_GENAI_API_KEY`
- `SECRET_KEY` (generate with `openssl rand -hex 32`)
- `ALLOWED_ORIGINS` (comma‑separated list of frontend URLs)
- `HOSPITAL_PROVISIONING_CODE` (shared secret for doctor registration)
- `STT_PROVIDER` (`local` or `cloud`)
- `REDIS_URL` (optional, for distributed rate limiting)

## Run Locally

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Docker

```bash
docker build -t aegis-backend .
docker run -p 8000:8000 --env-file .env aegis-backend
```

## Testing

```bash
pytest
```

## License

Proprietary.
