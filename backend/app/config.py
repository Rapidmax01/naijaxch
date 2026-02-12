from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "NaijaTrade Tools"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"

    # Database (SQLite for development, PostgreSQL for production)
    DATABASE_URL: str = "sqlite:///./naijatradetools.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"

    # Paystack
    PAYSTACK_SECRET_KEY: Optional[str] = None
    PAYSTACK_PUBLIC_KEY: Optional[str] = None
    PAYSTACK_WEBHOOK_SECRET: Optional[str] = None

    # Telegram
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_WEBHOOK_URL: Optional[str] = None

    # Email (Resend)
    RESEND_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "hello@naijatradetools.com"

    # Exchange APIs
    QUIDAX_API_KEY: Optional[str] = None
    QUIDAX_API_SECRET: Optional[str] = None
    LUNO_API_KEY: Optional[str] = None
    LUNO_API_SECRET: Optional[str] = None

    # Scraping
    PROXY_URL: Optional[str] = None
    SCRAPER_USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None

    # Monitoring
    SENTRY_DSN: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
