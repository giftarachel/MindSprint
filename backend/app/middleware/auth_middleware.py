"""
Authentication and authorization decorators.
"""
from __future__ import annotations

from functools import wraps
from flask import session
from app.utils.helpers import error_response


def login_required(f):
    """Require an authenticated session."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return error_response("Authentication required.", 401)
        return f(*args, **kwargs)
    return decorated


def role_required(*roles: str):
    """Require the session user to have one of the specified roles."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if "user_id" not in session:
                return error_response("Authentication required.", 401)
            user_role = session.get("role", "")
            if user_role not in roles:
                return error_response(
                    "You do not have permission to access this resource.", 403
                )
            return f(*args, **kwargs)
        return decorated
    return decorator


def admin_required(f):
    return role_required("admin")(f)


def teacher_required(f):
    return role_required("teacher", "admin")(f)


def student_required(f):
    return role_required("student")(f)
