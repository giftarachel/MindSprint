"""
MongoDB connection management.
Uses a module-level client so the connection is shared across requests.
"""
from __future__ import annotations

from flask import Flask
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ConfigurationError
import certifi


_client: MongoClient | None = None
_db = None


def init_db(app: Flask) -> None:
    """Initialise MongoDB client and create indexes."""
    global _client, _db

    uri = app.config.get("MONGO_URI", "")
    db_name = app.config.get("MONGO_DB_NAME", "mindsprint")

    if not uri:
        app.logger.warning(
            "MONGO_URI is not set. Database features will not work."
        )
        return

    try:
        _client = MongoClient(
            uri,
            serverSelectionTimeoutMS=5000,
            tlsCAFile=certifi.where(),
        )
        # Verify the connection is reachable
        _client.admin.command("ping")
        _db = _client[db_name]
        app.logger.info("MongoDB connected: database=%s", db_name)
        _ensure_indexes()
    except (ConnectionFailure, ConfigurationError) as exc:
        app.logger.error("MongoDB connection failed: %s", exc)
        # Do not crash the app – routes will return 503 when db is None


def get_db():
    """Return the active database instance."""
    return _db


def _ensure_indexes() -> None:
    """Create indexes that do not already exist."""
    if _db is None:
        return

    # users
    _db.users.create_index("email", unique=True, background=True)
    _db.users.create_index("role", background=True)

    # quizzes
    _db.quizzes.create_index("teacher_id", background=True)
    _db.quizzes.create_index("status", background=True)
    _db.quizzes.create_index("category_id", background=True)

    # questions
    _db.questions.create_index("quiz_id", background=True)

    # attempts
    _db.attempts.create_index(
        [("quiz_id", ASCENDING), ("student_id", ASCENDING)], background=True
    )
    _db.attempts.create_index("student_id", background=True)
    _db.attempts.create_index(
        [("percentage", DESCENDING), ("duration_seconds", ASCENDING)],
        background=True,
    )
