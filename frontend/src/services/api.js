/**
 * MindSprint API Service
 * Centralised Axios instance and endpoint helpers.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,          // send session cookies
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      // Session expired – redirect to login (handled by AuthContext)
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// ── Helper to extract error message ──────────────────────────────────────────
export function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    'An unexpected error occurred.'
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
  logout:   ()     => api.post('/api/auth/logout'),
  me:       ()     => api.get('/api/auth/me'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard:   ()                => api.get('/api/admin/dashboard'),
  statistics:  ()                => api.get('/api/admin/statistics'),
  getUsers:    (params)          => api.get('/api/admin/users', { params }),
  updateUser:  (id, data)        => api.patch(`/api/admin/users/${id}`, data),
  deleteUser:  (id)              => api.delete(`/api/admin/users/${id}`),
  getQuizzes:  (params)          => api.get('/api/admin/quizzes', { params }),
  updateQuiz:  (id, data)        => api.patch(`/api/admin/quizzes/${id}`, data),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesAPI = {
  list:   ()             => api.get('/api/categories'),
  create: (data)         => api.post('/api/categories', data),
  update: (id, data)     => api.patch(`/api/categories/${id}`, data),
  delete: (id)           => api.delete(`/api/categories/${id}`),
};

// ── Teacher ───────────────────────────────────────────────────────────────────
export const teacherAPI = {
  dashboard:       ()                => api.get('/api/teacher/dashboard'),
  getQuizzes:      ()                => api.get('/api/teacher/quizzes'),
  createQuiz:      (data)            => api.post('/api/teacher/quizzes', data),
  getQuiz:         (id)              => api.get(`/api/teacher/quizzes/${id}`),
  updateQuiz:      (id, data)        => api.patch(`/api/teacher/quizzes/${id}`, data),
  deleteQuiz:      (id)              => api.delete(`/api/teacher/quizzes/${id}`),
  addQuestion:     (quizId, data)    => api.post(`/api/teacher/quizzes/${quizId}/questions`, data),
  updateQuestion:  (qid, data)       => api.patch(`/api/teacher/questions/${qid}`, data),
  deleteQuestion:  (qid)             => api.delete(`/api/teacher/questions/${qid}`),
  getAttempts:     (quizId)          => api.get(`/api/teacher/quizzes/${quizId}/attempts`),
};

// ── Student ───────────────────────────────────────────────────────────────────
export const studentAPI = {
  dashboard:     ()                     => api.get('/api/student/dashboard'),
  getQuizzes:    (params)               => api.get('/api/student/quizzes', { params }),
  getQuizInfo:   (id)                   => api.get(`/api/student/quizzes/${id}`),
  startAttempt:  (quizId)               => api.post(`/api/student/quizzes/${quizId}/attempts`),
  submitAttempt: (attemptId, answers)   => api.post(`/api/student/attempts/${attemptId}/submit`, { answers }),
  getAttempts:   ()                     => api.get('/api/student/attempts'),
  getAttempt:    (id)                   => api.get(`/api/student/attempts/${id}`),
  leaderboard:   (params)               => api.get('/api/student/leaderboard', { params }),
  getProfile:    ()                     => api.get('/api/student/profile'),
  updateProfile: (data)                 => api.patch('/api/student/profile', data),
};

export default api;
