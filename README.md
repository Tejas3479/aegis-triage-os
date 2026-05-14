# 🛡️ Aegis Triage OS: Enterprise AI Healthcare

[![Deploy Frontend](https://vercel.com/button)](https://vercel.com/new) [![Deploy Backend](https://render.com/images/deploy-to-render-button.svg)](https://render.com/)

**Aegis Triage OS** is a production-grade, multimodal AI clinical triage engine designed for the BMS AI Fusion Challenge. It solves the critical challenge of delayed emergency care and rural accessibility by combining voice-native symptom analysis with real-time geospatial outbreak clustering.

### 🔗 Live Links & Demo
* **Live Patient PWA (Vercel):** `[INSERT_VERCEL_LINK]`
* **Live Doctor Dashboard:** `[INSERT_VERCEL_LINK]/doctor`
* **API Engine (Render):** `[INSERT_RENDER_LINK]`
* **3-Minute Video Pitch:** `[INSERT_YOUTUBE_LINK]`

## 🏆 Hackathon Rubric Fulfillment

### Core Objectives
- [x] **AI-Powered Symptom Triage:** Multi-turn conversational interface powered by LangGraph & Gemini 2.5 Pro.
- [x] **Risk Scoring & Emergency Detection:** Algorithmic severity indexing (0-100) dynamically routing critical cases.
- [x] **Health Guidance Dashboard:** Real-time polling Next.js queue for algorithmic prioritization.

### Advanced Features & Innovation
- [x] **Voice-Enabled Rural Access:** Native WebAudio integration with PWA Offline Resilience.
- [x] **Interoperability (EHR):** One-click HL7 FHIR R4 JSON exports for Epic/Cerner integration.
- [x] **Predictive Outbreak Analysis:** HDBSCAN geospatial clustering for epidemiological tracking.
- [x] **Ethical AI (PII Vault):** Microsoft Presidio integration to scrub sensitive patient data before LLM inference.
- [x] **Explainable AI (XAI):** Transparent UI highlighting critical medical tokens to eliminate "black box" distrust.

## 📚 Technical Documentation
Dive deeper into our enterprise architecture:
1. [System Architecture & Pipeline](docs/ARCHITECTURE.md)
2. [AI, NLP, & Privacy Models](docs/MODELS_AND_NLP.md)
3. [Algorithmic Risk Scoring & XAI](docs/RISK_SCORING.md)

## 🚀 Local Deployment

### 1. Backend Engine (FastAPI)
```bash
cd aegis-backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Cockpit (Next.js)

```bash
cd aegis-web
npm install
npm run dev
```
