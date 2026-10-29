import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherAPI, getErrorMessage } from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { QuizIcon, CheckCircleIcon, EditIcon, ClipboardIcon, PlusIcon } from '../../components/Icons';
import { formatDate, statusBadgeClass } from '../../utils';
import styles from './Teacher.module.css';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    teacherAPI.dashboard()
      .then((r) => setData(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="page-enter">
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Teacher Dashboard</h1>
        <Link to="/teacher/create" style={{ textDecoration: 'none' }}>
          <span className="badge badge-primary" style={{ fontSize: 'var(--text-sm)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <PlusIcon size={14} /> Create Quiz
          </span>
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Total Quizzes"  value={data.total_quizzes}     icon={<QuizIcon size={22} />} />
        <StatCard label="Published"      value={data.published_quizzes} icon={<CheckCircleIcon size={22} />} color="success" />
        <StatCard label="Drafts"         value={data.draft_quizzes}     icon={<EditIcon size={22} />} color="warning" />
        <StatCard label="Total Attempts" value={data.total_attempts}    icon={<ClipboardIcon size={22} />} />
      </div>

      <div className={styles.section}>
        <div className={styles.headerRow} style={{ marginBottom: 'var(--space-4)' }}>
          <h2>Recent Quizzes</h2>
          <Link to="/teacher/quizzes" className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>View all →</Link>
        </div>
        {data.recent_quizzes.length === 0 ? (
          <p className={styles.empty}>You haven't created any quizzes yet.</p>
        ) : (
          <div className={styles.quizGrid}>
            {data.recent_quizzes.map((q) => (
              <div key={q._id} className={styles.quizCard}>
                <h3>{q.title}</h3>
                <div className={styles.quizMeta}>
                  <span className={statusBadgeClass(q.status)}>{q.status}</span>
                  <span className="badge badge-neutral">{q.total_marks || 0} marks</span>
                </div>
                <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>{q.duration_minutes} min</p>
                <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Updated {formatDate(q.updated_at)}</span>
                <div className={styles.quizActions}>
                  <Link to={`/teacher/quizzes/${q._id}`}>
                    <button className={styles.iconBtn} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <EditIcon size={13} /> Edit
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
