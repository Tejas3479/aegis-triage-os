import json
import logging
import os
import wave
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("aegis_core")
_vosk_model = None


def _load_vosk_model():
    global _vosk_model
    if _vosk_model is not None:
        return _vosk_model

    if not settings.VOSK_MODEL_PATH or not os.path.isdir(settings.VOSK_MODEL_PATH):
        raise RuntimeError(
            "VOSK model directory missing. Set VOSK_MODEL_PATH or use STT_PROVIDER=cloud."
        )

    from vosk import Model

    _vosk_model = Model(settings.VOSK_MODEL_PATH)
    logger.info("Vosk STT model loaded from %s", settings.VOSK_MODEL_PATH)
    return _vosk_model


def _transcribe_wav_vosk(file_path: str) -> str:
    from vosk import KaldiRecognizer

    model = _load_vosk_model()
    with wave.open(file_path, "rb") as wf:
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2:
            raise ValueError("Audio must be mono 16-bit PCM WAV for local STT.")
        recognizer = KaldiRecognizer(model, wf.getframerate())
        recognizer.SetWords(True)
        parts = []
        while True:
            data = wf.readframes(4000)
            if not data:
                break
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                if result.get("text"):
                    parts.append(result["text"])
        final = json.loads(recognizer.FinalResult())
        if final.get("text"):
            parts.append(final["text"])
    return " ".join(parts).strip()


async def transcribe_audio_local(file_path: str) -> str:
    """Privacy-preserving on-device transcription (no cloud audio egress)."""
    import asyncio

    return await asyncio.to_thread(_transcribe_wav_vosk, file_path)


async def transcribe_audio_cloud(file_path: str, content_type: str) -> str:
    """Cloud STT via Gemini — only when STT_PROVIDER=cloud (not default)."""
    import aiofiles
    from google.genai import types

    from app.services.model_router import llm_router

    async with aiofiles.open(file_path, "rb") as f:
        audio_bytes = await f.read()

    prompt = (
        "Transcribe the clinical audio faithfully. "
        "Output ONLY the transcription text, no diagnosis."
    )
    response = await llm_router.client.aio.models.generate_content(
        model=llm_router.fast_model,
        contents=[
            prompt,
            types.Part.from_bytes(data=audio_bytes, mime_type=content_type or "audio/wav"),
        ],
    )
    return (response.text or "").strip()


async def transcribe_audio(file_path: str, content_type: str = "audio/wav") -> str:
    """
    Transcribe audio using configured provider.
    Default `local` keeps PHI off third-party STT endpoints.
    """
    provider = settings.STT_PROVIDER.lower()
    if provider == "local":
        return await transcribe_audio_local(file_path)
    if provider == "cloud":
        return await transcribe_audio_cloud(file_path, content_type)
    raise ValueError(f"Unsupported STT_PROVIDER: {settings.STT_PROVIDER}")
