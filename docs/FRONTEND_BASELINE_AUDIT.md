# Aegis Web – Frontend Baseline Audit (Production Readiness)

This document compares **your actual frontend** (`aegis-web`) to patterns used by modern healthcare triage / telehealth apps (Next.js PWAs, HIPAA-aware React, offline-first clinical tools).

---

## Your stack (verified)

| Layer | Your implementation |
|-------|---------------------|
| Framework | **Next.js 16.2** App Router |
| UI | **React 19**, Tailwind CSS 4, **shadcn/ui** |
| Motion | **framer-motion** (landing page) |
| PWA | `@ducanh2912/next-pwa`, `manifest.ts`, service worker in `public/` |
| HTTP | Native `fetch` + `js-cookie` (`src/lib/api.ts`) |
| Auth | JWT cookies (`aegis_token`, `aegis_role`), `src/middleware.ts` |
| Routes | `/`, `/patient`, `/login`, `/signup`, `/doctor`, `/admin/outbreaks` |

**Rendering model:** Almost entirely **client components** (`"use client"` on pages). No React Server Components for data fetching.

---

## Route map

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Marketing landing (animated hero, feature grid) | Public |
| `/patient` | Chat + voice triage + PHQ-9 + consent gate | Anonymous JWT |
| `/login` | Doctor/admin login | Public |
| `/signup` | Doctor registration | Public |
| `/doctor` | Priority queue table, PDF/FHIR export | DOCTOR (middleware) |
| `/admin/outbreaks` | HDBSCAN outbreak command center | ADMIN (middleware) |

---

## How industry healthcare apps typically build the frontend

Based on current practice (telehealth platforms, clinical PWAs, HIPAA-aware React guides):

1. **Trust zones** — Separate public, patient, and clinician surfaces with route-level guards (you have partial: middleware + cookies).
2. **Consent before PHI** — Blocking modal with audit trail before any symptom capture (you now have `ConsentGate` + `dpdp_consent_logs`).
3. **Low cognitive load for patients** — Large touch targets (48dp+), simple flows, minimal dense tables on patient side (you: chat + mic — good).
4. **Clinician density** — Tables, sorting, polling, export on doctor side (you: queue table + 10s poll — good).
5. **Offline-first (advanced)** — IndexedDB queue + background sync (you: `OfflineBanner` only — gap).
6. **Accessibility** — WCAG 2.1 AA, `aria-live` for AI responses, focus traps in modals (you: partial — some `aria-live`, consent dialog added).
7. **No PHI in browser storage** — Avoid localStorage for clinical content; session-scoped consent flag only (you: sessionStorage for consent session id — acceptable).
8. **No clinical API in service worker cache** — (you: fixed — `runtimeCaching: []`).
9. **Design system** — Tokens for critical / warning / info states (you: ad hoc Tailwind + badges).
10. **i18n** — Multi-language for rural deployments (you: English only — gap).

---

## Gap analysis (your app vs enterprise healthcare UI)

### Strengths
- Dark clinical aesthetic; consistent slate/indigo palette
- Patient chat UX with quick actions and voice CTA
- Doctor queue with risk-based badges and polling
- API client with timeouts and typed responses
- PWA installability; session timeout hook for clinicians
- Consent gate aligned with DPDP

### Gaps to address (priority order)

| Priority | Gap | Industry norm |
|----------|-----|----------------|
| P0 | Voice records **WebM**; backend Vosk expects **WAV** | Convert in browser or server before STT |
| P0 | Landing claims "HIPAA" / "military-grade" without legal pages | Privacy policy, terms, emergency disclaimer routes |
| P1 | No emergency CTA (call 108/911) on patient screen | Persistent emergency strip |
| P1 | Navbar visible on patient flow may confuse roles | Hide clinician links for PATIENT role |
| P1 | `MentalHealthCard` / triage disabled state not obvious when no consent | Overlay message on disabled controls |
| P2 | No i18n | Hindi/Kannada labels for target users |
| P2 | No offline queue (IndexedDB) | Queue triage when offline, sync later |
| P2 | Doctor dashboard: no role check in UI beyond middleware | Hide admin link unless ADMIN |
| P3 | No Storybook / component tests for UI | Visual regression + a11y tests |
| P3 | FHIR export client-only | Server-generated with auth |

---

## File inventory (for deep analysis)

```
aegis-web/src/
  app/           → pages (App Router)
  components/    → ui (shadcn), patient/, dashboard/
  hooks/         → useQueue, useSessionTimeout
  lib/           → api.ts, fhir-mapper.ts, utils.ts
  types/         → shared TS interfaces
  middleware.ts  → /doctor, /admin guards
```

---

## Next step

Use **`docs/FRONTEND_ANALYSIS_PROMPT.md`** — copy the prompt into a new chat (or give it back to the agent) for a full file-by-file frontend review and prioritized change list.
