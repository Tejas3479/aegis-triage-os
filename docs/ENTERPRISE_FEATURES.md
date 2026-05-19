# 🌟 Enterprise Innovations

Aegis Triage OS includes several advanced features that go beyond basic clinical triage:

### 1. Explainable AI (XAI) Clinical Council

Instead of a black‑box LLM, we implement a LangGraph‑based **Clinical Council** with specialised agents:
- **Diagnostician** – extracts symptoms and proposes diagnoses.
- **Temporal Agent** – maps symptoms onto a chronological timeline.
- **Pharmacology Agent** – checks for drug‑allergy interactions (via RxNav API).
- **Red Team Agent** – generates differential diagnoses to challenge the primary assessment.
- **Billing Agent** – suggests ICD‑10 and CPT codes.

All agent reasoning is logged and displayed to clinicians in the dashboard’s “Council Matrix”, ensuring transparency.

### 2. PII Vault with Microsoft Presidio

Patient data is scrubbed of personally identifiable information **before** any LLM inference, using Presidio’s entity recognition plus regex fallbacks for Indian phone numbers and Aadhaar. This ensures DPDP and HIPAA alignment.

### 3. Offline‑First Rural Resilience

The frontend is a Progressive Web App that caches static assets and queues voice recordings in IndexedDB when connectivity is lost. When network returns, queued triage sessions are automatically uploaded.

### 4. Adaptive Model Router

The system automatically routes requests to the most cost‑effective LLM (Gemini 2.5 Flash for simple intents, Gemini 2.5 Pro for complex triage). If the primary provider fails, it falls back to OpenAI, Anthropic, or a static safe template, ensuring 99.9% uptime.

### 5. FHIR R4 Native Interoperability

Triage assessments can be exported as standard FHIR `Observation` resources, allowing direct ingestion into Epic, Cerner, or any FHIR‑compatible EHR.

### 6. Geospatial Outbreak Detection

Using HDBSCAN with Haversine distance, the system automatically detects clusters of similar symptoms and visualises them on an admin dashboard – enabling early epidemic response.
