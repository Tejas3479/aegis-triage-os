# Frontend Deep-Analysis Prompt (copy everything below this line)

Use this prompt in a **new Cursor chat** after pointing the agent at the `aegis-web` folder. It is tailored to **this repository**, not a generic Next.js app.

---

## PROMPT START

You are a senior healthcare UI engineer and accessibility specialist. Perform a **read-only, exhaustive audit** of the Aegis Triage OS frontend at `aegis-web/`.

### Context

**Product:** AI clinical triage PWA — patient voice/text triage, doctor priority queue, admin outbreak map.

**Verified stack:**
- Next.js **16.2** App Router, React **19**
- Tailwind CSS **4**, shadcn/ui (`components/ui/`)
- PWA: `@ducanh2912/next-pwa`, `src/app/manifest.ts`
- API client: `src/lib/api.ts` → FastAPI backend (`NEXT_PUBLIC_API_URL`)
- Auth: cookies `aegis_token`, `aegis_role`; `src/middleware.ts` guards `/doctor`, `/admin`
- Patient flow: anonymous JWT + **DPDP consent gate** (`ConsentGate.tsx`) before triage

**Routes:**
| Path | File |
|------|------|
| `/` | `src/app/page.tsx` |
| `/patient` | `src/app/patient/page.tsx` |
| `/login` | `src/app/login/page.tsx` |
| `/signup` | `src/app/signup/page.tsx` |
| `/doctor` | `src/app/doctor/page.tsx` |
| `/admin/outbreaks` | `src/app/admin/outbreaks/page.tsx` |

**Key components:**
- `src/components/patient/VoiceTriage.tsx` — MediaRecorder (WebM)
- `src/components/patient/MentalHealthCard.tsx` — PHQ-9 slider
- `src/components/patient/ConsentGate.tsx` — DPDP modal
- `src/components/patient/OfflineBanner.tsx`
- `src/components/Navbar.tsx`
- `src/hooks/useQueue.ts` — 10s polling
- `src/hooks/useSessionTimeout.ts` — 15 min clinician timeout
- `src/lib/fhir-mapper.ts` — client-side FHIR JSON download

### Benchmark against industry healthcare frontend patterns

Compare our implementation to standard practice for:
1. **Patient telehealth / triage apps** — low cognitive load, large touch targets (48dp+), emergency escape hatch, consent-before-PHI
2. **Clinician dashboards** — dense tables, sort/filter, real-time updates, role-based nav
3. **HIPAA-aware React** ([reacts.dev HIPAA frontends](https://reacts.dev/hipaa-aware-frontends-designing-phi-isolation-consent-flows-)) — trust zones, no PHI in localStorage, no caching clinical API in SW
4. **WCAG 2.1 AA** — contrast, keyboard nav, focus traps in modals, `aria-live` for dynamic AI text
5. **Offline-first PWAs** (e.g. ATLAS-style) — IndexedDB queue, sync status, background sync
6. **Design systems** — semantic tokens for critical/warning/info clinical states

### Your tasks

1. **Read every file** under `aegis-web/src/` and `next.config.mjs`, `package.json`, `middleware.ts`.
2. **Map architecture:** rendering strategy (RSC vs client), state management, data fetching, error boundaries, loading states.
3. **Per-route review:** UX flow, auth assumptions, API coupling, empty/error states, mobile (`100dvh`, touch).
4. **Security & privacy (UI layer):** cookies, sessionStorage, what appears in DOM, SW caching, client-side exports.
5. **Accessibility audit:** list WCAG failures with file:line references.
6. **Performance:** bundle weight (framer-motion on landing only?), PWA config, unnecessary re-renders, polling cost.
7. **Visual / UX consistency:** typography, spacing, clinical credibility vs marketing hype on landing page.
8. **Known technical risks to verify:**
   - Voice records WebM but backend Vosk expects mono WAV
   - Navbar shows doctor/admin links to all authenticated users
   - No `/privacy` or `/terms` pages despite compliance claims on landing
   - Offline banner without actual offline queue

### Output format (required)

```markdown
# Aegis Frontend Audit Report

## Executive summary
(3–5 sentences)

## Architecture diagram
(mermaid: routes → components → api.ts → backend)

## Scorecard (1–5)
| Area | Score | Notes |
|------|-------|-------|
| Patient UX | | |
| Clinician UX | | |
| Accessibility | | |
| Security/Privacy UI | | |
| PWA/Offline | | |
| Code quality | | |
| Design consistency | | |

## Critical issues (P0)
- [ ] Issue — file — fix recommendation

## High (P1)
...

## Medium (P2)
...

## Low (P3)
...

## What's done well
(bullet list)

## Recommended implementation order
(numbered, with estimated effort S/M/L)

## Suggested file-level changes
| File | Change |
|------|--------|
```

Do **not** modify files unless I ask. Be specific: cite paths and line numbers. Compare to healthcare industry norms, not generic SaaS advice.

## PROMPT END

---

## How to use

1. Open Cursor agent with workspace `aegis-triage-os`.
2. Paste **everything between PROMPT START and PROMPT END**.
3. Optionally add: `Also read docs/FRONTEND_BASELINE_AUDIT.md for prior gap analysis.`
4. When the agent returns the report, paste it back to implement fixes.
