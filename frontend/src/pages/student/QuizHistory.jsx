import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI, getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import { formatDateTime, formatDuration, pct } from '../../utils';
import styles from './Student.module.css';

export default function QuizHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    studentAPI.getAttempts()
      .then((r) => setAttempts(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;

  const completed = attempts.filter((a) => a.status === 'submitted');
  const avgPct = completed.length > 0
    ? Math.round(completed.reduce((s, a) => s + (a.percentage || 0), 0) / completed.length * 10) / 10
    : 0;

  return (
    <div className="page-enter">
      <h1 className={styles.pageTitle}>My Quiz History</h1>

      {completed.length > 0 && (
        <div className={styles.statsGrid}>
          <div className="card"><p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Total Attempts</p><p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{completed.length}</p></div>
          <div className="card"><p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Average Score</p><p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{avgPct}%</p></div>
        </div>
      )}

      {attempts.length === 0 ? (
        <EmptyState icon="📜" title="No quiz history yet" message="You haven't attempted any quizzes. Browse available quizzes to get started!">
          <Link to="/student/quizzes"><button style={{ padding: '8px 20px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Browse Quizzes</button></Link>
        </EmptyState>
      ) : (
        <div className={styles.section}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Quiz</th><th>Score</th><th>Percentage</th><th>Result</th><th>Duration</th><th>Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a._id}>
                    <td>{a.quiz_title || '—'}</td>
                    <td>{a.status === 'submitted' ? `${a.score}/${a.total_marks}` : '—'}</td>
                    <td>{a.status === 'submitted' ? pct(a.percentage) : '—'}</td>
                    <td>
                      {a.status === 'submitted' ? (
                        a.passed !== null && a.passed !== undefined ? (
                          <span className={`badge ${a.passed ? 'badge-success' : 'badge-error'}`}>
                            {a.passed ? 'Pass' : 'Fail'}
                          </span>
                        ) : <span className="badge badge-neutral">N/A</span>
                      ) : (
                        <span className={`badge ${a.status === 'in_progress' ? 'badge-primary' : 'badge-error'}`}>{a.status}</span>
                      )}
                    </td>
                    <td>{a.duration_seconds ? formatDuration(a.duration_seconds) : '—'}</td>
                    <td>{formatDateTime(a.submitted_at || a.started_at)}</td>
                    <td>
                      {a.status === 'submitted' ? (
                        <Link to={`/student/quiz/${a.quiz_id}/result/${a._id}`}>
                          <button className="badge badge-primary" style={{ border: 'none', cursor: 'pointer' }}>View</button>
                        </Link>
                      ) : a.status === 'in_progress' ? (
                        <Link to={`/student/quizzes/${a.quiz_id}`}>
                          <button className="badge badge-warning" style={{ border: 'none', cursor: 'pointer' }}>Resume</button>
                        </Link>
                      ) : '—'}
                    </td>
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
