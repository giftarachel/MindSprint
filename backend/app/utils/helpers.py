"""
Shared utility helpers.
"""
from __future__ import annotations

import re
from bson import ObjectId
from bson.errors import InvalidId
from flask import jsonify, Response


# ── ObjectId helpers ──────────────────────────────────────────────────────────

def is_valid_object_id(value: str) -> bool:
    try:
        ObjectId(value)
        return True
    except (InvalidId, TypeError):
        return False


def serialize_doc(doc: dict) -> dict:
    """Recursively convert ObjectId and datetime to JSON-serializable types."""
    if doc is None:
        return {}
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif hasattr(value, "isoformat"):          # datetime
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [
                serialize_doc(v) if isinstance(v, dict) else
                str(v) if isinstance(v, ObjectId) else v
                for v in value
            ]
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        else:
            result[key] = value
    return result


def serialize_list(docs: list[dict]) -> list[dict]:
    return [serialize_doc(d) for d in docs]


# ── Response helpers ──────────────────────────────────────────────────────────

def success_response(data=None, message: str = "Success", status: int = 200) -> tuple:
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return jsonify(body), status


def error_response(message: str, status: int = 400, errors: dict | None = None) -> tuple:
    body = {"success": False, "message": message}
    if errors:
        body["errors"] = errors
    return jsonify(body), status


# ── Validation helpers ────────────────────────────────────────────────────────

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email or ""))


def validate_password(password: str) -> tuple[bool, str]:
    """
    Minimum 8 chars, at least one letter and one digit.
    Returns (is_valid, message).
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters."
    if not re.search(r"[A-Za-z]", password):
        return False, "Password must contain at least one letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    return True, ""
