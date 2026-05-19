import logging
import os
import sqlite3
from typing import Any, Optional

from app.core.config import settings

logger = logging.getLogger("aegis_core")
_checkpointer: Optional[Any] = None
_pg_context: Optional[Any] = None

# Eager imports with fallback to top level
try:
    from langgraph.checkpoint.postgres import PostgresSaver
except ImportError:
    PostgresSaver = None

try:
    from langgraph.checkpoint.sqlite import SqliteSaver
except ImportError:
    SqliteSaver = None

try:
    from langgraph.checkpoint.memory import MemorySaver
except ImportError:
    MemorySaver = None


def init_checkpointer() -> Any:
    """Initialize durable LangGraph checkpoint store (Postgres or SQLite)."""
    global _checkpointer, _pg_context
    os.makedirs(os.path.dirname(settings.CHECKPOINT_SQLITE_PATH) or "storage", exist_ok=True)

    if settings.CHECKPOINT_DATABASE_URL:
        if PostgresSaver is None:
            raise RuntimeError("Postgres checkpointer libraries not installed but CHECKPOINT_DATABASE_URL is set.")
        try:
            _pg_context = PostgresSaver.from_conn_string(settings.CHECKPOINT_DATABASE_URL)
            _checkpointer = _pg_context.__enter__()
            _checkpointer.setup()
            logger.info("LangGraph Postgres checkpointer ready.")
            return _checkpointer
        except Exception as exc:
            logger.warning("Postgres checkpointer initialization failed (%s); falling back to SQLite.", exc)
    else:
        logger.warning("CHECKPOINT_DATABASE_URL is not set. Falling back to SQLite checkpointer for state persistence.")

    if SqliteSaver is not None:
        try:
            conn = sqlite3.connect(settings.CHECKPOINT_SQLITE_PATH, check_same_thread=False)
            _checkpointer = SqliteSaver(conn)
            logger.info("LangGraph SQLite checkpointer ready at %s", settings.CHECKPOINT_SQLITE_PATH)
            return _checkpointer
        except Exception as exc:
            logger.warning("SQLite checkpointer initialization failed (%s); falling back to Memory.", exc)
            
    if MemorySaver is not None:
        _checkpointer = MemorySaver()
        logger.warning(
            "Falling back to in-memory state. Clinical sessions will NOT persist across restarts. "
            "Run 'pip install -r requirements.txt' to enable durable persistence."
        )
        return _checkpointer
        
    # Final fallback for minimal langgraph installation
    from langgraph.checkpoint.base import BaseCheckpointSaver
    class MockSaver(BaseCheckpointSaver):
        def get_tuple(self, config): return None
        def put(self, config, checkpoint, metadata, new_versions): return config
        def list(self, config, *, before=None, limit=None): return []

    _checkpointer = MockSaver()
    logger.critical("LangGraph checkpointing system completely unavailable. Using mock.")
    return _checkpointer


def get_checkpointer() -> Any:
    if _checkpointer is None:
        raise RuntimeError("Checkpointer not initialized. Call init_checkpointer() during startup.")
    return _checkpointer


def shutdown_checkpointer() -> None:
    global _checkpointer, _pg_context
    if _pg_context is not None:
        try:
            _pg_context.__exit__(None, None, None)
        except Exception as exc:
            logger.warning("Error closing Postgres checkpointer: %s", exc)
    _pg_context = None
    _checkpointer = None
