import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherAPI, getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import { PlusIcon, EditIcon, EyeIcon, ClipboardIcon, TrashIcon } from '../../components/Icons';
import { formatDate, statusBadgeClass } from '../../utils';
import styles from './Teacher.module.css';

export default function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  function load() {
    setLoading(true);
    teacherAPI.getQuizzes()
      .then((r) => setQuizzes(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    setActionLoading(true);
    try {
      await teacherAPI.deleteQuiz(deleteConfirm._id);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
      setDeleteConfirm(null);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-enter">
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>My Quizzes</h1>
        <Link to="/teacher/create">
          <button className={styles.iconBtn} style={{ background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <PlusIcon size={14} /> Create Quiz
          </button>
        </Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {quizzes.length === 0 ? (
        <p className={styles.empty}>You haven't created any quizzes yet. Click "Create Quiz" to get started.</p>
      ) : (
        <div className={styles.quizGrid}>
          {quizzes.map((q) => (
            <div key={q._id} className={styles.quizCard}>
              <h3>{q.title}</h3>
              <div className={styles.quizMeta}>
                <span className={statusBadgeClass(q.status)}>{q.status}</span>
                <span className="badge badge-neutral">{q.question_count} questions</span>
                <span className="badge badge-neutral">{q.total_marks || 0} marks</span>
              </div>
              <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>{q.duration_minutes} min · Updated {formatDate(q.updated_at)}</p>
              <div className={styles.quizActions}>
                <Link to={`/teacher/quizzes/${q._id}`}>
                  <button className={styles.iconBtn} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><EditIcon size={13} /> Edit</button>
                </Link>
                <Link to={`/teacher/preview/${q._id}`}>
                  <button className={styles.iconBtn} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><EyeIcon size={13} /> Preview</button>
                </Link>
                <Link to={`/teacher/quizzes/${q._id}/attempts`}>
                  <button className={styles.iconBtn} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ClipboardIcon size={13} /> Attempts</button>
                </Link>
                <button className={`${styles.iconBtn} ${styles.danger}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setDeleteConfirm(q)}>
                  <TrashIcon size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!deleteConfirm}
        title="Delete quiz?"
        message={`"${deleteConfirm?.title}" and all its questions and attempts will be permanently deleted.`}
        loading={actionLoading}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />
    </div>
  );
}
