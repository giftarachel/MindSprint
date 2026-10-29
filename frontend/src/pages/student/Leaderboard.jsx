import { useState, useEffect } from 'react';
import { studentAPI, getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import styles from './Student.module.css';

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    studentAPI.leaderboard()
      .then((r) => setEntries(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="page-enter">
      <h1 className={styles.pageTitle}>Leaderboard</h1>
      <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
        Ranked by average percentage (descending), then by number of quizzes completed. Top 50 students shown.
      </p>

      {entries.length === 0 ? (
        <EmptyState icon="🏆" title="No rankings yet" message="No quiz attempts have been submitted. Be the first on the leaderboard!" />
      ) : (
        <div className={styles.section} style={{ padding: 'var(--space-4) var(--space-6)' }}>
          {entries.map((e) => {
            const rankClass =
              e.rank === 1 ? styles.gold :
              e.rank === 2 ? styles.silver :
              e.rank === 3 ? styles.bronze :
              styles.normal;
            const isMe = e.student_name === user?.name;

            return (
              <div key={e._id} className={styles.lbRow} style={isMe ? { background: 'var(--color-lavender-light)', borderRadius: 'var(--radius-md)', paddingLeft: 8, paddingRight: 8 } : {}}>
                <div className={`${styles.lbRank} ${rankClass}`}>{e.rank}</div>
                <span className={styles.lbName}>
                  {e.student_name || 'Anonymous'}
                  {isMe && <span className="badge badge-primary" style={{ marginLeft: 8 }}>You</span>}
                </span>
                <div className={styles.lbStats}>
                  <span style={{ fontWeight: 600 }}>{e.avg_percentage}%</span>
                  <span className="text-muted"> · {e.total_completed} quiz{e.total_completed !== 1 ? 'es' : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
