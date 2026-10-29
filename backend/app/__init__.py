"""
MindSprint Flask Application Factory
"""
from flask import Flask
from flask_cors import CORS

from config import Config
from app.utils.db import init_db


def create_app(config_class: type = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ── CORS ─────────────────────────────────────────────────
    CORS(
        app,
        origins=[app.config["FRONTEND_URL"]],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    )

    # ── Database ─────────────────────────────────────────────
    init_db(app)

    # ── Register Blueprints ──────────────────────────────────
    from app.routes.auth import auth_bp
    from app.routes.admin import admin_bp
    from app.routes.teacher import teacher_bp
    from app.routes.student import student_bp
    from app.routes.categories import categories_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(teacher_bp, url_prefix="/api/teacher")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(categories_bp, url_prefix="/api/categories")

    # ── Health check ─────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return {"status": "ok", "app": "MindSprint"}

    return app
