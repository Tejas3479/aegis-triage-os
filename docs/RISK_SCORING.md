# ⚠️ Algorithmic Risk Scoring & XAI

## The Triage Index
Aegis OS categorizes patients into three deterministic paths:
1. `HOME_CARE` (Risk Score: 0-30)
2. `CLINIC_VISIT` (Risk Score: 31-70)
3. `EMERGENCY_ROOM` (Risk Score: 71-100)

## Deterministic Safety Rails
LLMs can hallucinate. Emergency medicine cannot tolerate hallucinations. 
We implemented a `gatekeeper.py` regex fallback. If the payload contains phrases like *"crushing chest pain"* or *"cannot breathe"*, the system bypasses the LLM entirely and forces an `EMERGENCY_ROOM` status.

## Explainable AI (XAI) Transparency
Doctors do not trust "Black Box" AI. The Aegis Doctor Dashboard includes an XAI Card that processes the AI's clinical reasoning string. It uses regex targeting to isolate and visually highlight (red pulse) the exact medical tokens that triggered the high-risk score, proving its mathematical lineage.
