import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, getErrorMessage } from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import {
  UsersIcon, StudentIcon, TeacherIcon, QuizIcon, CheckCircleIcon,
  ClipboardIcon, UsersIcon as UsersIcon2, CategoryIcon, ChartIcon,
} from '../../components/Icons';
import { formatDateTime, pct } from '../../utils';
import styles from './Admin.module.css';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.dashboard()
      .then((r) => setData(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error)   return <Alert type="error" message={error} />;

  return (
    <div className="page-enter">
      <h1 className={styles.pageTitle}>Admin Dashboard</h1>

      <div className={styles.statsGrid}>
        <StatCard label="Total Users"    value={data.total_users}       icon={<UsersIcon size={22} />} />
        <StatCard label="Students"       value={data.total_students}    icon={<StudentIcon size={22} />} color="success" />
        <StatCard label="Teachers"       value={data.total_teachers}    icon={<TeacherIcon size={22} />} color="warning" />
        <StatCard label="Total Quizzes"  value={data.total_quizzes}     icon={<QuizIcon size={22} />} color="primary" />
        <StatCard label="Published"      value={data.published_quizzes} icon={<CheckCircleIcon size={22} />} color="success" />
        <StatCard label="Total Attempts" value={data.total_attempts}    icon={<ClipboardIcon size={22} />} />
      </div>

      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2>Recent Attempts</h2>
          <Link to="/admin/quizzes" className={styles.viewAll}>View all quizzes →</Link>
        </div>
        {data.recent_attempts.length === 0 ? (
          <p className={styles.empty}>No attempts yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Student</th><th>Quiz</th><th>Score</th><th>Date</th></tr>
              </thead>
              <tbody>
                {data.recent_attempts.map((a) => (
                  <tr key={a._id}>
                    <td>{a.student_name || '—'}</td>
                    <td>{a.quiz_title || '—'}</td>
                    <td>{a.score != null ? `${a.score}/${a.total_marks} (${pct(a.percentage)})` : '—'}</td>
                    <td>{formatDateTime(a.started_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.quickLinks}>
        <Link to="/admin/users"      className={styles.quickCard}>
          <UsersIcon size={28} color="var(--color-primary)" /><span>Manage Users</span>
        </Link>
        <Link to="/admin/quizzes"    className={styles.quickCard}>
          <QuizIcon size={28} color="var(--color-primary)" /><span>Manage Quizzes</span>
        </Link>
        <Link to="/admin/categories" className={styles.quickCard}>
          <CategoryIcon size={28} color="var(--color-primary)" /><span>Categories</span>
        </Link>
        <Link to="/admin/statistics" className={styles.quickCard}>
          <ChartIcon size={28} color="var(--color-primary)" /><span>Statistics</span>
        </Link>
      </div>
    </div>
  );
}
