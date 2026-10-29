# MindSprint — Online Quiz Platform

> Think Fast. Learn More. Sprint Ahead.

MindSprint is a full-stack web application where administrators manage the platform, teachers create and manage quizzes, and students take quizzes and track their performance.

---

## Table of Contents

1. [Features by Role](#features-by-role)
2. [Technologies Used](#technologies-used)
3. [Architecture Overview](#architecture-overview)
4. [Final Directory Structure](#final-directory-structure)
5. [Prerequisites](#prerequisites)
6. [MongoDB Atlas Setup](#mongodb-atlas-setup)
7. [Configuration (.env)](#configuration-env)
8. [Install Dependencies](#install-dependencies)
9. [Start the Backend](#start-the-backend)
10. [Start the Frontend](#start-the-frontend)
11. [Create the First Administrator](#create-the-first-administrator)
12. [Run Tests](#run-tests)
13. [Local URLs](#local-urls)
14. [Common Errors & Troubleshooting](#common-errors--troubleshooting)
15. [Security Limitations](#security-limitations--production-considerations)

---

## Features by Role

### Admin
- Dashboard with platform-wide statistics (users, teachers, students, quizzes, attempts)
- Manage all users (view, search, filter, activate/deactivate, change role, delete)
- Manage all quizzes (view, publish, unpublish, archive)
- Manage categories (create, edit, delete)
- Platform statistics with daily attempt trends and top quizzes

### Teacher
- Dashboard with quiz count, published/draft breakdown, total attempts
- Create and edit quizzes (title, description, category, duration, passing %)
- Add, view, and delete multiple-choice questions (4 options, 1 correct, marks, explanation)
- Auto-calculated total marks from question marks
- Preview quiz before publishing
- Publish and unpublish quizzes
- Delete quizzes with confirmation
- View student attempts and results for own quizzes with aggregate stats

### Student
- Dashboard with available quizzes, attempts taken, average score, recent results
- Browse published quizzes with search and category filter
- View quiz instructions before starting
- Take timed quizzes with countdown timer
- Navigate between questions, change answers before submitting
- Confirmation dialog before final submission
- Auto-submit when timer expires
- Automatic server-side scoring
- View detailed results with correct answers and explanations
- Quiz history with all past attempts
- Global leaderboard ranked by average percentage
- View and update profile

---

## Technologies Used

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 19, Vite, React Router, Axios |
| Styling     | CSS3 with CSS Variables (design system) |
| Backend     | Python 3, Flask, Flask-CORS          |
| Database    | MongoDB (Atlas or local)            |
| Auth        | Server-side sessions with bcrypt password hashing |
| Testing     | pytest, pytest-flask                |

---

## Architecture Overview

```
User (Browser)
    │
    ▼
React Frontend (Vite dev server, port 5173)
    │  REST API calls (JSON, with credentials)
    ▼
Flask Backend (port 5000)
    │  PyMongo driver
    ▼
MongoDB Atlas (or local MongoDB)
```

- The frontend communicates with the backend via REST API using JSON.
- Authentication uses secure HTTP-only cookies (Flask sessions).
- Passwords are hashed with bcrypt — never stored in plaintext.
- Role-based access control is enforced on every backend endpoint via decorators.
- Correct answers are never sent to the student before quiz submission.

---

## Final Directory Structure

```
MindSprint/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   └── auth_middleware.py  # @login_required, @role_required
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # register, login, logout, /me
│   │   │   ├── admin.py         # dashboard, users, quizzes, statistics
│   │   │   ├── teacher.py       # quiz CRUD, questions, attempts
│   │   │   ├── student.py       # quizzes, attempts, results, leaderboard
│   │   │   └── categories.py    # category CRUD
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── db.py            # MongoDB connection + indexes
│   │       └── helpers.py       # ObjectId serialization, validation
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py          # pytest fixtures
│   │   └── test_auth.py         # 19 backend tests
│   ├── config.py               # Environment configuration
│   ├── run.py                   # Entry point: python run.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                     # Your actual config (not in git)
├── frontend/
│   ├── src/
│   │   ├── components/          # Button, Input, Alert, Modal, etc.
│   │   ├── pages/
│   │   │   ├── auth/            # Login, Register
│   │   │   ├── admin/           # Dashboard, Users, Quizzes, Categories, Stats
│   │   │   ├── teacher/         # Dashboard, CreateEditQuiz, Manage, Preview, Attempts
│   │   │   └── student/         # Dashboard, Quizzes, Attempt, Result, History, Leaderboard, Profile
│   │   ├── layouts/             # DashboardLayout, AuthLayout
│   │   ├── context/            # AuthContext
│   │   ├── services/           # api.js (Axios instance + endpoints)
│   │   ├── styles/             # variables.css, global.css
│   │   ├── utils/              # Shared helpers
│   │   ├── App.jsx             # Router
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   ├── package.json
│   ├── .env.example
│   └── vite.config.js
├── .gitignore
├── .env.example
└── README.md
```

---

## Prerequisites

### macOS

1. **Python 3.10+** — check: `python3 --version`
   ```bash
   # If not installed, use Homebrew:
   brew install python@3.12
   ```

2. **Node.js 18+** — check: `node --version`
   ```bash
   brew install node
   ```

3. **pip** — comes with Python. Verify: `pip3 --version`

### Windows

1. **Python 3.10+** — download from [python.org](https://www.python.org/downloads/). Check "Add to PATH" during install.
2. **Node.js 18+** — download from [nodejs.org](https://nodejs.org/). The installer includes npm.
3. Use `python` instead of `python3` and `pip` instead of `pip3` on Windows.

---

## MongoDB Atlas Setup

### Step 1: Create a Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and sign up (free tier available).
2. Create a new project, then build a free M0 cluster.
3. Choose a cloud provider and region close to you.

### Step 2: Create a Database User

1. In the Atlas sidebar, go to **Security → Database Access**.
2. Click **Add New Database User**.
3. Choose a username and password (save these — you need them for the connection string).
4. Give the user "Read and write to any database" permission.

### Step 3: Configure Network Access

1. Go to **Security → Network Access**.
2. Click **Add IP Address**.
3. For development, click **Allow Access from Anywhere** (`0.0.0.0/0`).
   - For production, add only your server's IP.

### Step 4: Get Your Connection String

1. Go to **Databases → Connect → Drivers**.
2. Copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
3. Replace `<username>` and `<password>` with your database user credentials.

---

## Configuration (.env)

### Backend

Copy the example file and fill in your values:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/
MONGO_DB_NAME=mindsprint
SECRET_KEY=a-long-random-string-min-32-characters
FLASK_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
```

---

## Install Dependencies

### Backend

```bash
cd MindSprint/backend
pip3 install -r requirements.txt
```

Windows:
```cmd
cd MindSprint\backend
pip install -r requirements.txt
```

### Frontend

```bash
cd MindSprint/frontend
npm install
```

---

## Start the Backend

```bash
cd MindSprint/backend
python3 run.py
```

Windows:
```cmd
cd MindSprint\backend
python run.py
```

The backend runs on **http://localhost:5000**. You should see:
```
MongoDB connected: database=mindsprint
* Running on http://127.0.0.1:5000
```

---

## Start the Frontend

Open a **new terminal**:

```bash
cd MindSprint/frontend
npm run dev
```

The frontend runs on **http://localhost:5173**.

---

## Create the First Administrator

Public registration only allows `student` and `teacher` roles. To create an admin account, use the MongoDB shell or Atlas Data Explorer:

### Option A: MongoDB Atlas Data Explorer

1. Go to your Atlas cluster → **Browse Collections**.
2. Select the `mindsprint` database.
3. Open the `users` collection.
4. Click **Insert Document** and paste:

```json
{
  "name": "Platform Admin",
  "email": "admin@mindsprint.com",
  "password_hash": "<bcrypt hash>",
  "role": "admin",
  "is_active": true,
  "created_at": { "$date": "2024-01-01T00:00:00Z" },
  "updated_at": { "$date": "2024-01-01T00:00:00Z" }
}
```

To generate the bcrypt hash, run this Python one-liner:

```bash
python3 -c "import bcrypt; print(bcrypt.hashpw(b'YourPassword123', bcrypt.gensalt()).decode())"
```

Paste the output as the `password_hash` value.

### Option B: Python Script

```bash
cd MindSprint/backend
python3 -c "
from app import create_app
from app.utils.db import get_db
from datetime import datetime, timezone
import bcrypt

app = create_app()
with app.app_context():
    db = get_db()
    if not db.users.find_one({'email': 'admin@mindsprint.com'}):
        db.users.insert_one({
            'name': 'Platform Admin',
            'email': 'admin@mindsprint.com',
            'password_hash': bcrypt.hashpw(b'Admin@123', bcrypt.gensalt()).decode(),
            'role': 'admin',
            'is_active': True,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
        })
        print('Admin created: admin@mindsprint.com / Admin@123')
    else:
        print('Admin already exists')
"
```

**Change the password immediately after first login.**

---

## Run Tests

### Backend Tests

```bash
cd MindSprint/backend
python3 -m pytest tests/ -v
```

Windows:
```cmd
cd MindSprint\backend
python -m pytest tests/ -v
```

The test suite includes 19 tests covering:
- Password hashing and verification
- Registration validation (missing fields, invalid email, weak password, duplicate email)
- Admin role rejection in public registration
- Login success, wrong password, inactive account
- Role-based access control (unauthenticated, wrong role, correct role)
- Score calculation logic

Tests use mocked database operations and do not require a real MongoDB connection.

---

## Local URLs

| Service   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:5173      |
| Backend   | http://localhost:5000      |
| Health    | http://localhost:5000/api/health |

---

## Common Errors & Troubleshooting

### "MongoDB connection failed"
- Check your `.env` file has the correct `MONGO_URI`.
- Verify the password in the URI is URL-encoded if it contains special characters.
- Ensure your IP is whitelisted in Atlas Network Access.
- The backend still starts without MongoDB but returns 503 for database operations.

### "CORS error" in the browser
- Ensure `FRONTEND_URL` in `backend/.env` matches your frontend URL (default: `http://localhost:5173`).
- Restart the backend after changing `.env`.

### "Module not found" (Python)
- Run `pip3 install -r requirements.txt` from the `backend/` directory.
- Make sure you're using Python 3.10+.

### "Cannot find module" (Node)
- Run `npm install` from the `frontend/` directory.

### Login fails with "Invalid email or password"
- Check the user exists in MongoDB.
- Verify the password is correct.
- Check the account is active (`is_active: true`).

### Frontend shows blank page
- Open browser console for errors.
- Verify `VITE_API_URL` in `frontend/.env` points to the backend.
- Check the backend is running.

### Build fails
- Run `npm run build` in the frontend directory to check for compile errors.
- Ensure all imports resolve correctly.

---

## Security Limitations & Production Considerations

### What's Implemented
- Bcrypt password hashing (no plaintext storage)
- Server-side session authentication with HttpOnly cookies
- Role-based access control on every backend endpoint
- Protection against IDOR (users can only access their own data)
- Server-side quiz scoring (client scores are never trusted)
- Correct answers never exposed before submission
- Brute-force login rate limiting (in-memory, 10 attempts per IP)
- CORS restricted to the configured frontend origin
- Input validation and sanitization
- Admin accounts cannot be created via public registration

### Production Hardening Needed Before Deployment
- Replace in-memory rate limiting with Redis-based rate limiting
- Enable `SESSION_COOKIE_SECURE=True` (requires HTTPS)
- Add CSRF protection for state-changing requests
- Use a production WSGI server (gunicorn) instead of Flask dev server
- Add request logging and audit trails
- Implement password reset flow via email
- Add CAPTCHA for registration to prevent bot signups
- Set up database backups and monitoring
- Review MongoDB connection pooling and index strategy under load
- Enable MongoDB authentication and use least-privilege database users

### Known Limitations
- Rate limiting is in-memory (resets on server restart)
- No password reset / forgot password flow
- No email verification for new accounts
- No WebSocket for real-time features
- Quiz timer is client-side with server-side grace period validation
- Leaderboard is global; per-quiz filtering is available via API
