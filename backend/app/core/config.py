from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:Zaq1xsw2%40@127.0.0.1:5432/autoflex_hr"
    )

    OPENAI_API_KEY: str = os.getenv("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", "")

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

settings = Settings()