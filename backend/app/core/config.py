from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")

    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "your-super-secret-jwt-key-change-this-in-production"
    )

    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
    )

    FRONTEND_URL: str = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )

    class Config:
        env_file = ".env"

settings = Settings()