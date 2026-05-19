import logging
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from app.core.database import db_client

logger = logging.getLogger("aegis_core")
REPORTS_DIR = "storage/reports"
os.makedirs(REPORTS_DIR, exist_ok=True)


def _load_triage_data(session_id: str) -> dict:
    fallback = {
        "patient_hash": f"ANON_{session_id[:8]}",
        "symptoms": ["Clinical data pending sync"],
        "care_level": "CLINIC_VISIT",
        "risk_score": 0,
        "mental_health_flag": False,
        "reasoning": "Report generated from available session metadata.",
    }

    if not db_client.client:
        return fallback

    try:
        session_resp = (
            db_client.client.table("triage_sessions")
            .select("*, patients(anon_hash)")
            .eq("id", session_id)
            .limit(1)
            .execute()
        )
        if not session_resp.data:
            return fallback

        row = session_resp.data[0]
        patient = row.get("patients") or {}
        audit_resp = (
            db_client.client.table("medical_audit_logs")
            .select("symptoms, model_metadata")
            .eq("session_id", session_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        symptoms_payload = {}
        reasoning = fallback["reasoning"]
        if audit_resp.data:
            symptoms_payload = audit_resp.data[0].get("symptoms") or {}
            meta = audit_resp.data[0].get("model_metadata") or {}
            reasoning = symptoms_payload.get("clinical_reasoning") or meta.get("source", reasoning)

        extracted = symptoms_payload.get("extracted_symptoms", [])
        if not extracted and isinstance(symptoms_payload.get("mental_health"), dict):
            extracted = ["Mental health assessment recorded"]

        return {
            "patient_hash": (patient.get("anon_hash") or fallback["patient_hash"])[:16],
            "symptoms": extracted or fallback["symptoms"],
            "care_level": row.get("care_level") or fallback["care_level"],
            "risk_score": row.get("risk_score", 0),
            "mental_health_flag": row.get("mental_health_flag", False),
            "reasoning": reasoning,
        }
    except Exception as e:
        logger.warning("Could not load triage data for PDF %s: %s", session_id, e)
        return fallback


def compile_health_report(session_id: str):
    """
    Lightweight asynchronous EHR compiler using ReportLab.
    Uploads results to Supabase Storage when configured.
    """
    try:
        logger.info("Starting async EHR compilation for session: %s", session_id)
        triage_data = _load_triage_data(session_id)

        file_path = os.path.join(REPORTS_DIR, f"{session_id}.pdf")
        doc = SimpleDocTemplate(file_path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("Aegis Triage OS - Clinical Report", styles["Title"]))
        elements.append(Spacer(1, 12))

        disclaimer_style = ParagraphStyle(
            "Disclaimer",
            parent=styles["Normal"],
            textColor=colors.red,
            fontSize=10,
            alignment=1,
        )
        elements.append(
            Paragraph(
                "<b>Aegis OS is an AI assistant, not a replacement for professional medical diagnosis.</b>",
                disclaimer_style,
            )
        )
        elements.append(Spacer(1, 24))

        table_data = [
            [Paragraph("<b>Attribute</b>", styles["Normal"]), Paragraph("<b>Clinical Value</b>", styles["Normal"])],
            ["Patient Hash", triage_data["patient_hash"]],
            ["Session ID", session_id],
            ["Classification", triage_data["care_level"]],
            ["Risk Score", f"{triage_data['risk_score']}/10"],
            ["Mental Health Concern", "Yes" if triage_data["mental_health_flag"] else "No"],
        ]

        t = Table(table_data, colWidths=[150, 350])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )
        elements.append(t)
        elements.append(Spacer(1, 12))

        elements.append(Paragraph("<b>Clinical Reasoning:</b>", styles["Heading3"]))
        elements.append(Paragraph(triage_data["reasoning"], styles["Normal"]))
        elements.append(Spacer(1, 12))

        elements.append(Paragraph("<b>Extracted Symptoms:</b>", styles["Heading3"]))
        for symptom in triage_data["symptoms"]:
            elements.append(Paragraph(f"• {symptom}", styles["Normal"]))

        doc.build(elements)

        if db_client.client:
            try:
                with open(file_path, "rb") as f:
                    file_data = f.read()
                storage_path = f"reports/{session_id}.pdf"
                db_client.client.storage.from_("reports").upload(
                    path=storage_path,
                    file=file_data,
                    file_options={"content-type": "application/pdf"},
                )
                logger.info("EHR Report uploaded to Supabase: %s", storage_path)
            except Exception as se:
                logger.warning("Supabase Storage upload failed: %s", se)

        logger.info("EHR Report compilation complete for %s", session_id)
        return True

    except Exception as e:
        logger.error("EHR Compilation failed: %s", e)
        return False

