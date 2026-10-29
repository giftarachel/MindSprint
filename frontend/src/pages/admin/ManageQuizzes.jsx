import { useState, useEffect, useCallback } from 'react';
import { adminAPI, getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import { formatDate, statusBadgeClass } from '../../utils';
import styles from './Admin.module.css';

export default function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.getQuizzes({ page, per_page: 20 })
      .then((r) => {
        setQuizzes(r.data.data.quizzes);
        setPages(r.data.data.pages);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(quiz, status) {
    setActionLoading(true);
    try {
      await adminAPI.updateQuiz(quiz._id, { status });
      setSuccess(`Quiz "${quiz.title}" is now ${status}.`);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  }

  return (
    <div className="page-enter">
      <h1 className={styles.pageTitle}>Manage Quizzes</h1>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading ? (
        <LoadingSpinner />
      ) : quizzes.length === 0 ? (
        <p className={styles.empty}>No quizzes found.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Teacher</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q._id}>
                  <td>{q.title}</td>
                  <td>{q.teacher_name || '—'}</td>
                  <td><span className={statusBadgeClass(q.status)}>{q.status}</span></td>
                  <td>{formatDate(q.created_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      {q.status !== 'published' && (
                        <button className={styles.iconBtn} onClick={() => setConfirm({ quiz: q, status: 'published' })}>Publish</button>
                      )}
                      {q.status === 'published' && (
                        <button className={styles.iconBtn} onClick={() => setConfirm({ quiz: q, status: 'draft' })}>Unpublish</button>
                      )}
                      {q.status !== 'archived' && (
                        <button className={styles.iconBtn} onClick={() => setConfirm({ quiz: q, status: 'archived' })}>Archive</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-4)' }}>
          <button className={styles.iconBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span style={{ alignSelf: 'center', fontSize: 'var(--text-sm)' }}>Page {page} of {pages}</span>
          <button className={styles.iconBtn} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      <Modal
        isOpen={!!confirm}
        title="Change quiz status"
        message={`Set "${confirm?.quiz?.title}" to ${confirm?.status}?`}
        loading={actionLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={() => changeStatus(confirm.quiz, confirm.status)}
        confirmLabel="Confirm"
        confirmVariant="primary"
      />
    </div>
  );
}
