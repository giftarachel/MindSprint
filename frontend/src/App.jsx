import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageQuizzes from './pages/admin/ManageQuizzes';
import ManageCategories from './pages/admin/ManageCategories';
import AdminStatistics from './pages/admin/AdminStatistics';

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateEditQuiz from './pages/teacher/CreateEditQuiz';
import ManageQuizzesTeacher from './pages/teacher/ManageQuizzes';
import PreviewQuiz from './pages/teacher/PreviewQuiz';
import ViewAttempts from './pages/teacher/ViewAttempts';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import AvailableQuizzes from './pages/student/AvailableQuizzes';
import QuizInstructions from './pages/student/QuizInstructions';
import QuizAttempt from './pages/student/QuizAttempt';
import QuizResult from './pages/student/QuizResult';
import QuizHistory from './pages/student/QuizHistory';
import Leaderboard from './pages/student/Leaderboard';
import StudentProfile from './pages/student/StudentProfile';

/** Redirect to the user's role dashboard if already authenticated */
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes (shared layout) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute role="admin"><DashboardLayout /></ProtectedRoute>}>
          <Route path="/admin"             element={<AdminDashboard />} />
          <Route path="/admin/users"       element={<ManageUsers />} />
          <Route path="/admin/quizzes"     element={<ManageQuizzes />} />
          <Route path="/admin/categories"  element={<ManageCategories />} />
          <Route path="/admin/statistics"  element={<AdminStatistics />} />
        </Route>

        {/* Teacher routes */}
        <Route element={<ProtectedRoute role="teacher"><DashboardLayout /></ProtectedRoute>}>
          <Route path="/teacher"                       element={<TeacherDashboard />} />
          <Route path="/teacher/create"                element={<CreateEditQuiz />} />
          <Route path="/teacher/quizzes"               element={<ManageQuizzesTeacher />} />
          <Route path="/teacher/quizzes/:quizId"       element={<CreateEditQuiz />} />
          <Route path="/teacher/preview/:quizId"       element={<PreviewQuiz />} />
          <Route path="/teacher/quizzes/:quizId/attempts" element={<ViewAttempts />} />
        </Route>

        {/* Student routes */}
        <Route element={<ProtectedRoute role="student"><DashboardLayout /></ProtectedRoute>}>
          <Route path="/student"                              element={<StudentDashboard />} />
          <Route path="/student/quizzes"                      element={<AvailableQuizzes />} />
          <Route path="/student/quizzes/:quizId"               element={<QuizInstructions />} />
          <Route path="/student/quiz/:quizId/attempt/:attemptId" element={<QuizAttempt />} />
          <Route path="/student/quiz/:quizId/result/:attemptId"  element={<QuizResult />} />
          <Route path="/student/history"                      element={<QuizHistory />} />
          <Route path="/student/leaderboard"                  element={<Leaderboard />} />
          <Route path="/student/profile"                      element={<StudentProfile />} />
        </Route>

        {/* Utility routes */}
        <Route path="/dashboard" element={<RoleRedirect />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
