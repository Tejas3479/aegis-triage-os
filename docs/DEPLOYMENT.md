# Aegis Triage OS – Deployment Guide

## Production Architecture

| Component | Recommended Host | Notes |
|-----------|------------------|-------|
| Frontend (Next.js) | Vercel / self‑hosted | PWA with service worker |
| Backend (FastAPI) | Render / AWS ECS / Kubernetes | Stateless, 2+ replicas |
| Database | Supabase / PostgreSQL | Managed Postgres with point‑in‑time recovery |
| Redis | Upstash / AWS ElastiCache | For rate limiting (optional) |
| Object Storage | Supabase Storage / S3 | For PDF reports |

## Environment Variables

### Backend (`.env`)

```env
ENVIRONMENT=production
SECRET_KEY=<secure-random>
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<service-role-key>
GOOGLE_GENAI_API_KEY=<key>
ALLOWED_ORIGINS=https://your-frontend.vercel.app
HOSPITAL_PROVISIONING_CODE=<secret>
BOOTSTRAP_ADMIN_PASSWORD=<strong-password>
BOOTSTRAP_DOCTOR_PASSWORD=<strong-password>
STT_PROVIDER=local
VOSK_MODEL_PATH=models/vosk-en-small
MCP_AUTH_TOKEN=<mcp-cluster-bearer-token>
REDIS_URL=redis://...  # optional
CHECKPOINT_DATABASE_URL=postgresql://...  # optional for LangGraph durability
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

## Database Setup

1. Run Supabase migrations in order:
   - `supabase/schema.sql`
   - `supabase/migrations/002_clinical_users_rls.sql`
   - `supabase/migrations/003_system_settings.sql`
2. Create a storage bucket named `reports`.
3. Enable point‑in‑time backups.

## Production Checklist

- [ ] `SECRET_KEY` set and not default.
- [ ] `ALLOWED_ORIGINS` does not contain `*`.
- [ ] `HOSPITAL_PROVISIONING_CODE` changed from default.
- [ ] `BOOTSTRAP_ADMIN_PASSWORD` and `BOOTSTRAP_DOCTOR_PASSWORD` rotated after first login.
- [ ] HTTPS enabled on both frontend and backend.
- [ ] Database backups scheduled.
- [ ] Logging aggregated (e.g., Datadog, Grafana Loki).
- [ ] Health check endpoint `/health` is monitored.

## Docker Deployment (Backend)

```dockerfile
# Build
docker build -t aegis-backend .
# Run
docker run -d -p 8000:8000 --env-file .env aegis-backend
```

## Frontend Build

```bash
npm run build
npm start   # production mode
```

For Vercel, connect the repository and set environment variables.

## Monitoring

- Health check: `curl https://api/health` should return `{"status":"operational"}`
- Prometheus metrics (if enabled) at `/metrics`
- Structured logs are output to `stdout` – collect with your preferred agent.
