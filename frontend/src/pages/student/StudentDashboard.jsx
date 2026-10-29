import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI, getErrorMessage } from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import { formatDateTime, pct } from '../../utils';
import styles from './Student.module.css';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    studentAPI.dashboard()
      .then((r) => setData(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="page-enter">
      <h1 className={styles.pageTitle}>Student Dashboard</h1>

      <div className={styles.statsGrid}>
        <StatCard label="Available Quizzes" value={data.available_quizzes_count} icon="📋" />
        <StatCard label="Quizzes Taken" value={data.completed_attempts} icon="✅" color="success" />
        <StatCard label="Average Score" value={`${data.average_score}%`} icon="📊" />
        <StatCard label="Total Attempts" value={data.total_attempts} icon="📝" />
      </div>

      {/* Quick links */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        <Link to="/student/quizzes" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.75rem' }}>📋</span>
            <p style={{ fontWeight: 500, marginTop: 8 }}>Browse Quizzes</p>
          </div>
        </Link>
        <Link to="/student/history" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.75rem' }}>📜</span>
            <p style={{ fontWeight: 500, marginTop: 8 }}>My History</p>
          </div>
        </Link>
        <Link to="/student/leaderboard" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.75rem' }}>🏆</span>
            <p style={{ fontWeight: 500, marginTop: 8 }}>Leaderboard</p>
          </div>
        </Link>
      </div>

      {/* Recent results */}
      <div className={styles.section}>
        <h2>Recent Results</h2>
        {data.recent_results.length === 0 ? (
          <EmptyState icon="📝" title="No attempts yet" message="Take your first quiz to see results here.">
            <Link to="/student/quizzes"><button style={{ padding: '8px 20px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Browse Quizzes</button></Link>
          </EmptyState>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Quiz</th><th>Score</th><th>Percentage</th><th>Date</th></tr>
              </thead>
              <tbody>
                {data.recent_results.map((r) => (
                  <tr key={r._id}>
                    <td>{r.quiz_title || '—'}</td>
                    <td>{r.score}/{r.total_marks}</td>
                    <td>{pct(r.percentage)}</td>
                    <td>{formatDateTime(r.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
