"""
Tests for authentication: registration, login, password hashing,
role enforcement, and session handling.
"""
from __future__ import annotations

import bcrypt
import pytest
from unittest.mock import MagicMock, patch
from bson import ObjectId
from datetime import datetime, timezone


# ── Password hashing tests (no DB required) ───────────────────────────────────

def test_password_hash_is_not_plaintext():
    password = "MySecurePass1"
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    assert hashed != password


def test_password_hash_verifies_correctly():
    password = "MySecurePass1"
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    assert bcrypt.checkpw(password.encode(), hashed.encode())


def test_wrong_password_fails_verification():
    password = "MySecurePass1"
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    assert not bcrypt.checkpw(b"WrongPassword1", hashed.encode())


# ── Registration validation ────────────────────────────────────────────────────

def test_register_missing_fields(client):
    with patch("app.routes.auth.get_db") as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        resp = client.post("/api/auth/register", json={})
        assert resp.status_code == 400
        data = resp.get_json()
        assert not data["success"]
        assert "errors" in data


def test_register_invalid_email(client):
    with patch("app.routes.auth.get_db") as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        resp = client.post("/api/auth/register", json={
            "name": "Test User",
            "email": "not-an-email",
            "password": "Password1",
            "role": "student",
        })
        assert resp.status_code == 400
        data = resp.get_json()
        assert "email" in data.get("errors", {})


def test_register_weak_password(client):
    with patch("app.routes.auth.get_db") as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        resp = client.post("/api/auth/register", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "123",
            "role": "student",
        })
        assert resp.status_code == 400
        data = resp.get_json()
        assert "password" in data.get("errors", {})


def test_register_admin_role_rejected(client):
    with patch("app.routes.auth.get_db") as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        resp = client.post("/api/auth/register", json={
            "name": "Hacker",
            "email": "hacker@example.com",
            "password": "Hacker123",
            "role": "admin",
        })
        assert resp.status_code == 400
        data = resp.get_json()
        assert "role" in data.get("errors", {})


def test_register_duplicate_email(client):
    with patch("app.routes.auth.get_db") as mock_get_db:
        mock_db = MagicMock()
        # Simulate existing user found
        mock_db.users.find_one.return_value = {"email": "test@example.com"}
        mock_get_db.return_value = mock_db

        resp = client.post("/api/auth/register", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "Password1",
            "role": "student",
        })
        assert resp.status_code == 409
        assert not resp.get_json()["success"]


def test_register_success(client):
    with patch("app.routes.auth.get_db") as mock_get_db:
        mock_db = MagicMock()
        mock_db.users.find_one.side_effect = [
            None,  # duplicate check — no existing user
            {      # return after insert
                "_id": ObjectId(),
                "name": "Alice",
                "email": "alice@example.com",
                "role": "student",
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            },
        ]
        mock_db.users.insert_one.return_value = MagicMock(inserted_id=ObjectId())
        mock_get_db.return_value = mock_db

        resp = client.post("/api/auth/register", json={
            "name": "Alice",
            "email": "alice@example.com",
            "password": "Password1",
            "role": "student",
        })
        assert resp.status_code == 201
        assert resp.get_json()["success"]


# ── Login ─────────────────────────────────────────────────────────────────────

def test_login_missing_fields(client):
    resp = client.post("/api/auth/login", json={})
    assert resp.status_code == 400


def test_login_wrong_password(client):
    with patch("app.routes.auth.get_db") as mock_get_db:
        mock_db = MagicMock()
        real_hash = bcrypt.hashpw(b"CorrectPass1", bcrypt.gensalt()).decode()
        mock_db.users.find_one.return_value = {
            "_id": ObjectId(),
            "name": "Bob",
            "email": "bob@example.com",
            "password_hash": real_hash,
            "role": "student",
            "is_active": True,
        }
        mock_get_db.return_value = mock_db

        resp = client.post("/api/auth/login", json={
            "email": "bob@example.com",
            "password": "WrongPass1",
        })
        assert resp.status_code == 401


def test_login_inactive_account(client):
    with patch("app.routes.auth.get_db") as mock_get_db:
        mock_db = MagicMock()
        real_hash = bcrypt.hashpw(b"Password1", bcrypt.gensalt()).decode()
        mock_db.users.find_one.return_value = {
            "_id": ObjectId(),
            "name": "Inactive",
            "email": "inactive@example.com",
            "password_hash": real_hash,
            "role": "student",
            "is_active": False,
        }
        mock_get_db.return_value = mock_db

        resp = client.post("/api/auth/login", json={
            "email": "inactive@example.com",
            "password": "Password1",
        })
        assert resp.status_code == 403


def test_login_success(client):
    with patch("app.routes.auth.get_db") as mock_get_db:
        mock_db = MagicMock()
        real_hash = bcrypt.hashpw(b"Password1", bcrypt.gensalt()).decode()
        user_doc = {
            "_id": ObjectId(),
            "name": "Bob",
            "email": "bob@example.com",
            "password_hash": real_hash,
            "role": "student",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        mock_db.users.find_one.return_value = user_doc
        mock_get_db.return_value = mock_db

        resp = client.post("/api/auth/login", json={
            "email": "bob@example.com",
            "password": "Password1",
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"]
        # Password hash must not be exposed
        assert "password_hash" not in data.get("data", {})


# ── Role-based access control ─────────────────────────────────────────────────

def test_admin_endpoint_rejects_unauthenticated(client):
    resp = client.get("/api/admin/dashboard")
    assert resp.status_code == 401


def test_teacher_endpoint_rejects_student(client):
    with client.session_transaction() as sess:
        sess["user_id"] = str(ObjectId())
        sess["role"] = "student"
    resp = client.get("/api/teacher/dashboard")
    assert resp.status_code == 403


def test_student_endpoint_rejects_teacher(client):
    with client.session_transaction() as sess:
        sess["user_id"] = str(ObjectId())
        sess["role"] = "teacher"
    resp = client.post(f"/api/student/quizzes/{ObjectId()}/attempts")
    assert resp.status_code == 403


def test_admin_can_access_admin_dashboard(client):
    with patch("app.routes.admin.get_db") as mock_get_db:
        mock_db = MagicMock()
        mock_db.users.count_documents.return_value = 0
        mock_db.quizzes.count_documents.return_value = 0
        mock_db.attempts.count_documents.return_value = 0
        mock_db.attempts.aggregate.return_value = iter([])
        mock_get_db.return_value = mock_db

        with client.session_transaction() as sess:
            sess["user_id"] = str(ObjectId())
            sess["role"] = "admin"

        resp = client.get("/api/admin/dashboard")
        assert resp.status_code == 200


# ── Score calculation ─────────────────────────────────────────────────────────

def test_score_calculation_logic():
    """Unit test for scoring logic independent of Flask."""
    questions = [
        {"_id": ObjectId(), "correct_option": "A", "marks": 2},
        {"_id": ObjectId(), "correct_option": "B", "marks": 3},
        {"_id": ObjectId(), "correct_option": "C", "marks": 1},
    ]
    submitted = {
        str(questions[0]["_id"]): "A",   # correct
        str(questions[1]["_id"]): "C",   # wrong
        str(questions[2]["_id"]): "C",   # correct
    }

    score = 0
    total = 0
    for q in questions:
        total += q["marks"]
        if submitted.get(str(q["_id"])) == q["correct_option"]:
            score += q["marks"]

    assert total == 6
    assert score == 3
    assert round(score / total * 100, 2) == 50.0


def test_unanswered_question_scores_zero():
    questions = [{"_id": ObjectId(), "correct_option": "A", "marks": 5}]
    submitted = {}  # no answers
    score = 0
    for q in questions:
        if submitted.get(str(q["_id"])) == q["correct_option"]:
            score += q["marks"]
    assert score == 0
