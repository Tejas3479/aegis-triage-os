# 🛡️ Aegis Triage OS – Enterprise Clinical AI Platform

**Aegis Triage OS** is a production‑ready, multi‑modal AI clinical triage and decision support system. It bridges the gap between patients and clinicians by fusing real‑time voice ingestion, a LangGraph multi‑agent reasoning engine, and geospatial outbreak analytics.

## 🔧 Key Capabilities

- **Multi‑Modal Symptom Triage** – Voice and text input, transcribed via on‑premises STT (Vosk) or cloud fallback.
- **Explainable Clinical Reasoning** – LangGraph “Clinical Council” with diagnostician, pharmacology, red‑team, and billing agents.
- **Real‑Time Priority Queue** – Role‑based dashboard for doctors, sorted by algorithmic risk score.
- **Geospatial Outbreak Detection** – HDBSCAN clustering of anonymized patient locations.
- **Enterprise Security** – Zero‑trust JWT, PII redaction (Microsoft Presidio), DPDP consent logging.
- **Offline Resilience** – Progressive Web App with IndexedDB queue for rural connectivity gaps.
- **FHIR R4 Interoperability** – Export triage assessments as standard FHIR `Observation` resources.

## 🚀 Quick Start (Development)

### Backend (FastAPI)

```bash
cd aegis-backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (Next.js PWA)

```bash
cd aegis-web
npm install
npm run dev
```

### Environment Setup

Copy `.env.example` to `.env` and fill in:

- `SUPABASE_URL`, `SUPABASE_KEY` – for PostgreSQL storage and auth.
- `GOOGLE_GENAI_API_KEY` – for clinical reasoning (Gemini 2.5).
- `SECRET_KEY`, `ALLOWED_ORIGINS` – security.
- `HOSPITAL_PROVISIONING_CODE` – for doctor registration.
- `STT_PROVIDER` – `local` (Vosk) or `cloud` (Gemini).
- `MCP_AUTH_TOKEN` – secure bearer verification key for node cluster RPC authorizations.

Run the Vosk model download script:

```bash
cd aegis-backend
python scripts/download_vosk_model.py
```

## 🧪 Quality Verification & Testing

Verify that both frontend and backend configurations are fully hardened and certified using our verification frameworks:

### Backend Unit Tests (Pytest)
```bash
cd aegis-backend
.\venv\Scripts\activate  # activate environment
pytest                  # run all 22 core clinical nodes/auth tests
```

### Frontend Validation (Linting, TypeScript & Component Stories)
```bash
cd aegis-web
npm run build           # execute production bundler & strict typecheck
npm run storybook        # run component storybook workspace
```

## 📦 Production Deployment

Refer to [DEPLOYMENT.md](docs/DEPLOYMENT.md) for Docker, Vercel (frontend), and Render (backend) configurations, as well as production checklist.

## 📖 Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [AI & NLP Models](docs/MODELS_AND_NLP.md)
- [Risk Scoring & Explainability](docs/RISK_SCORING.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🏢 Enterprise Support

For commercial licensing, on‑premises deployment, or custom model training, contact [enterprise@aegis.local](mailto:enterprise@aegis.local).

## ⚖️ License

Proprietary – all rights reserved.
