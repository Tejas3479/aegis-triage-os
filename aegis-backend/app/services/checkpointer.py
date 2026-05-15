import logging
import os
import sqlite3
from typing import Any, Optional

from app.core.config import settings

logger = logging.getLogger("aegis_core")
_checkpointer: Optional[Any] = None
_pg_context: Optional[Any] = None


def init_checkpointer() -> Any:
    """Initialize durable LangGraph checkpoint store (Postgres or SQLite)."""
    global _checkpointer, _pg_context
    os.makedirs(os.path.dirname(settings.CHECKPOINT_SQLITE_PATH) or "storage", exist_ok=True)

    if settings.CHECKPOINT_DATABASE_URL:
        try:
            from langgraph.checkpoint.postgres import PostgresSaver

            _pg_context = PostgresSaver.from_conn_string(settings.CHECKPOINT_DATABASE_URL)
            _checkpointer = _pg_context.__enter__()
            _checkpointer.setup()
            logger.info("LangGraph Postgres checkpointer ready.")
            return _checkpointer
        except Exception as exc:
            logger.warning("Postgres checkpointer unavailable (%s); using SQLite.", exc)

    from langgraph.checkpoint.sqlite import SqliteSaver

    conn = sqlite3.connect(settings.CHECKPOINT_SQLITE_PATH, check_same_thread=False)
    _checkpointer = SqliteSaver(conn)
    logger.info("LangGraph SQLite checkpointer ready at %s", settings.CHECKPOINT_SQLITE_PATH)
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
