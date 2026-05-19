import logging
import os
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["Streaming Audio"])
logger = logging.getLogger("aegis_core")

_redis_pool = None

@router.websocket("/ws/audio/{session_id}")
async def websocket_audio_stream(websocket: WebSocket, session_id: str):
    """
    High-throughput streaming backend for live audio ingestion.
    Ingests live, chunked PCM audio, simulating VAD and Speaker Diarization.
    """
    await websocket.accept()
    logger.info(f"WebSocket connection accepted for session: {session_id}")
    
    import redis.asyncio as redis
    import json
    import asyncio
    from app.core.config import settings
    
    # Task to listen to node status updates from Redis
    async def listen_to_node_status():
        global _redis_pool
        try:
            if _redis_pool is None:
                import redis.asyncio as redis_async
                _redis_pool = redis_async.from_url(settings.REDIS_URL)
            r = _redis_pool
            pubsub = r.pubsub()
            await pubsub.subscribe(f"node_status:{session_id}")
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    await websocket.send_json({"type": "node_status", "data": data})
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.warning(f"Error in node status listener: {e}")
        finally:
            try:
                await pubsub.unsubscribe(f"node_status:{session_id}")
                # Do not close the global pool
            except:
                pass
                
    status_task = asyncio.create_task(listen_to_node_status())
    
    import tempfile
    from app.core.local_stt import transcribe_audio
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file_path = temp_file.name
        
    try:
        while True:
            try:
                # 1. Receive chunked PCM audio (binary) with timeout
                # If no data for 1.5 seconds, assume silence/stop and transcribe
                data = await asyncio.wait_for(websocket.receive_bytes(), timeout=1.5)
                
                # Append to file
                with open(temp_file_path, "ab") as f:
                    f.write(data)
                    
            except asyncio.TimeoutError:
                # Silence or stop detected
                if os.path.exists(temp_file_path) and os.path.getsize(temp_file_path) > 0:
                    try:
                        text = await transcribe_audio(temp_file_path)
                        
                        if text:
                            # 4. Update stateful transcript store
                            os.makedirs("storage/transcripts", exist_ok=True)
                            with open(f"storage/transcripts/{session_id}.txt", "w") as f:
                                f.write(f"Patient: {text}\n")
                            
                            # 5. Send real-time transcript back to UI
                            await websocket.send_text(json.dumps({
                                "speaker": "Patient",
                                "text_chunk": text,
                                "is_final": True
                            }))
                            
                            # Clear the file to avoid re-transcribing it on the next turn
                            os.remove(temp_file_path)
                            with open(temp_file_path, "wb") as f:
                                pass # Recreate empty file
                                
                    except Exception as e:
                        logger.error(f"STT processing failed: {e}")
                continue
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
        try:
            await websocket.close()
        except:
            pass
    finally:
        status_task.cancel()
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass
