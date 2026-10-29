"""
Pytest fixtures for MindSprint backend tests.
Uses unittest.mock to avoid hitting a real database.
"""
from __future__ import annotations

import pytest
from unittest.mock import MagicMock, patch
from app import create_app
from config import Config


class TestConfig(Config):
    TESTING = True
    SECRET_KEY = "test-secret-key"
    DEBUG = True
    # Prevent real DB connection during tests
    MONGO_URI = ""
    MONGO_DB_NAME = "mindsprint_test"


@pytest.fixture
def app():
    with patch("app.utils.db.init_db"):  # skip real DB init
        application = create_app(TestConfig)
    application.config["TESTING"] = True
    yield application


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def mock_db():
    """Return a MagicMock that mimics the MongoDB database."""
    return MagicMock()
