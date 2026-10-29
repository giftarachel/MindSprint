import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { teacherAPI, getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import { formatDateTime, formatDuration, pct } from '../../utils';
import styles from './Teacher.module.css';

export default function ViewAttempts() {
  const { quizId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    teacherAPI.getAttempts(quizId)
      .then((r) => setData(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="page-enter">
      <h1 className={styles.pageTitle}>Attempts: {data?.quiz?.title}</h1>

      <div className={styles.statsGrid}>
        <div className="card"><p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Total Attempts</p><p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{data?.total_attempts}</p></div>
        <div className="card"><p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Average Score</p><p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{data?.average_percentage}%</p></div>
      </div>

      {data?.attempts?.length === 0 ? (
        <EmptyState icon="📝" title="No attempts yet" message="No students have attempted this quiz yet." />
      ) : (
        <div className={styles.section}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Student</th><th>Email</th><th>Score</th><th>Percentage</th><th>Duration</th><th>Submitted</th></tr>
              </thead>
              <tbody>
                {data.attempts.map((a) => (
                  <tr key={a._id}>
                    <td>{a.student_name || '—'}</td>
                    <td className="text-muted">{a.student_email || '—'}</td>
                    <td>{a.score}/{a.total_marks}</td>
                    <td>{pct(a.percentage)}</td>
                    <td>{formatDuration(a.duration_seconds)}</td>
                    <td>{formatDateTime(a.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
