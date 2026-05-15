# 🛡️ Aegis Triage OS: Enterprise AI Healthcare

[![Deploy Frontend](https://vercel.com/button)](https://vercel.com/new) [![Deploy Backend](https://render.com/images/deploy-to-render-button.svg)](https://render.com/)

**Aegis Triage OS** is a production-grade, multimodal AI clinical triage engine engineered for the BMS AI Fusion Challenge. It solves the critical challenge of delayed emergency care and rural accessibility by fusing real-time voice ingestion, LangGraph clinical reasoning, and HDBSCAN geospatial outbreak tracking into a single, highly resilient Vercel-style architecture.

### 🔗 Live Links & Demo
* **Live Patient PWA (Vercel):** `[INSERT_VERCEL_LINK]`
* **Live Doctor Dashboard:** `[INSERT_VERCEL_LINK]/doctor`
* **Admin Command Center:** `[INSERT_VERCEL_LINK]/admin/outbreaks`
* **API Engine (Render):** `[INSERT_RENDER_LINK]`
* **3-Minute Video Pitch:** `[INSERT_YOUTUBE_LINK]`

---

## 🏆 Hackathon Rubric Fulfillment

### Core Objectives
- [x] **Multimodal AI Symptom Triage:** Hardware-accelerated DSP audio ingestion processed by LangGraph & Gemini 2.5 Pro.
- [x] **Algorithmic Risk Routing:** Deterministic severity indexing (0-100) dynamically routing critical cases over the clinical API.
- [x] **Doctor Priority Queue:** Real-time, async-polling Next.js priority dashboard with magnetic glassmorphism UI.

### Advanced Features & Enterprise Innovation
- [x] **Predictive Geospatial Outbreak Analysis:** HDBSCAN vector clustering tracking epidemiological anomalies in real-time.
- [x] **Zero-Trust JWT Gateway:** Military-grade OAuth2 token authentication locking down all clinical routes.
- [x] **Psychometric Analysis (PHQ-9):** Dynamic mental health baseline assessments synced directly to patient triage profiles.
- [x] **Automated EHR PDF Pipelines:** Asynchronous ThreadPool integration compiling structured medical histories into downloadable blobs.
- [x] **Telemedicine WebRTC Integration:** Secure video intercept stubs enabling rural doctors to instantly connect with critical patients.
- [x] **Ethical AI (PII Vault):** Microsoft Presidio integration proactively scrubbing all sensitive patient data prior to LLM inference.
- [x] **Vercel-Grade UI/UX:** Stunning clinical interface featuring mathematically blurred frosted glass panels, glowing typography gradients, and responsive micro-interactions.

---

## 📚 Technical Documentation & System Audits
Dive deeper into our certified enterprise architecture:
1. [System Architecture & LangGraph Pipeline](docs/ARCHITECTURE.md)
2. [AI, NLP, & Privacy Models](docs/MODELS_AND_NLP.md)
3. [Algorithmic Risk Scoring & XAI Transparency](docs/RISK_SCORING.md)
4. [Deployment Guide](docs/DEPLOYMENT.md)
5. [Frontend Baseline Audit](docs/FRONTEND_BASELINE_AUDIT.md)
6. [Frontend Deep-Analysis Prompt](docs/FRONTEND_ANALYSIS_PROMPT.md) *(copy into Cursor for full UI review)*

---

## 🚀 Local Deployment

### 1. Backend Engine (FastAPI)
```bash
cd aegis-backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend Cockpit (Next.js)
```bash
cd aegis-web
npm install
npm run dev
```

*Setup notes:*
- Copy `aegis-backend/.env.example` → `aegis-backend/.env` and set secrets.
- Download local STT model: `cd aegis-backend && python scripts/download_vosk_model.py`
- Bootstrap clinical users via `BOOTSTRAP_ADMIN_PASSWORD` / `BOOTSTRAP_DOCTOR_PASSWORD` on first API start.
- Register doctors with your `HOSPITAL_PROVISIONING_CODE` (default dev: `AEGIS-DEV-ONLY`).
