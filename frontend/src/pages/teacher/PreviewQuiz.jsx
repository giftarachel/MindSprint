import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherAPI, getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Button from '../../components/Button';
import styles from './Teacher.module.css';

export default function PreviewQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    teacherAPI.getQuiz(quizId)
      .then((r) => setQuiz(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;
  if (!quiz) return null;

  return (
    <div className="page-enter">
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>Preview: {quiz.title}</h1>
          <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
            {quiz.duration_minutes} min · {quiz.questions?.length || 0} questions · {quiz.total_marks || 0} marks
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/teacher/quizzes/${quizId}`)}>Edit</Button>
          <Button size="sm" onClick={() => navigate('/teacher/quizzes')}>Back to Quizzes</Button>
        </div>
      </div>

      {quiz.description && <p style={{ marginBottom: 'var(--space-6)', color: 'var(--color-text-muted)' }}>{quiz.description}</p>}

      {(quiz.questions || []).length === 0 ? (
        <p className={styles.empty}>No questions in this quiz yet.</p>
      ) : (
        quiz.questions.map((q, idx) => (
          <div key={q._id} className={styles.previewQuestion}>
            <h4>Q{idx + 1}. {q.question_text} <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{q.marks} marks</span></h4>
            {q.options.map((o, i) => {
              const letter = String.fromCharCode(65 + i);
              return (
                <div key={i} className={`${styles.previewOption} ${letter === q.correct_option ? styles.correct : ''}`}>
                  {letter}. {o} {letter === q.correct_option && '✓'}
                </div>
              );
            })}
            {q.explanation && <p className="text-muted" style={{ marginTop: 8, fontSize: 'var(--text-sm)' }}>Explanation: {q.explanation}</p>}
          </div>
        ))
      )}
    </div>
  );
}
