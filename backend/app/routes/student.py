"""
Student routes: dashboard, quiz browsing, quiz attempt, results, leaderboard, profile.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta

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
from app.middleware.auth_middleware import student_required, login_required

student_bp = Blueprint("student", __name__)


def _student_id() -> ObjectId:
    return ObjectId(session["user_id"])


def _utc(dt: datetime) -> datetime:
    """
    Ensure a datetime is timezone-aware (UTC).
    MongoDB Atlas can return naive datetimes; this normalises them so
    arithmetic with datetime.now(timezone.utc) works correctly.
    """
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


# ── Dashboard ─────────────────────────────────────────────────────────────────

@student_bp.route("/dashboard", methods=["GET"])
@student_required
def dashboard():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    sid = _student_id()
    attempts = list(db.attempts.find({"student_id": sid}))
    submitted = [a for a in attempts if a.get("status") == "submitted"]

    avg_score = 0
    if submitted:
        pcts = [a.get("percentage", 0) for a in submitted if a.get("percentage") is not None]
        avg_score = round(sum(pcts) / len(pcts), 2) if pcts else 0

    # Recent 5 submitted attempts with quiz info
    recent = list(db.attempts.aggregate([
        {"$match": {"student_id": sid, "status": "submitted"}},
        {"$sort": {"submitted_at": -1}},
        {"$limit": 5},
        {"$lookup": {
            "from": "quizzes",
            "localField": "quiz_id",
            "foreignField": "_id",
            "as": "quiz",
        }},
        {"$project": {
            "quiz_title": {"$arrayElemAt": ["$quiz.title", 0]},
            "score": 1, "total_marks": 1, "percentage": 1,
            "submitted_at": 1,
        }},
    ]))

    # Available quizzes count
    available = db.quizzes.count_documents({"status": "published"})

    return success_response({
        "total_attempts": len(attempts),
        "completed_attempts": len(submitted),
        "average_score": avg_score,
        "recent_results": serialize_list(recent),
        "available_quizzes_count": available,
    })


# ── Available Quizzes ─────────────────────────────────────────────────────────

@student_bp.route("/quizzes", methods=["GET"])
@student_required
def list_quizzes():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    category_id = request.args.get("category_id")
    search = (request.args.get("search") or "").strip()

    query: dict = {"status": "published"}
    if category_id and is_valid_object_id(category_id):
        query["category_id"] = ObjectId(category_id)
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    quizzes = list(db.quizzes.find(query).sort("created_at", -1))
    sid = _student_id()

    result = []
    for q in quizzes:
        doc = serialize_doc(q)
        doc["question_count"] = db.questions.count_documents({"quiz_id": q["_id"]})
        existing = db.attempts.find_one(
            {"quiz_id": q["_id"], "student_id": sid, "status": "submitted"}
        )
        doc["already_attempted"] = existing is not None
        in_progress = db.attempts.find_one(
            {"quiz_id": q["_id"], "student_id": sid, "status": "in_progress"}
        )
        doc["attempt_in_progress"] = in_progress is not None
        result.append(doc)

    return success_response(result)


@student_bp.route("/quizzes/<quiz_id>", methods=["GET"])
@student_required
def get_quiz_info(quiz_id: str):
    """Returns quiz metadata + instructions. Does NOT include correct answers."""
    if not is_valid_object_id(quiz_id):
        return error_response("Invalid quiz ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    quiz = db.quizzes.find_one({"_id": ObjectId(quiz_id), "status": "published"})
    if not quiz:
        return error_response("Quiz not found or not available.", 404)

    doc = serialize_doc(quiz)
    doc["question_count"] = db.questions.count_documents({"quiz_id": ObjectId(quiz_id)})
    return success_response(doc)


# ── Attempt Management ────────────────────────────────────────────────────────

@student_bp.route("/quizzes/<quiz_id>/attempts", methods=["POST"])
@student_required
def start_attempt(quiz_id: str):
    """Start a new quiz attempt or resume an existing one."""
    if not is_valid_object_id(quiz_id):
        return error_response("Invalid quiz ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    quiz = db.quizzes.find_one({"_id": ObjectId(quiz_id), "status": "published"})
    if not quiz:
        return error_response("Quiz is not available.", 404)

    sid = _student_id()

    # Prevent re-attempting an already submitted quiz
    submitted = db.attempts.find_one(
        {"quiz_id": ObjectId(quiz_id), "student_id": sid, "status": "submitted"}
    )
    if submitted:
        return error_response("You have already completed this quiz.", 409)

    # Resume an in-progress attempt if one exists
    in_progress = db.attempts.find_one(
        {"quiz_id": ObjectId(quiz_id), "student_id": sid, "status": "in_progress"}
    )

    now = datetime.now(timezone.utc)
    if in_progress:
        duration_secs = quiz.get("duration_minutes", 30) * 60
        # Use _utc() to normalise the stored datetime before subtracting
        elapsed = (now - _utc(in_progress["started_at"])).total_seconds()
        if elapsed > duration_secs + 30:   # 30 sec grace period
            db.attempts.update_one(
                {"_id": in_progress["_id"]},
                {"$set": {"status": "expired", "submitted_at": now}},
            )
            return error_response("Your previous attempt has expired.", 410)

        # Return existing attempt so the student can resume
        questions = list(
            db.questions.find(
                {"quiz_id": ObjectId(quiz_id)},
                {"correct_option": 0, "explanation": 0},
            ).sort("order", 1)
        )
        return success_response(
            {
                "attempt": serialize_doc(in_progress),
                "questions": serialize_list(questions),
                "duration_minutes": quiz.get("duration_minutes", 30),
            },
            "Resuming existing attempt.",
        )

    # Create a brand new attempt
    result = db.attempts.insert_one({
        "quiz_id": ObjectId(quiz_id),
        "student_id": sid,
        "started_at": now,
        "submitted_at": None,
        "answers": {},
        "score": None,
        "total_marks": None,
        "percentage": None,
        "status": "in_progress",
        "duration_seconds": None,
    })
    attempt = db.attempts.find_one({"_id": result.inserted_id})

    # Questions sent WITHOUT correct_option or explanation
    questions = list(
        db.questions.find(
            {"quiz_id": ObjectId(quiz_id)},
            {"correct_option": 0, "explanation": 0},
        ).sort("order", 1)
    )

    return success_response(
        {
            "attempt": serialize_doc(attempt),
            "questions": serialize_list(questions),
            "duration_minutes": quiz.get("duration_minutes", 30),
        },
        "Attempt started.",
        201,
    )


@student_bp.route("/attempts/<attempt_id>/submit", methods=["POST"])
@student_required
def submit_attempt(attempt_id: str):
    """
    Receive student answers and calculate the score SERVER-SIDE.
    Payload: { "answers": { "<question_id>": "A"|"B"|"C"|"D" } }
    """
    if not is_valid_object_id(attempt_id):
        return error_response("Invalid attempt ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    sid = _student_id()
    attempt = db.attempts.find_one({"_id": ObjectId(attempt_id), "student_id": sid})
    if not attempt:
        return error_response("Attempt not found.", 404)

    if attempt["status"] != "in_progress":
        return error_response("This attempt has already been submitted.", 409)

    quiz = db.quizzes.find_one({"_id": attempt["quiz_id"]})
    if not quiz:
        return error_response("Quiz not found.", 404)

    now = datetime.now(timezone.utc)
    # Use _utc() to normalise the stored datetime before subtracting
    elapsed = (now - _utc(attempt["started_at"])).total_seconds()
    duration_secs = quiz.get("duration_minutes", 30) * 60
    if elapsed > duration_secs + 60:   # 60 sec network grace
        db.attempts.update_one(
            {"_id": ObjectId(attempt_id)},
            {"$set": {"status": "expired", "submitted_at": now}},
        )
        return error_response("Time has expired for this attempt.", 410)

    data = request.get_json(silent=True) or {}
    submitted_answers: dict = data.get("answers", {})

    # Fetch ALL questions with correct answers (server-side only, never sent to client earlier)
    questions = list(db.questions.find({"quiz_id": attempt["quiz_id"]}))

    score = 0
    total_marks = 0
    graded_answers = {}

    for q in questions:
        qid = str(q["_id"])
        total_marks += q.get("marks", 1)
        selected = submitted_answers.get(qid)

        if selected and selected.upper() in ("A", "B", "C", "D"):
            selected = selected.upper()
        else:
            selected = None   # unanswered counts as wrong

        is_correct = selected == q.get("correct_option")
        marks_awarded = q.get("marks", 1) if is_correct else 0
        score += marks_awarded

        graded_answers[qid] = {
            "selected_option": selected,
            "correct_option": q["correct_option"],
            "is_correct": is_correct,
            "marks_awarded": marks_awarded,
            "explanation": q.get("explanation", ""),
        }

    percentage = round((score / total_marks) * 100, 2) if total_marks > 0 else 0
    passing = quiz.get("passing_percentage", 0)
    passed = percentage >= passing if passing and passing > 0 else None

    db.attempts.update_one(
        {"_id": ObjectId(attempt_id)},
        {
            "$set": {
                "answers": graded_answers,
                "score": score,
                "total_marks": total_marks,
                "percentage": percentage,
                "passed": passed,
                "status": "submitted",
                "submitted_at": now,
                "duration_seconds": int(elapsed),
            }
        },
    )

    updated = db.attempts.find_one({"_id": ObjectId(attempt_id)})
    return success_response(
        {
            "attempt": serialize_doc(updated),
            "quiz_title": quiz["title"],
            "passing_percentage": passing,
        },
        "Quiz submitted successfully.",
    )


# ── Attempt History ───────────────────────────────────────────────────────────

@student_bp.route("/attempts", methods=["GET"])
@student_required
def list_attempts():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    sid = _student_id()
    attempts = list(db.attempts.aggregate([
        {"$match": {"student_id": sid}},
        {"$sort": {"started_at": -1}},
        {"$lookup": {
            "from": "quizzes",
            "localField": "quiz_id",
            "foreignField": "_id",
            "as": "quiz",
        }},
        {"$project": {
            "quiz_title": {"$arrayElemAt": ["$quiz.title", 0]},
            "quiz_id": 1,
            "score": 1,
            "total_marks": 1,
            "percentage": 1,
            "passed": 1,
            "status": 1,
            "started_at": 1,
            "submitted_at": 1,
            "duration_seconds": 1,
        }},
    ]))
    return success_response(serialize_list(attempts))


@student_bp.route("/attempts/<attempt_id>", methods=["GET"])
@student_required
def get_attempt(attempt_id: str):
    """Returns full attempt result with graded answers (only after submission)."""
    if not is_valid_object_id(attempt_id):
        return error_response("Invalid attempt ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    sid = _student_id()
    attempt = db.attempts.find_one(
        {"_id": ObjectId(attempt_id), "student_id": sid}
    )
    if not attempt:
        return error_response("Attempt not found.", 404)

    if attempt["status"] != "submitted":
        return error_response("This attempt has not been submitted yet.", 400)

    quiz = db.quizzes.find_one({"_id": attempt["quiz_id"]})
    questions = list(
        db.questions.find({"quiz_id": attempt["quiz_id"]}).sort("order", 1)
    )

    answers = attempt.get("answers", {})
    enriched_questions = []
    for q in questions:
        qid = str(q["_id"])
        answer_data = answers.get(qid, {})
        enriched_questions.append({
            **serialize_doc(q),
            "selected_option": answer_data.get("selected_option"),
            "is_correct": answer_data.get("is_correct"),
            "marks_awarded": answer_data.get("marks_awarded", 0),
        })

    return success_response({
        "attempt": serialize_doc(attempt),
        "quiz": serialize_doc(quiz),
        "questions": enriched_questions,
    })


# ── Leaderboard ───────────────────────────────────────────────────────────────

@student_bp.route("/leaderboard", methods=["GET"])
@student_required
def leaderboard():
    """Ranked by average percentage (desc), then total completed (desc). Top 50."""
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    quiz_id = request.args.get("quiz_id")
    match_stage: dict = {"status": "submitted"}
    if quiz_id and is_valid_object_id(quiz_id):
        match_stage["quiz_id"] = ObjectId(quiz_id)

    board = list(db.attempts.aggregate([
        {"$match": match_stage},
        {"$group": {
            "_id": "$student_id",
            "avg_percentage": {"$avg": "$percentage"},
            "total_completed": {"$sum": 1},
            "best_score": {"$max": "$percentage"},
        }},
        {"$sort": {"avg_percentage": -1, "total_completed": -1}},
        {"$limit": 50},
        {"$lookup": {
            "from": "users",
            "localField": "_id",
            "foreignField": "_id",
            "as": "student",
        }},
        {"$project": {
            "student_name": {"$arrayElemAt": ["$student.name", 0]},
            "avg_percentage": {"$round": ["$avg_percentage", 2]},
            "total_completed": 1,
            "best_score": {"$round": ["$best_score", 2]},
        }},
    ]))

    for i, entry in enumerate(board):
        entry["rank"] = i + 1

    return success_response(serialize_list(board))


# ── Profile ───────────────────────────────────────────────────────────────────

@student_bp.route("/profile", methods=["GET"])
@login_required
def get_profile():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    user = db.users.find_one({"_id": _student_id()}, {"password_hash": 0})
    if not user:
        return error_response("User not found.", 404)
    return success_response(serialize_doc(user))


@student_bp.route("/profile", methods=["PATCH"])
@login_required
def update_profile():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    data = request.get_json(silent=True) or {}

    if "role" in data or "is_active" in data:
        return error_response("You cannot change role or active status.", 403)

    updates = {}
    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            return error_response("Name cannot be empty.", 400)
        updates["name"] = name

    if not updates:
        return error_response("No valid fields to update.", 400)

    updates["updated_at"] = datetime.now(timezone.utc)
    db.users.update_one({"_id": _student_id()}, {"$set": updates})
    user = db.users.find_one({"_id": _student_id()}, {"password_hash": 0})
    return success_response(serialize_doc(user), "Profile updated.")
