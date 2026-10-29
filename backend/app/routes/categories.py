"""
Category management routes (public read, admin write).
"""
from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, request

from app.utils.db import get_db
from app.utils.helpers import (
    error_response,
    success_response,
    serialize_doc,
    serialize_list,
    is_valid_object_id,
)
from app.middleware.auth_middleware import admin_required, login_required

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("", methods=["GET"])
def list_categories():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)
    cats = list(db.categories.find({}).sort("name", 1))
    return success_response(serialize_list(cats))


@categories_bp.route("", methods=["POST"])
@admin_required
def create_category():
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()

    if not name:
        return error_response("Category name is required.", 400)

    if db.categories.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}}):
        return error_response("A category with this name already exists.", 409)

    result = db.categories.insert_one(
        {"name": name, "description": description, "created_at": datetime.now(timezone.utc)}
    )
    cat = db.categories.find_one({"_id": result.inserted_id})
    return success_response(serialize_doc(cat), "Category created.", 201)


@categories_bp.route("/<category_id>", methods=["PATCH"])
@admin_required
def update_category(category_id: str):
    if not is_valid_object_id(category_id):
        return error_response("Invalid category ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    data = request.get_json(silent=True) or {}
    updates = {}
    if "name" in data:
        updates["name"] = (data["name"] or "").strip()
    if "description" in data:
        updates["description"] = (data["description"] or "").strip()

    if not updates:
        return error_response("No fields to update.", 400)

    db.categories.update_one({"_id": ObjectId(category_id)}, {"$set": updates})
    cat = db.categories.find_one({"_id": ObjectId(category_id)})
    if not cat:
        return error_response("Category not found.", 404)
    return success_response(serialize_doc(cat), "Category updated.")


@categories_bp.route("/<category_id>", methods=["DELETE"])
@admin_required
def delete_category(category_id: str):
    if not is_valid_object_id(category_id):
        return error_response("Invalid category ID.", 400)
    db = get_db()
    if db is None:
        return error_response("Database unavailable.", 503)

    result = db.categories.delete_one({"_id": ObjectId(category_id)})
    if result.deleted_count == 0:
        return error_response("Category not found.", 404)
    return success_response(message="Category deleted.")
