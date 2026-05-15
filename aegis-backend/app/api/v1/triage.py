import logging
import os
import aiofiles
import uuid
import asyncio
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Form, Depends
from google.genai import types
from app.services.model_router import llm_router
from app.services.graph_engine import graph_engine
from app.workers.tasks import compile_health_report
from app.services.pii_vault import pii_vault
from app.core.auth import get_current_user
from app.services.database import db_client
from app.models.schemas import CareLevel

router = APIRouter()
logger = logging.getLogger("aegis_core")

UPLOAD_DIR = "uploads/voice"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/voice")
async def process_voice_triage(
    background_tasks: BackgroundTasks,
    session_id: str = Form(...),
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Enterprise-grade multimodal ingestion controller for voice-based triage.
    Implements a Privacy-First pipeline: STT -> Redaction -> Clinical Reasoning.
    """
    file_id = str(uuid.uuid4())
    file_ext = file.filename.split(".")[-1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.{file_ext}")

    try:
        # 1. Non-blocking stream ingestion
        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await file.read(1024 * 64):
                await out_file.write(content)

        # 2. Async Disk Read for Multimodal Ingestion (Finding 2.1)
        async with aiofiles.open(file_path, "rb") as f:
            audio_bytes = await f.read()

        # 3. Step 1: High-Fidelity Transcription Pass (Privacy Border)
        # Note: In a true zero-leak environment, this would hit a local STT node.
        # We use gemini-2.5-flash as a dedicated transcription-only engine.
        transcription_prompt = (
            "SYSTEM: Transcribe the provided clinical audio with 100% fidelity. "
            "Detect regional Indian dialects (Hinglish/Kannada) and map to clear clinical text. "
            "Output ONLY the transcription. Do not diagnose or analyze symptoms in this pass."
        )

        response = await llm_router.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                transcription_prompt,
                types.Part.from_bytes(data=audio_bytes, mime_type=file.content_type)
            ]
        )
        
        raw_transcript = response.text
        logger.info(f"Ingested raw voice data for session {session_id}")

        # 4. Step 2: Surgical PII Redaction (Privacy Hardening - Finding 1.1)
        # We scrub the transcript locally before it ever touches the Clinical Diagnostic Graph.
        clean_transcript = pii_vault.redact_input(raw_transcript)
        
        # 5. Step 3: Clinical Reasoning via LangGraph (Redacted Data Only)
        initial_state = {
            "session_id": session_id,
            "chat_history": [{"role": "user", "content": clean_transcript}],
            "profile": {}, 
            "emergency_override": False
        }
        
        try:
            result = await asyncio.wait_for(
                graph_engine.executor.ainvoke(
                    initial_state, 
                    config={"configurable": {"thread_id": str(session_id)}}
                ),
                timeout=60.0 # Increased timeout for heavy diagnostic reasoning
            )
        except asyncio.TimeoutError:
            logger.error(f"Diagnostic Graph timeout: {session_id}")
            raise HTTPException(status_code=504, detail="Clinical Reasoning Engine timed out.")

        # 6. Post-Processing & Background Reporting
        background_tasks.add_task(compile_health_report, str(session_id))

        # 7. Persist Clinical Outcome (Finding 3.1)
        try:
            analysis_data = result.get("analysis", {})
            await asyncio.to_thread(
                db_client.client.table("triage_sessions").upsert({
                    "id": str(session_id),
                    "patient_hash": "ANON_" + str(session_id)[:8],
                    "care_level": analysis_data.care_level if hasattr(analysis_data, 'care_level') else "UNKNOWN",
                    "risk_score": analysis_data.risk_score if hasattr(analysis_data, 'risk_score') else 0,
                    "status": "ACTIVE",
                    "summary": analysis_data.guidance_notes if hasattr(analysis_data, 'guidance_notes') else ""
                }).execute()
            )
        except Exception as db_err:
            logger.warning(f"Failed to persist triage outcome to database: {str(db_err)}")

        analysis_data = result.get("analysis", {})
        if hasattr(analysis_data, "model_dump"):
            analysis_data = analysis_data.model_dump()
        elif hasattr(analysis_data, "dict"):
            analysis_data = analysis_data.dict()

        return {
            "session_id": str(session_id),
            "transcription": clean_transcript, # Return redacted version for clinical privacy
            "care_level": analysis_data.get("care_level", "UNKNOWN") if isinstance(analysis_data, dict) else "UNKNOWN",
            "guidance_notes": analysis_data.get("guidance_notes", "Analysis pending.") if isinstance(analysis_data, dict) else "Analysis pending.",
            "extracted_symptoms": analysis_data.get("extracted_symptoms", []) if isinstance(analysis_data, dict) else [],
            "telemedicine_url": result.get("telemedicine_url"),
            "status": "processed"
        }

    except Exception as e:
        logger.error(f"Voice triage fault: {str(e)}")
        raise HTTPException(status_code=500, detail="Clinical ingestion exception.")
    finally:
        # Safe cleanup
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass

@router.post("/chat")
async def chat_triage(
    data: dict, 
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """
    Standard text-based chat ingestion with mandatory PII scrubbing.
    """
    session_id = data.get("session_id", str(uuid.uuid4()))
    clean_message = pii_vault.redact_input(data.get("message", ""))
    
    result = await graph_engine.executor.ainvoke(
        {"chat_history": [{"role": "user", "content": clean_message}]},
        config={"configurable": {"thread_id": session_id}}
    )
    background_tasks.add_task(compile_health_report, session_id)
    return result
