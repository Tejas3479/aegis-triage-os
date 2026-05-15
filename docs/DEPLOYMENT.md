# Aegis Triage OS — Deployment Guide

## Architecture

| Component | Stack | Default host |
|-----------|-------|--------------|
| Frontend | Next.js 16 PWA (`aegis-web`) | Vercel |
| API | FastAPI (`aegis-backend`) | Render / Docker |
| Database | Supabase (PostgreSQL) | Supabase Cloud |
| Checkpoints | SQLite file or Postgres URL | Same host as API |
| Local STT | Vosk (on API server) | Bundled with API |

---

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run SQL in order:
   - `aegis-backend/supabase/schema.sql` (fresh database)
   - OR `aegis-backend/supabase/migrations/002_clinical_users_rls.sql` (existing DB)
3. Create a **Storage** bucket named `reports` (for PDF uploads).
4. Copy **Project URL** and **service_role** key (backend only — never expose to the browser).

---

## 2. Backend environment

Copy `aegis-backend/.env.example` → `aegis-backend/.env`:

```env
ENVIRONMENT=production
SECRET_KEY=<openssl rand -hex 32>
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=<service_role_key>
GOOGLE_GENAI_API_KEY=<for clinical reasoning only>
ALLOWED_ORIGINS=https://your-app.vercel.app
HOSPITAL_PROVISIONING_CODE=<your-secret-code>
BOOTSTRAP_ADMIN_PASSWORD=<one-time-strong-password>
BOOTSTRAP_DOCTOR_PASSWORD=<optional>
STT_PROVIDER=local
VOSK_MODEL_PATH=models/vosk-en-small
CHECKPOINT_SQLITE_PATH=storage/langgraph_checkpoints.db
# Optional durable checkpoints on Postgres:
# CHECKPOINT_DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
```

### Local STT model

```bash
cd aegis-backend
pip install -r requirements.txt
python scripts/download_vosk_model.py
```

### Run API

```bash
cd aegis-backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Docker

```bash
cd aegis-backend
docker build -t aegis-api .
docker run -p 8000:8000 --env-file .env aegis-api
```

---

## 3. Frontend environment

Copy `aegis-web/.env.example` → `aegis-web/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
```

```bash
cd aegis-web
npm ci
npm run build
npm start
```

---

## 4. First-time clinical users

On first API start (empty `clinical_users` table), accounts are created from:

- `BOOTSTRAP_ADMIN_PASSWORD` → user `admin_triage` (ADMIN)
- `BOOTSTRAP_DOCTOR_PASSWORD` → user `doctor_smith` (DOCTOR)

Additional doctors register at `/signup` with `HOSPITAL_PROVISIONING_CODE`.

Login emails in Supabase Auth (when configured): `username@clinical.aegis.local`.

---

## 5. DPDP consent flow

- Patients must accept the consent modal on `/patient` before triage.
- Consent is stored in `dpdp_consent_logs` with hashed IP.
- API enforces consent on `/triage/*` and `/mental/*`.
- Public endpoints: `POST /api/v1/consent/record`, `GET /api/v1/consent/status/{session_id}`.

---

## 6. Production checklist

- [ ] `SECRET_KEY` set (not default)
- [ ] `ALLOWED_ORIGINS` explicit (not `*`)
- [ ] `HOSPITAL_PROVISIONING_CODE` set
- [ ] Bootstrap passwords rotated after first login
- [ ] `STT_PROVIDER=local` and Vosk model present
- [ ] Supabase RLS migration applied
- [ ] HTTPS on frontend and API
- [ ] CI passing (`.github/workflows/ci.yml`)

---

## 7. Health check

```bash
curl https://your-api/health
```

Expected: `{"status":"operational",...}`
