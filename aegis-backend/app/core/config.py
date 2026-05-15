import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # API Configurations
    PROJECT_NAME: str = "Aegis Triage OS"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    
    # Database Configurations
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "your-service-role-key")
    
    # GenAI Matrix
    GOOGLE_GENAI_API_KEY: str = os.getenv("GOOGLE_GENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "") # Fallback mapping
    
    # CORS Origins (Crucial link between Vercel and Render)
    # Allows any Vercel preview deployment or localhost to access the API safely
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default-secret-key-for-dev")
    ALGORITHM: str = "HS256"
    HOSPITAL_PROVISIONING_CODE: str = os.getenv(
        "HOSPITAL_PROVISIONING_CODE",
        "AEGIS-DEV-ONLY" if os.getenv("ENVIRONMENT", "development").lower() != "production" else "",
    )
    BOOTSTRAP_ADMIN_PASSWORD: str = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")
    BOOTSTRAP_DOCTOR_PASSWORD: str = os.getenv("BOOTSTRAP_DOCTOR_PASSWORD", "")

    # Speech-to-text: local (default) keeps audio off cloud; cloud requires explicit opt-in
    STT_PROVIDER: str = os.getenv("STT_PROVIDER", "local")
    VOSK_MODEL_PATH: str = os.getenv("VOSK_MODEL_PATH", "models/vosk-en-small")

    # LangGraph durable checkpoints
    CHECKPOINT_DATABASE_URL: str = os.getenv("CHECKPOINT_DATABASE_URL", "")
    CHECKPOINT_SQLITE_PATH: str = os.getenv(
        "CHECKPOINT_SQLITE_PATH", "storage/langgraph_checkpoints.db"
    )

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()


def validate_production_settings() -> None:
    if settings.ENVIRONMENT.lower() != "production":
        return
    if settings.SECRET_KEY == "default-secret-key-for-dev":
        raise RuntimeError("SECRET_KEY must be set in production.")
    if settings.ALLOWED_ORIGINS.strip() == "*":
        raise RuntimeError("ALLOWED_ORIGINS cannot be '*' in production.")
    if not settings.HOSPITAL_PROVISIONING_CODE:
        raise RuntimeError("HOSPITAL_PROVISIONING_CODE must be set in production.")
    if settings.STT_PROVIDER.lower() == "local" and not settings.VOSK_MODEL_PATH:
        raise RuntimeError("VOSK_MODEL_PATH must be set when STT_PROVIDER=local in production.")
