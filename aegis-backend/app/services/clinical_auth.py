import logging
from typing import Any, Dict, Optional

from app.core.auth import pwd_context
from app.core.config import settings
from app.services.database import db_client

logger = logging.getLogger("aegis_core")
CLINICAL_EMAIL_DOMAIN = "clinical.aegis.local"


def clinical_email(username: str) -> str:
    return f"{username.strip().lower()}@{CLINICAL_EMAIL_DOMAIN}"


def _supabase_ready() -> bool:
    return bool(
        db_client.client
        and settings.SUPABASE_URL
        and "supabase.co" in settings.SUPABASE_URL
        and settings.SUPABASE_KEY
        and settings.SUPABASE_KEY != "your-service-role-key"
    )


def _authenticate_from_table(username: str, password: str) -> Optional[Dict[str, Any]]:
    if not db_client.client:
        return None

    response = (
        db_client.client.table("clinical_users")
        .select("username, role, password_hash, auth_user_id, is_active")
        .eq("username", username)
        .limit(1)
        .execute()
    )
    if not response.data:
        return None

    row = response.data[0]
    if not row.get("is_active", True):
        return None
    if not pwd_context.verify(password, row["password_hash"]):
        return None

    return {
        "username": row["username"],
        "role": row["role"],
        "auth_user_id": row.get("auth_user_id"),
    }


def _authenticate_supabase(username: str, password: str) -> Optional[Dict[str, Any]]:
    if not _supabase_ready():
        return None

    try:
        result = db_client.client.auth.sign_in_with_password(
            {"email": clinical_email(username), "password": password}
        )
        user = result.user
        if not user:
            return None

        app_meta = user.app_metadata or {}
        user_meta = user.user_metadata or {}
        role = app_meta.get("role") or user_meta.get("role")

        if not role and db_client.client:
            lookup = (
                db_client.client.table("clinical_users")
                .select("role")
                .eq("username", username)
                .limit(1)
                .execute()
            )
            if lookup.data:
                role = lookup.data[0]["role"]

        if role not in ("DOCTOR", "ADMIN"):
            return None

        return {"username": username, "role": role, "auth_user_id": user.id}
    except Exception as exc:
        logger.debug("Supabase Auth sign-in failed for %s: %s", username, exc)
        return None


def authenticate_clinical_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate via Supabase Auth, falling back to clinical_users table."""
    username = username.strip()
    if not username or not password:
        return None

    user = _authenticate_supabase(username, password)
    if user:
        return user
    return _authenticate_from_table(username, password)


def register_clinical_user(
    username: str, password: str, role: str, hospital_code: str
) -> Dict[str, str]:
    username = username.strip()
    if role not in ("DOCTOR", "ADMIN"):
        raise ValueError("Invalid clinical role.")
    if hospital_code != settings.HOSPITAL_PROVISIONING_CODE:
        raise PermissionError("Invalid hospital provisioning code.")

    if not db_client.client:
        raise RuntimeError("Database unavailable.")

    existing = (
        db_client.client.table("clinical_users")
        .select("id")
        .eq("username", username)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise ValueError("Username already registered.")

    password_hash = pwd_context.hash(password)
    auth_user_id = None

    if _supabase_ready():
        try:
            created = db_client.client.auth.admin.create_user(
                {
                    "email": clinical_email(username),
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {"username": username, "role": role},
                    "app_metadata": {"role": role},
                }
            )
            if created.user:
                auth_user_id = created.user.id
        except Exception as exc:
            logger.warning("Supabase Auth user creation failed: %s", exc)
            raise RuntimeError("Could not provision auth identity.") from exc

    db_client.client.table("clinical_users").insert(
        {
            "username": username,
            "password_hash": password_hash,
            "role": role,
            "hospital_code": hospital_code,
            "auth_user_id": auth_user_id,
            "is_active": True,
        }
    ).execute()

    return {"username": username, "role": role}


def bootstrap_clinical_users() -> None:
    """Seed initial admin/doctor accounts from env (never hardcoded in source)."""
    if not db_client.client:
        logger.warning("Skipping clinical user bootstrap: database unavailable.")
        return

    try:
        existing = db_client.client.table("clinical_users").select("id").limit(1).execute()
        if existing.data:
            return
    except Exception as exc:
        logger.warning(
            "Clinical user bootstrap skipped: 'clinical_users' table not found in schema. "
            "Please run the SQL migrations in 'supabase/migrations/' to initialize your database. "
            "Error: %s",
            exc,
        )
        return

    admin_password = settings.BOOTSTRAP_ADMIN_PASSWORD
    doctor_password = settings.BOOTSTRAP_DOCTOR_PASSWORD

    if not admin_password:
        logger.warning(
            "No clinical_users rows and BOOTSTRAP_ADMIN_PASSWORD unset; "
            "create users via register or set bootstrap env vars."
        )
        return

    seeds = [
        ("admin_triage", admin_password, "ADMIN"),
    ]
    if doctor_password:
        seeds.append(("doctor_smith", doctor_password, "DOCTOR"))

    code = settings.HOSPITAL_PROVISIONING_CODE
    for username, password, role in seeds:
        try:
            register_clinical_user(username, password, role, code)
            logger.info("Bootstrapped clinical user: %s (%s)", username, role)
        except Exception as exc:
            logger.error("Failed to bootstrap %s: %s", username, exc)
