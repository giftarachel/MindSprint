"""
Teacher routes: dashboard, quiz CRUD, question CRUD, attempt viewing.
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
from app.middleware.auth_middleware import teacher_required

teacher_bp = Blueprint("teacher", __name__)


def _teacher_id() -> ObjectId:
    return ObjectId(session["user_id"])


# ── Dashboard ─────────────────────────────────────────────────────────────────

@teacher_bp.route("/dashboard", methods=["GET"])
@teacher_required
def dashboard():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    tid = _teacher_id()
    total_quizzes = db.quizzes.count_documents({"teacher_id": tid})
    published = db.quizzes.count_documents({"teacher_id": tid, "status": "published"})
    drafts = db.quizzes.count_documents({"teacher_id": tid, "status": "draft"})

    # Total attempts across this teacher's quizzes
    quiz_ids = [q["_id"] for q in db.quizzes.find({"teacher_id": tid}, {"_id": 1})]
    total_attempts = db.attempts.count_documents({"quiz_id": {"$in": quiz_ids}})

    # Recent quiz activity
    recent_quizzes = list(
        db.quizzes.find({"teacher_id": tid})
        .sort("updated_at", -1)
        .limit(5)
    )

    return success_response({
        "total_quizzes": total_quizzes,
        "published_quizzes": published,
        "draft_quizzes": drafts,
        "total_attempts": total_attempts,
        "recent_quizzes": serialize_list(recent_quizzes),
    })


# ── Quiz CRUD ─────────────────────────────────────────────────────────────────

@teacher_bp.route("/quizzes", methods=["GET"])
@teacher_required
def list_quizzes():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    quizzes = list(
        db.quizzes.find({"teacher_id": _teacher_id()}).sort("created_at", -1)
    )
    # Attach question counts
    for q in quizzes:
        q["question_count"] = db.questions.count_documents({"quiz_id": q["_id"]})

    return success_response(serialize_list(quizzes))


@teacher_bp.route("/quizzes", methods=["POST"])
@teacher_required
def create_quiz():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return error_response("Quiz title is required.", 400)

    category_id = data.get("category_id")
    if category_id and not is_valid_object_id(category_id):
        return error_response("Invalid category ID.", 400)

    now = datetime.now(timezone.utc)
    doc = {
        "title": title,
        "description": (data.get("description") or "").strip(),
        "category_id": ObjectId(category_id) if category_id else None,
        "teacher_id": _teacher_id(),
        "duration_minutes": max(int(data.get("duration_minutes", 30)), 1),
        "passing_percentage": float(data.get("passing_percentage") or 0),
        "status": "draft",
        "available_from": None,
        "available_until": None,
        "created_at": now,
        "updated_at": now,
    }
    result = db.quizzes.insert_one(doc)
    quiz = db.quizzes.find_one({"_id": result.inserted_id})
    return success_response(serialize_doc(quiz), "Quiz created.", 201)


@teacher_bp.route("/quizzes/<quiz_id>", methods=["GET"])
@teacher_required
def get_quiz(quiz_id: str):
    if not is_valid_object_id(quiz_id):
        return error_response("Invalid quiz ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    quiz = db.quizzes.find_one({"_id": ObjectId(quiz_id), "teacher_id": _teacher_id()})
    if not quiz:
        return error_response("Quiz not found.", 404)

    questions = list(db.questions.find({"quiz_id": ObjectId(quiz_id)}).sort("order", 1))
    data = serialize_doc(quiz)
    data["questions"] = serialize_list(questions)
    return success_response(data)


@teacher_bp.route("/quizzes/<quiz_id>", methods=["PATCH"])
@teacher_required
def update_quiz(quiz_id: str):
    if not is_valid_object_id(quiz_id):
        return error_response("Invalid quiz ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    quiz = db.quizzes.find_one({"_id": ObjectId(quiz_id), "teacher_id": _teacher_id()})
    if not quiz:
        return error_response("Quiz not found.", 404)

    data = request.get_json(silent=True) or {}
    allowed_fields = (
        "title", "description", "category_id", "duration_minutes",
        "passing_percentage", "available_from", "available_until",
    )
    updates: dict = {}
    for field in allowed_fields:
        if field in data:
            updates[field] = data[field]

    # Handle status changes with validation
    if "status" in data:
        new_status = data["status"]
        if new_status not in ("draft", "published", "archived"):
            return error_response("Invalid status.", 400)
        if new_status == "published":
            qcount = db.questions.count_documents({"quiz_id": ObjectId(quiz_id)})
            if qcount == 0:
                return error_response(
                    "Cannot publish a quiz with no questions.", 400
                )
        updates["status"] = new_status

    if "category_id" in updates and updates["category_id"]:
        if not is_valid_object_id(updates["category_id"]):
            return error_response("Invalid category ID.", 400)
        updates["category_id"] = ObjectId(updates["category_id"])

    if not updates:
        return error_response("No valid fields to update.", 400)

    updates["updated_at"] = datetime.now(timezone.utc)
    db.quizzes.update_one({"_id": ObjectId(quiz_id)}, {"$set": updates})
    quiz = db.quizzes.find_one({"_id": ObjectId(quiz_id)})
    return success_response(serialize_doc(quiz), "Quiz updated.")


@teacher_bp.route("/quizzes/<quiz_id>", methods=["DELETE"])
@teacher_required
def delete_quiz(quiz_id: str):
    if not is_valid_object_id(quiz_id):
        return error_response("Invalid quiz ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    result = db.quizzes.delete_one(
        {"_id": ObjectId(quiz_id), "teacher_id": _teacher_id()}
    )
    if result.deleted_count == 0:
        return error_response("Quiz not found.", 404)

    # Cascade delete questions and attempts
    db.questions.delete_many({"quiz_id": ObjectId(quiz_id)})
    db.attempts.delete_many({"quiz_id": ObjectId(quiz_id)})

    return success_response(message="Quiz deleted.")


# ── Questions ─────────────────────────────────────────────────────────────────

def _validate_question(data: dict) -> tuple[dict | None, str]:
    """Validate and build a question document. Returns (doc, error_message)."""
    text = (data.get("question_text") or "").strip()
    options = data.get("options")
    correct = (data.get("correct_option") or "").strip().upper()
    marks = data.get("marks", 1)
    order = data.get("order", 0)

    if not text:
        return None, "Question text is required."
    if not isinstance(options, list) or len(options) != 4:
        return None, "Exactly four options are required."
    for i, opt in enumerate(options):
        if not (opt or "").strip():
            return None, f"Option {i + 1} cannot be empty."
    if correct not in ("A", "B", "C", "D"):
        return None, "correct_option must be A, B, C, or D."
    try:
        marks = int(marks)
        if marks < 1:
            raise ValueError
    except (ValueError, TypeError):
        return None, "Marks must be a positive integer."

    return {
        "question_text": text,
        "options": [o.strip() for o in options],
        "correct_option": correct,
        "marks": marks,
        "explanation": (data.get("explanation") or "").strip(),
        "order": int(order),
    }, ""


@teacher_bp.route("/quizzes/<quiz_id>/questions", methods=["POST"])
@teacher_required
def add_question(quiz_id: str):
    if not is_valid_object_id(quiz_id):
        return error_response("Invalid quiz ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    quiz = db.quizzes.find_one({"_id": ObjectId(quiz_id), "teacher_id": _teacher_id()})
    if not quiz:
        return error_response("Quiz not found.", 404)

    data = request.get_json(silent=True) or {}
    doc, err = _validate_question(data)
    if err:
        return error_response(err, 400)

    doc["quiz_id"] = ObjectId(quiz_id)
    doc["created_at"] = datetime.now(timezone.utc)

    result = db.questions.insert_one(doc)
    question = db.questions.find_one({"_id": result.inserted_id})

    # Recalculate total marks on quiz
    agg = list(db.questions.aggregate([
        {"$match": {"quiz_id": ObjectId(quiz_id)}},
        {"$group": {"_id": None, "total": {"$sum": "$marks"}}},
    ]))
    total_marks = agg[0]["total"] if agg else 0
    db.quizzes.update_one(
        {"_id": ObjectId(quiz_id)},
        {"$set": {"total_marks": total_marks, "updated_at": datetime.now(timezone.utc)}},
    )

    return success_response(serialize_doc(question), "Question added.", 201)


@teacher_bp.route("/questions/<question_id>", methods=["PATCH"])
@teacher_required
def update_question(question_id: str):
    if not is_valid_object_id(question_id):
        return error_response("Invalid question ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    question = db.questions.find_one({"_id": ObjectId(question_id)})
    if not question:
        return error_response("Question not found.", 404)

    # Verify the question belongs to this teacher's quiz
    quiz = db.quizzes.find_one(
        {"_id": question["quiz_id"], "teacher_id": _teacher_id()}
    )
    if not quiz:
        return error_response("Not authorized.", 403)

    data = request.get_json(silent=True) or {}
    doc, err = _validate_question({**serialize_doc(question), **data})
    if err:
        return error_response(err, 400)

    doc["updated_at"] = datetime.now(timezone.utc)
    db.questions.update_one({"_id": ObjectId(question_id)}, {"$set": doc})

    # Recalculate total marks
    quiz_id = str(question["quiz_id"])
    agg = list(db.questions.aggregate([
        {"$match": {"quiz_id": question["quiz_id"]}},
        {"$group": {"_id": None, "total": {"$sum": "$marks"}}},
    ]))
    total_marks = agg[0]["total"] if agg else 0
    db.quizzes.update_one(
        {"_id": question["quiz_id"]},
        {"$set": {"total_marks": total_marks, "updated_at": datetime.now(timezone.utc)}},
    )

    updated = db.questions.find_one({"_id": ObjectId(question_id)})
    return success_response(serialize_doc(updated), "Question updated.")


@teacher_bp.route("/questions/<question_id>", methods=["DELETE"])
@teacher_required
def delete_question(question_id: str):
    if not is_valid_object_id(question_id):
        return error_response("Invalid question ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    question = db.questions.find_one({"_id": ObjectId(question_id)})
    if not question:
        return error_response("Question not found.", 404)

    quiz = db.quizzes.find_one(
        {"_id": question["quiz_id"], "teacher_id": _teacher_id()}
    )
    if not quiz:
        return error_response("Not authorized.", 403)

    db.questions.delete_one({"_id": ObjectId(question_id)})

    # Recalculate total marks
    agg = list(db.questions.aggregate([
        {"$match": {"quiz_id": question["quiz_id"]}},
        {"$group": {"_id": None, "total": {"$sum": "$marks"}}},
    ]))
    total_marks = agg[0]["total"] if agg else 0
    db.quizzes.update_one(
        {"_id": question["quiz_id"]},
        {"$set": {"total_marks": total_marks, "updated_at": datetime.now(timezone.utc)}},
    )

    return success_response(message="Question deleted.")


# ── Student Attempts View ─────────────────────────────────────────────────────

@teacher_bp.route("/quizzes/<quiz_id>/attempts", methods=["GET"])
@teacher_required
def quiz_attempts(quiz_id: str):
    if not is_valid_object_id(quiz_id):
        return error_response("Invalid quiz ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    quiz = db.quizzes.find_one({"_id": ObjectId(quiz_id), "teacher_id": _teacher_id()})
    if not quiz:
        return error_response("Quiz not found.", 404)

    attempts = list(db.attempts.aggregate([
        {"$match": {"quiz_id": ObjectId(quiz_id), "status": "submitted"}},
        {"$lookup": {
            "from": "users",
            "localField": "student_id",
            "foreignField": "_id",
            "as": "student",
        }},
        {"$project": {
            "student_name": {"$arrayElemAt": ["$student.name", 0]},
            "student_email": {"$arrayElemAt": ["$student.email", 0]},
            "score": 1, "total_marks": 1, "percentage": 1,
            "status": 1, "submitted_at": 1, "duration_seconds": 1,
        }},
        {"$sort": {"submitted_at": -1}},
    ]))

    # Aggregate stats
    if attempts:
        scores = [a.get("percentage", 0) for a in attempts if a.get("percentage") is not None]
        avg = round(sum(scores) / len(scores), 2) if scores else 0
    else:
        avg = 0

    return success_response({
        "quiz": serialize_doc(quiz),
        "attempts": serialize_list(attempts),
        "total_attempts": len(attempts),
        "average_percentage": avg,
    })
