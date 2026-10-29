import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI, categoriesAPI, getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import styles from './Student.module.css';

export default function AvailableQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  function load() {
    setLoading(true);
    const params = {};
    if (categoryFilter) params.category_id = categoryFilter;
    if (search) params.search = search;
    studentAPI.getQuizzes(params)
      .then((r) => setQuizzes(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    categoriesAPI.list().then((r) => setCategories(r.data.data)).catch(() => {});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = quizzes.filter((q) => {
    if (categoryFilter && q.category_id !== categoryFilter) return false;
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-enter">
      <h1 className={styles.pageTitle}>Available Quizzes</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className={styles.filterRow}>
        <input
          type="text"
          placeholder="Search quizzes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <button className="badge badge-primary" style={{ padding: '8px 16px', border: 'none', cursor: 'pointer' }} onClick={load}>Search</button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon="📋" title="No quizzes available" message="There are no published quizzes matching your filters right now. Check back later!" />
      ) : (
        <div className={styles.quizGrid}>
          {filtered.map((q) => (
            <div key={q._id} className={styles.quizCard}>
              <h3>{q.title}</h3>
              {q.description && <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>{q.description}</p>}
              <div className={styles.quizMeta}>
                <span className="badge badge-primary">{q.question_count} questions</span>
                <span className="badge badge-neutral">{q.total_marks || 0} marks</span>
                <span className="badge badge-neutral">{q.duration_minutes} min</span>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                {q.already_attempted ? (
                  <span className="badge badge-success">✓ Completed</span>
                ) : q.attempt_in_progress ? (
                  <Link to={`/student/quizzes/${q._id}`}>
                    <button className="badge badge-warning" style={{ border: 'none', cursor: 'pointer', padding: '8px 16px' }}>Resume</button>
                  </Link>
                ) : (
                  <Link to={`/student/quizzes/${q._id}`}>
                    <button style={{ padding: '8px 20px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500 }}>Start Quiz</button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
