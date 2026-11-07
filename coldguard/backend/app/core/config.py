"""
app/core/config.py
──────────────────
Reads all settings from the .env file (or environment variables).
Using pydantic-settings so every value is type-checked automatically.
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # ── App ──
    APP_SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    # ── Database ──
    DATABASE_URL: str = "sqlite:///./coldguard.db"

    # ── CORS ──
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # ── Notifications ──
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_IDS: str = ""   # comma-separated list of chat ids
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    EMAIL_FROM: str = "coldguard@example.com"
    EMAIL_TO: str = ""            # comma-separated list

    # ── Sensor ingestion ──
    SENSOR_API_KEY: str = "dev-sensor-key"

    # ── Cold-chain business rules (can be overridden per unit in DB) ──
    SAFE_MIN: float = 2.0
    SAFE_MAX: float = 8.0
    WARN_LOW: float = 2.5
    WARN_HIGH: float = 7.5
    CRIT_MIN: float = 0.0
    CRIT_MAX: float = 10.0
    EXCURSION_MINUTES: int = 5
    OFFLINE_MINUTES: int = 10
    ESCALATE_L2_MINUTES: int = 10
    ESCALATE_L3_MINUTES: int = 20
    REMINDER_MINUTES: int = 10

    class Config:
        env_file = ".env"
        extra = "ignore"


# Singleton – import this everywhere
settings = Settings()

