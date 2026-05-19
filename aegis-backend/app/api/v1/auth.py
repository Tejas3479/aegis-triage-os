import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field

from app.core.auth import create_access_token
from app.core.rate_limit import check_rate_limit
from app.core.config import settings
from app.security.clinical_auth import authenticate_clinical_user, register_clinical_user

router = APIRouter()
logger = logging.getLogger("aegis_core")


@router.post("/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Clinical staff login (Supabase Auth + clinical_users table)."""
    user = authenticate_clinical_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=timedelta(minutes=60),
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=128)
    hospital_code: str = Field(..., min_length=1)


@router.post("/register")
async def register_user(request: RegisterRequest):
    """Provision a new doctor account (requires hospital provisioning code)."""
    try:
        register_clinical_user(
            request.username,
            request.password,
            "DOCTOR",
            request.hospital_code,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    return {"message": "Clinical account provisioned securely."}


class AnonymousRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)


@router.post("/anonymous")
async def issue_anonymous_token(http_request: Request, request: AnonymousRequest):
    """Session-scoped PATIENT token for anonymous triage."""
    client_ip = http_request.client.host if http_request.client else "unknown"
    check_rate_limit(f"anon:{client_ip}", max_requests=30, window_seconds=60)

    access_token = create_access_token(
        data={
            "sub": f"patient_{request.session_id}",
            "role": "PATIENT",
            "session_id": request.session_id,
        },
        expires_delta=timedelta(hours=2),
    )
    return {"access_token": access_token, "token_type": "bearer", "role": "PATIENT"}

from app.core.auth import get_current_user, User

@router.get("/verify")
async def verify_token(current_user: User = Depends(get_current_user)):
    """Verify token and return user role."""
    return {"valid": True, "role": current_user.role, "username": current_user.username}
