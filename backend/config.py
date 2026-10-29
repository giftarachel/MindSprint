"""
MindSprint Backend Configuration
Loads all settings from environment variables via python-dotenv.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


class Config:
    # ── Flask ────────────────────────────────────────────────
    SECRET_KEY: str = os.environ.get(
        "SECRET_KEY", "change-me-in-production-please"
    )
    DEBUG: bool = os.environ.get("FLASK_ENV", "development") == "development"

    # ── Session ──────────────────────────────────────────────
    SESSION_COOKIE_HTTPONLY: bool = True
    SESSION_COOKIE_SAMESITE: str = "Lax"
    # Set to True in production when served over HTTPS
    SESSION_COOKIE_SECURE: bool = (
        os.environ.get("SESSION_COOKIE_SECURE", "False").lower() == "true"
    )
    PERMANENT_SESSION_LIFETIME: timedelta = timedelta(hours=24)

    # ── MongoDB ──────────────────────────────────────────────
    MONGO_URI: str = os.environ.get("MONGO_URI", "")
    MONGO_DB_NAME: str = os.environ.get("MONGO_DB_NAME", "mindsprint")

    # ── CORS ─────────────────────────────────────────────────
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:5173")
