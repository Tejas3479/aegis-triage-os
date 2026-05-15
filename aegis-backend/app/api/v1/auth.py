from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.core.auth import create_access_token, pwd_context
from app.core.rate_limit import check_rate_limit
from pydantic import BaseModel, Field

router = APIRouter()

# Mock user database for enterprise demonstration
MOCK_USERS = {
    "doctor_smith": {"username": "doctor_smith", "password": pwd_context.hash("aegis2026"), "role": "DOCTOR"},
    "admin_triage": {"username": "admin_triage", "password": pwd_context.hash("adminsecret"), "role": "ADMIN"}
}

@router.post("/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Enterprise authentication endpoint issuing secure JWT tokens.
    """
    user = MOCK_USERS.get(form_data.username)
    if not user or not pwd_context.verify(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=60)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

class RegisterRequest(BaseModel):
    username: str
    password: str
    hospital_code: str

@router.post("/register")
async def register_user(request: RegisterRequest):
    """
    Securely provisions a new clinical account.
    """
    if request.username in MOCK_USERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    if request.hospital_code != "AEGIS-2026":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Hospital Provisioning Code"
        )
    
    hashed_password = pwd_context.hash(request.password)
    MOCK_USERS[request.username] = {
        "username": request.username,
        "password": hashed_password,
        "role": "DOCTOR"
    }
    
    return {"message": "Clinical account provisioned securely."}

class AnonymousRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)

@router.post("/anonymous")
async def issue_anonymous_token(http_request: Request, request: AnonymousRequest):
    """
    Issues a short-lived, session-scoped token for anonymous patient triage.
    """
    client_ip = http_request.client.host if http_request.client else "unknown"
    check_rate_limit(f"anon:{client_ip}", max_requests=30, window_seconds=60)

    access_token_expires = timedelta(hours=2)
    access_token = create_access_token(
        data={"sub": f"patient_{request.session_id}", "role": "PATIENT", "session_id": request.session_id},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": "PATIENT"}
