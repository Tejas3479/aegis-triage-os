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

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()


def validate_production_settings() -> None:
    if settings.ENVIRONMENT.lower() != "production":
        return
    if settings.SECRET_KEY == "default-secret-key-for-dev":
        raise RuntimeError("SECRET_KEY must be set in production.")
    if settings.ALLOWED_ORIGINS.strip() == "*":
        raise RuntimeError("ALLOWED_ORIGINS cannot be '*' in production.")
