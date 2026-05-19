import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from app.core.database import db_client

logger = logging.getLogger("aegis_audit")

class CryptographicLedger:
    """
    A stateless-first ledger system that ensures every clinical decision
    has an unalterable, step-by-step chain of custody.
    """
    
    @staticmethod
    def _calculate_hash(prev_hash: str, timestamp: str, event_type: str, session_id: str, payload_str: str) -> str:
        hash_input = f"{prev_hash}|{timestamp}|{event_type}|{session_id}|{payload_str}"
        return hashlib.sha256(hash_input.encode()).hexdigest()

    @staticmethod
    async def log_event(event_type: str, session_id: str, payload: Dict[str, Any]) -> str:
        """
        Logs a cryptographically hashed event to the ledger.
        Chains the hash to the previous event for this session to prevent tampering.
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        payload_str = json.dumps(payload, sort_keys=True)
        
        # 1. Fetch the hash of the latest event for this session to create the chain
        prev_hash = ""
        if db_client.client:
            try:
                response = db_client.client.table("audit_ledger")\
                    .select("hash")\
                    .eq("session_id", session_id)\
                    .order("created_at", desc=True)\
                    .limit(1)\
                    .execute()
                
                if isinstance(response.data, list) and response.data:
                    prev_hash = response.data[0].get("hash", "")
            except Exception as e:
                logger.warning(f"Failed to fetch previous hash: {e}. Starting new chain.")
        
        # 2. Calculate current hash
        current_hash = CryptographicLedger._calculate_hash(prev_hash, timestamp, event_type, session_id, payload_str)
        
        record = {
            "session_id": session_id,
            "event_type": event_type,
            "payload": payload,
            "prev_hash": prev_hash,
            "hash": current_hash,
            "created_at": timestamp
        }
        
        # 3. Persist to secure log table
        if db_client.client:
            try:
                db_client.client.table("audit_ledger").insert(record).execute()
            except Exception as e:
                logger.error(f"Failed to write to audit ledger DB: {e}")
                
        # Also log to file system for redundancy
        logger.info(json.dumps(record))
        
        return current_hash

ledger = CryptographicLedger()
