import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"

settings = Settings()
