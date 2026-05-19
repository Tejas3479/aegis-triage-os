import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import time
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from app.core.config import settings

# Security Configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

_JWKS_CACHE = None
_JWKS_EXPIRE = 0

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class User(BaseModel):
    username: str
    role: str  # 'PATIENT', 'DOCTOR', 'ADMIN'
    session_id: Optional[str] = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Generates a secure JWT access token for enterprise session management.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency to validate JWT tokens and extract user identity.
    Supports Clerk JWTs if CLERK_JWKS_URL is configured.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try Clerk verification if URL is set
    clerk_url = settings.CLERK_JWKS_URL
    if clerk_url:
        try:
            import httpx
            global _JWKS_CACHE, _JWKS_EXPIRE
            
            jwks = None
            if _JWKS_CACHE and time.time() < _JWKS_EXPIRE:
                jwks = _JWKS_CACHE
            else:
                async with httpx.AsyncClient() as client:
                    res = await client.get(clerk_url)
                    if res.status_code == 200:
                        _JWKS_CACHE = res.json()
                        _JWKS_EXPIRE = time.time() + 3600  # 1 hour cache
                        jwks = _JWKS_CACHE
            
            if jwks:
                unverified_header = jwt.get_unverified_header(token)
                kid = unverified_header.get('kid')
                
                key = None
                for k in jwks.get('keys', []):
                    if str(k.get('kid')).lower() == str(kid).lower():
                        key = k
                        break
                    
                    if key:
                        payload = jwt.decode(token, key, algorithms=['RS256'])
                        username: str = payload.get("sub")
                        # Clerk tokens might not have role, default to DOCTOR for verified users
                        role: str = payload.get("role") or "DOCTOR"
                        session_id: Optional[str] = payload.get("session_id")
                        
                        return User(
                            username=username,
                            role=role,
                            session_id=session_id,
                        )
        except Exception as e:
            print(f"Clerk verification failed: {e}")
            # Fallback to normal verification below
            pass

    # Normal verification (Fallback)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        session_id: Optional[str] = payload.get("session_id")
        if username is None or role is None:
            raise credentials_exception
        return User(
            username=username,
            role=role,
            session_id=session_id,
        )
    except JWTError:
        raise credentials_exception


def assert_session_access(current_user: User, session_id: str) -> None:
    """PATIENT tokens are scoped to a single triage session."""
    if current_user.role == "PATIENT":
        if not current_user.session_id or current_user.session_id != str(session_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied for this clinical session.",
            )

def check_role(required_roles: List[str]):
    """
    Enterprise RBAC (Role-Based Access Control) dependency factory.
    """
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for your current role level."
            )
        return current_user
    return role_checker
