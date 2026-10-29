import { useState, useEffect } from 'react';
import { adminAPI, getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { TrendUpIcon, ClockIcon, ChartIcon, QuizIcon } from '../../components/Icons';
import styles from './Admin.module.css';

export default function AdminStatistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.statistics()
      .then((r) => setStats(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;
  if (!stats) return null;

  return (
    <div className="page-enter">
      <h1 className={styles.pageTitle}>Platform Statistics</h1>

      <div className={styles.statsGrid}>
        <StatCard label="Avg. Score (%)" value={stats.avg_score_percentage} icon={<TrendUpIcon size={22} />} />
        <StatCard label="Days with Activity" value={stats.daily_attempts.length} icon={<ClockIcon size={22} />} sub="in last 7 days" />
      </div>

      <div className={styles.recentSection}>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Attempts Over Last 7 Days</h2>
        {stats.daily_attempts.length === 0 ? (
          <EmptyState icon={ChartIcon} title="No recent activity" message="No quiz attempts in the past week." />
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120, padding: '0 8px' }}>
            {stats.daily_attempts.map((d) => {
              const maxCount = Math.max(...stats.daily_attempts.map((x) => x.count));
              const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
              return (
                <div key={d._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{d.count}</span>
                  <div style={{ width: '100%', height: `${height}%`, background: 'var(--color-primary)', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{d._id.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.recentSection}>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Top Quizzes by Attempts</h2>
        {stats.top_quizzes.length === 0 ? (
          <EmptyState icon={QuizIcon} title="No quiz data" message="No quiz attempts have been recorded yet." />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Quiz</th><th>Attempts</th></tr></thead>
              <tbody>
                {stats.top_quizzes.map((q) => (
                  <tr key={q._id}><td>{q.quiz_title || '—'}</td><td>{q.attempts}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
