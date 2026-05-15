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
from app.core.auth import get_current_user, User, assert_session_access
from app.models.schemas import ChatTriageRequest, TriageApiResponse
from app.services.triage_persistence import (
    build_triage_response,
    persist_triage_outcome,
)

router = APIRouter()
logger = logging.getLogger("aegis_core")

UPLOAD_DIR = "uploads/voice"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/voice", response_model=TriageApiResponse)
async def process_voice_triage(
    background_tasks: BackgroundTasks,
    session_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    assert_session_access(current_user, session_id)

    file_id = str(uuid.uuid4())
    file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "wav"
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.{file_ext}")

    try:
        async with aiofiles.open(file_path, "wb") as out_file:
            while content := await file.read(1024 * 64):
                await out_file.write(content)

        async with aiofiles.open(file_path, "rb") as f:
            audio_bytes = await f.read()

        transcription_prompt = (
            "SYSTEM: Transcribe the provided clinical audio with 100% fidelity. "
            "Detect regional Indian dialects (Hinglish/Kannada) and map to clear clinical text. "
            "Output ONLY the transcription. Do not diagnose or analyze symptoms in this pass."
        )

        response = await llm_router.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                transcription_prompt,
                types.Part.from_bytes(data=audio_bytes, mime_type=file.content_type or "audio/wav"),
            ],
        )

        raw_transcript = response.text
        clean_transcript = pii_vault.redact_input(raw_transcript)

        initial_state = {
            "session_id": session_id,
            "chat_history": [{"role": "user", "content": clean_transcript}],
            "profile": {},
            "emergency_override": False,
        }

        try:
            result = await asyncio.wait_for(
                graph_engine.executor.ainvoke(
                    initial_state,
                    config={"configurable": {"thread_id": str(session_id)}},
                ),
                timeout=60.0,
            )
        except asyncio.TimeoutError:
            logger.error("Diagnostic Graph timeout: %s", session_id)
            raise HTTPException(status_code=504, detail="Clinical Reasoning Engine timed out.")

        background_tasks.add_task(compile_health_report, str(session_id))

        try:
            await asyncio.to_thread(persist_triage_outcome, str(session_id), result)
        except Exception as db_err:
            logger.warning("Failed to persist triage outcome: %s", db_err)

        return build_triage_response(session_id, result, transcription=clean_transcript)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Voice triage fault: %s", e)
        raise HTTPException(status_code=500, detail="Clinical ingestion exception.")
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass


@router.post("/chat", response_model=TriageApiResponse)
async def chat_triage(
    body: ChatTriageRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    assert_session_access(current_user, body.session_id)

    clean_message = pii_vault.redact_input(body.message)

    try:
        result = await asyncio.wait_for(
            graph_engine.executor.ainvoke(
                {
                    "session_id": body.session_id,
                    "chat_history": [{"role": "user", "content": clean_message}],
                    "profile": {},
                    "emergency_override": False,
                },
                config={"configurable": {"thread_id": body.session_id}},
            ),
            timeout=60.0,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Clinical Reasoning Engine timed out.")

    background_tasks.add_task(compile_health_report, body.session_id)

    try:
        await asyncio.to_thread(persist_triage_outcome, body.session_id, result)
    except Exception as db_err:
        logger.warning("Failed to persist chat triage outcome: %s", db_err)

    return build_triage_response(body.session_id, result)
