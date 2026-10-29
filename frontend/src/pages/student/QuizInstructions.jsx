import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI, getErrorMessage } from '../../services/api';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './Student.module.css';

export default function QuizInstructions() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    studentAPI.getQuizInfo(quizId)
      .then((r) => setQuiz(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [quizId]);

  async function handleStart() {
    setStarting(true);
    setError('');
    try {
      const res = await studentAPI.startAttempt(quizId);
      const attemptId = res.data.data.attempt._id;
      navigate(`/student/quiz/${quizId}/attempt/${attemptId}`);
    } catch (e) {
      const msg = e.response?.data?.message || getErrorMessage(e);
      setError(msg);
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;
  if (!quiz) return null;

  return (
    <div className="page-enter" style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className={styles.pageTitle}>{quiz.title}</h1>

      {quiz.description && (
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>{quiz.description}</p>
      )}

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Quiz Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div><span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Questions</span><p style={{ fontWeight: 600 }}>{quiz.question_count}</p></div>
          <div><span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Total Marks</span><p style={{ fontWeight: 600 }}>{quiz.total_marks || 0}</p></div>
          <div><span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Duration</span><p style={{ fontWeight: 600 }}>{quiz.duration_minutes} minutes</p></div>
          <div><span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Passing %</span><p style={{ fontWeight: 600 }}>{quiz.passing_percentage || 0}%</p></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)', background: 'var(--color-lavender-light)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Instructions</h2>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--color-text)' }}>
          <li>The quiz has a timer of {quiz.duration_minutes} minutes. It will auto-submit when time expires.</li>
          <li>You can navigate between questions and change your answers before submitting.</li>
          <li>Each question has exactly one correct answer.</li>
          <li>Your score is calculated on the server after you submit.</li>
          <li>Once submitted, you cannot change your answers or retake the quiz.</li>
          <li>If you refresh the page, your progress is preserved — you can resume where you left off.</li>
        </ul>
      </div>

      {error && <Alert type="error" message={error} />}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Button variant="ghost" onClick={() => navigate('/student/quizzes')}>Cancel</Button>
        <Button onClick={handleStart} loading={starting} size="lg">Start Quiz</Button>
      </div>
    </div>
  );
}
