"""
Authentication routes: register, login, logout, /me
"""
from __future__ import annotations

from datetime import datetime, timezone

import bcrypt
from bson import ObjectId
from flask import Blueprint, request, session

from app.utils.db import get_db
from app.utils.helpers import (
    error_response,
    success_response,
    serialize_doc,
    validate_email,
    validate_password,
)

auth_bp = Blueprint("auth", __name__)

# ── Rate-limit tracking (simple in-memory; use Redis in production) ──────────
_failed_attempts: dict[str, int] = {}
MAX_FAILED = 10  # lock after 10 failures per IP


def _get_ip() -> str:
    from flask import request as req
    return req.remote_addr or "unknown"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_user(user: dict) -> dict:
    """Strip sensitive fields before returning user data to the client."""
    doc = serialize_doc(user)
    doc.pop("password_hash", None)
    return doc


# ── Routes ────────────────────────────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    # Public registration only allows student or teacher roles
    role = data.get("role", "student")

    # Validation
    errors = {}
    if not name:
        errors["name"] = "Full name is required."
    if not validate_email(email):
        errors["email"] = "A valid email address is required."
    pw_ok, pw_msg = validate_password(password)
    if not pw_ok:
        errors["password"] = pw_msg
    if role not in ("student", "teacher"):
        errors["role"] = "Role must be 'student' or 'teacher'."

    if errors:
        return error_response("Please fix the errors below.", 400, errors)

    # Duplicate email check
    if db.users.find_one({"email": email}):
        return error_response("An account with this email already exists.", 409)

    # Hash password
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    now = datetime.now(timezone.utc)
    result = db.users.insert_one(
        {
            "name": name,
            "email": email,
            "password_hash": hashed,
            "role": role,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
    )

    user = db.users.find_one({"_id": result.inserted_id})
    return success_response(_safe_user(user), "Account created successfully.", 201)


@auth_bp.route("/login", methods=["POST"])
def login():
    ip = _get_ip()
    if _failed_attempts.get(ip, 0) >= MAX_FAILED:
        return error_response(
            "Too many failed login attempts. Please try again later.", 429
        )

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return error_response("Email and password are required.", 400)

    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    user = db.users.find_one({"email": email})
    if not user:
        _failed_attempts[ip] = _failed_attempts.get(ip, 0) + 1
        return error_response("Invalid email or password.", 401)

    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        _failed_attempts[ip] = _failed_attempts.get(ip, 0) + 1
        return error_response("Invalid email or password.", 401)

    if not user.get("is_active", True):
        return error_response(
            "Your account has been deactivated. Please contact support.", 403
        )

    # Clear failed attempts on success
    _failed_attempts.pop(ip, None)

    # Set session
    session.permanent = True
    session["user_id"] = str(user["_id"])
    session["role"] = user["role"]
    session["name"] = user["name"]

    return success_response(_safe_user(user), "Logged in successfully.")


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return success_response(message="Logged out successfully.")


@auth_bp.route("/me", methods=["GET"])
def me():
    if "user_id" not in session:
        return error_response("Not authenticated.", 401)

    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    user = db.users.find_one({"_id": ObjectId(session["user_id"])})
    if not user:
        session.clear()
        return error_response("User not found.", 404)

    return success_response(_safe_user(user))
