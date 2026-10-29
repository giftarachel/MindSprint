"""
Admin routes: dashboard, user management, quiz oversight, statistics.
"""
from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, request, session

from app.utils.db import get_db
from app.utils.helpers import (
    error_response,
    success_response,
    serialize_doc,
    serialize_list,
    is_valid_object_id,
)
from app.middleware.auth_middleware import admin_required

admin_bp = Blueprint("admin", __name__)


# ── Dashboard ─────────────────────────────────────────────────────────────────

@admin_bp.route("/dashboard", methods=["GET"])
@admin_required
def dashboard():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    total_users = db.users.count_documents({})
    total_students = db.users.count_documents({"role": "student"})
    total_teachers = db.users.count_documents({"role": "teacher"})
    total_quizzes = db.quizzes.count_documents({})
    published_quizzes = db.quizzes.count_documents({"status": "published"})
    total_attempts = db.attempts.count_documents({})

    # Recent 5 attempts
    recent_attempts = list(
        db.attempts.aggregate([
            {"$sort": {"started_at": -1}},
            {"$limit": 5},
            {"$lookup": {
                "from": "users",
                "localField": "student_id",
                "foreignField": "_id",
                "as": "student",
            }},
            {"$lookup": {
                "from": "quizzes",
                "localField": "quiz_id",
                "foreignField": "_id",
                "as": "quiz",
            }},
            {"$project": {
                "student_name": {"$arrayElemAt": ["$student.name", 0]},
                "quiz_title": {"$arrayElemAt": ["$quiz.title", 0]},
                "score": 1,
                "total_marks": 1,
                "percentage": 1,
                "status": 1,
                "started_at": 1,
            }},
        ])
    )

    return success_response({
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_quizzes": total_quizzes,
        "published_quizzes": published_quizzes,
        "total_attempts": total_attempts,
        "recent_attempts": serialize_list(recent_attempts),
    })


# ── Users ─────────────────────────────────────────────────────────────────────

@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(int(request.args.get("per_page", 20)), 100)
    role_filter = request.args.get("role", "")
    search = (request.args.get("search") or "").strip()

    query: dict = {}
    if role_filter in ("admin", "teacher", "student"):
        query["role"] = role_filter
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    total = db.users.count_documents(query)
    users = list(
        db.users.find(query, {"password_hash": 0})
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )

    return success_response({
        "users": serialize_list(users),
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    })


@admin_bp.route("/users/<user_id>", methods=["PATCH"])
@admin_required
def update_user(user_id: str):
    if not is_valid_object_id(user_id):
        return error_response("Invalid user ID.", 400)

    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    # Prevent admin from demoting themselves
    if user_id == session.get("user_id"):
        return error_response("You cannot modify your own account via this endpoint.", 403)

    data = request.get_json(silent=True) or {}
    allowed = ("is_active", "role")
    updates = {k: v for k, v in data.items() if k in allowed}

    if not updates:
        return error_response("No valid fields to update.", 400)

    if "role" in updates and updates["role"] not in ("admin", "teacher", "student"):
        return error_response("Invalid role.", 400)

    updates["updated_at"] = datetime.now(timezone.utc)
    result = db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": updates}
    )
    if result.matched_count == 0:
        return error_response("User not found.", 404)

    user = db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0})
    return success_response(serialize_doc(user), "User updated.")


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id: str):
    if not is_valid_object_id(user_id):
        return error_response("Invalid user ID.", 400)

    if user_id == session.get("user_id"):
        return error_response("You cannot delete your own account.", 403)

    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    # Prevent deleting last admin
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return error_response("User not found.", 404)
    if user["role"] == "admin":
        admin_count = db.users.count_documents({"role": "admin", "is_active": True})
        if admin_count <= 1:
            return error_response(
                "Cannot delete the last active administrator.", 409
            )

    db.users.delete_one({"_id": ObjectId(user_id)})
    return success_response(message="User deleted.")


# ── Quizzes ───────────────────────────────────────────────────────────────────

@admin_bp.route("/quizzes", methods=["GET"])
@admin_required
def list_all_quizzes():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(int(request.args.get("per_page", 20)), 100)

    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$lookup": {
            "from": "users",
            "localField": "teacher_id",
            "foreignField": "_id",
            "as": "teacher",
        }},
        {"$project": {
            "title": 1, "status": 1, "created_at": 1,
            "teacher_name": {"$arrayElemAt": ["$teacher.name", 0]},
            "category_id": 1,
        }},
        {"$skip": (page - 1) * per_page},
        {"$limit": per_page},
    ]
    quizzes = list(db.quizzes.aggregate(pipeline))
    total = db.quizzes.count_documents({})
    return success_response({
        "quizzes": serialize_list(quizzes),
        "total": total,
        "page": page,
        "pages": (total + per_page - 1) // per_page,
    })


@admin_bp.route("/quizzes/<quiz_id>", methods=["PATCH"])
@admin_required
def update_quiz_status(quiz_id: str):
    if not is_valid_object_id(quiz_id):
        return error_response("Invalid quiz ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("draft", "published", "archived"):
        return error_response("Status must be draft, published, or archived.", 400)

    result = db.quizzes.update_one(
        {"_id": ObjectId(quiz_id)},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        return error_response("Quiz not found.", 404)
    return success_response(message="Quiz status updated.")


# ── Statistics ────────────────────────────────────────────────────────────────

@admin_bp.route("/statistics", methods=["GET"])
@admin_required
def statistics():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    # Attempts per day (last 7 days)
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    daily_attempts = list(db.attempts.aggregate([
        {"$match": {"started_at": {"$gte": week_ago}}},
        {"$group": {
            "_id": {
                "$dateToString": {"format": "%Y-%m-%d", "date": "$started_at"}
            },
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]))

    # Average score overall
    avg_pipeline = list(db.attempts.aggregate([
        {"$match": {"status": "submitted", "percentage": {"$exists": True}}},
        {"$group": {"_id": None, "avg_pct": {"$avg": "$percentage"}}},
    ]))
    avg_score = round(avg_pipeline[0]["avg_pct"], 2) if avg_pipeline else 0

    # Top quizzes by attempts
    top_quizzes = list(db.attempts.aggregate([
        {"$group": {"_id": "$quiz_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
        {"$lookup": {
            "from": "quizzes",
            "localField": "_id",
            "foreignField": "_id",
            "as": "quiz",
        }},
        {"$project": {
            "quiz_title": {"$arrayElemAt": ["$quiz.title", 0]},
            "attempts": "$count",
        }},
    ]))

    return success_response({
        "daily_attempts": serialize_list(daily_attempts),
        "avg_score_percentage": avg_score,
        "top_quizzes": serialize_list(top_quizzes),
    })
