import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teacherAPI, categoriesAPI, getErrorMessage } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import styles from './Teacher.module.css';

export default function CreateEditQuiz() {
  const { quizId } = useParams();
  const isEdit = !!quizId;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', category_id: '',
    duration_minutes: 30, passing_percentage: 0, status: 'draft',
  });
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddQ, setShowAddQ] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // New question form
  const [qForm, setQForm] = useState({
    question_text: '', options: ['', '', '', ''],
    correct_option: 'A', marks: 1, explanation: '', order: 0,
  });

  useEffect(() => {
    categoriesAPI.list().then((r) => setCategories(r.data.data)).catch(() => {});
    if (isEdit) {
      teacherAPI.getQuiz(quizId)
        .then((r) => {
          const d = r.data.data;
          setForm({
            title: d.title || '',
            description: d.description || '',
            category_id: d.category_id || '',
            duration_minutes: d.duration_minutes || 30,
            passing_percentage: d.passing_percentage || 0,
            status: d.status || 'draft',
          });
          setQuestions(d.questions || []);
        })
        .catch((e) => setError(getErrorMessage(e)))
        .finally(() => setLoading(false));
    }
  }, [quizId, isEdit]);

  function handleQuizSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      duration_minutes: parseInt(form.duration_minutes) || 30,
      passing_percentage: parseFloat(form.passing_percentage) || 0,
      category_id: form.category_id || null,
    };

    if (isEdit) {
      teacherAPI.updateQuiz(quizId, payload)
        .then(() => { setSuccess('Quiz updated.'); navigate(`/teacher/quizzes/${quizId}`); })
        .catch((e) => setError(getErrorMessage(e)))
        .finally(() => setSaving(false));
    } else {
      teacherAPI.createQuiz(payload)
        .then((r) => navigate(`/teacher/quizzes/${r.data.data._id}`))
        .catch((e) => setError(getErrorMessage(e)))
        .finally(() => setSaving(false));
    }
  }

  function handlePublish() {
    setSaving(true);
    teacherAPI.updateQuiz(quizId, { status: 'published' })
      .then(() => { setForm((f) => ({ ...f, status: 'published' })); setSuccess('Quiz published! Students can now attempt it.'); })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setSaving(false));
  }

  function handleUnpublish() {
    setSaving(true);
    teacherAPI.updateQuiz(quizId, { status: 'draft' })
      .then(() => { setForm((f) => ({ ...f, status: 'draft' })); setSuccess('Quiz unpublished.'); })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setSaving(false));
  }

  function addQuestion(e) {
    e.preventDefault();
    if (!qForm.question_text.trim()) { setError('Question text is required.'); return; }
    if (qForm.options.some((o) => !o.trim())) { setError('All four options are required.'); return; }

    setSaving(true);
    teacherAPI.addQuestion(quizId, qForm)
      .then((r) => {
        setQuestions((qs) => [...qs, r.data.data]);
        setQForm({ question_text: '', options: ['', '', '', ''], correct_option: 'A', marks: 1, explanation: '', order: questions.length });
        setShowAddQ(false);
        setSuccess('Question added.');
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setSaving(false));
  }

  function deleteQuestion(qid) {
    setSaving(true);
    teacherAPI.deleteQuestion(qid)
      .then(() => {
        setQuestions((qs) => qs.filter((q) => q._id !== qid));
        setSuccess('Question deleted.');
        setDeleteConfirm(null);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setSaving(false));
  }

  if (loading) return <LoadingSpinnerFull />;

  return (
    <div className="page-enter">
      <h1 className={styles.pageTitle}>{isEdit ? 'Edit Quiz' : 'Create Quiz'}</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Quiz details form */}
      <form onSubmit={handleQuizSubmit} className={styles.form}>
        <Input
          id="title" label="Quiz title" placeholder="e.g. Introduction to Python"
          value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <div>
          <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 6, display: 'block' }}>Description</label>
          <textarea
            className={styles.textarea}
            placeholder="Brief description of the quiz"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div>
          <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 6, display: 'block' }}>Category</label>
          <select className={styles.select} value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
            <option value="">No category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className={styles.formRow}>
          <Input
            id="duration" label="Duration (minutes)" type="number"
            value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
          />
          <Input
            id="passing" label="Passing % (0 = no pass/fail)" type="number"
            value={form.passing_percentage} onChange={(e) => setForm((f) => ({ ...f, passing_percentage: e.target.value }))}
          />
        </div>
        <Button type="submit" loading={saving}>{isEdit ? 'Save Changes' : 'Create Quiz'}</Button>
      </form>

      {/* Questions section (only in edit mode) */}
      {isEdit && (
        <div style={{ marginTop: 'var(--space-8)' }}>
          <div className={styles.headerRow}>
            <h2>Questions ({questions.length})</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/teacher/preview/${quizId}`)}>Preview</Button>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/teacher/quizzes/${quizId}/attempts`)}>Attempts</Button>
              {form.status === 'draft' ? (
                <Button size="sm" loading={saving} onClick={handlePublish} disabled={questions.length === 0}>Publish</Button>
              ) : (
                <Button size="sm" variant="ghost" loading={saving} onClick={handleUnpublish}>Unpublish</Button>
              )}
              <Button size="sm" variant="primary" onClick={() => setShowAddQ(true)}>＋ Add Question</Button>
            </div>
          </div>

          {questions.length === 0 ? (
            <p className={styles.empty}>No questions yet. Add your first question to get started.</p>
          ) : (
            <div className={styles.qList}>
              {questions.map((q, idx) => (
                <div key={q._id} className={styles.qItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4>Q{idx + 1}. {q.question_text}</h4>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className="badge badge-neutral">{q.marks} marks</span>
                      <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDeleteConfirm(q)}>Delete</button>
                    </div>
                  </div>
                  <div className={styles.options}>
                    {q.options.map((o, i) => (
                      <span key={i} className={String.fromCharCode(65 + i) === q.correct_option ? styles.correct : ''}>
                        {String.fromCharCode(65 + i)}. {o} {String.fromCharCode(65 + i) === q.correct_option && '✓'}
                      </span>
                    ))}
                  </div>
                  {q.explanation && <p className="text-muted" style={{ marginTop: 6, fontSize: 'var(--text-sm)' }}>Explanation: {q.explanation}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add question modal */}
      {showAddQ && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(40,34,56,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflow: 'auto' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 28, maxWidth: 560, width: '100%' }}>
            <h2 style={{ marginBottom: 16, fontSize: 'var(--text-xl)' }}>Add Question</h2>
            <form onSubmit={addQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 6, display: 'block' }}>Question text</label>
                <textarea
                  className={styles.textarea}
                  value={qForm.question_text}
                  onChange={(e) => setQForm((q) => ({ ...q, question_text: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.optionGrid}>
                {['A', 'B', 'C', 'D'].map((letter, i) => (
                  <div key={letter} className={styles.optionRow}>
                    <input
                      type="radio" name="correct" checked={qForm.correct_option === letter}
                      onChange={() => setQForm((q) => ({ ...q, correct_option: letter }))}
                    />
                    <input
                      type="text" placeholder={`Option ${letter}`}
                      value={qForm.options[i]}
                      onChange={(e) => setQForm((q) => {
                        const opts = [...q.options];
                        opts[i] = e.target.value;
                        return { ...q, options: opts };
                      })}
                      required
                    />
                  </div>
                ))}
              </div>
              <div className={styles.formRow}>
                <Input
                  id="marks" label="Marks" type="number"
                  value={qForm.marks}
                  onChange={(e) => setQForm((q) => ({ ...q, marks: parseInt(e.target.value) || 1 }))}
                />
                <Input
                  id="explanation" label="Explanation (optional)"
                  value={qForm.explanation}
                  onChange={(e) => setQForm((q) => ({ ...q, explanation: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button size="sm" variant="ghost" type="button" onClick={() => setShowAddQ(false)}>Cancel</Button>
                <Button size="sm" type="submit" loading={saving}>Add Question</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!deleteConfirm}
        title="Delete question?"
        message="This question will be permanently removed from the quiz."
        loading={saving}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => deleteQuestion(deleteConfirm._id)}
        confirmLabel="Delete"
      />
    </div>
  );
}

function LoadingSpinnerFull() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;
}
