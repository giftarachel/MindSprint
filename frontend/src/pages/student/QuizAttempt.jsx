import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI, getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { clamp } from '../../utils';
import styles from './Student.module.css';

export default function QuizAttempt() {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const timerRef = useRef(null);
  const answersRef = useRef({});

  // Keep ref in sync for auto-submit
  useEffect(() => { answersRef.current = answers; }, [answers]);

  // Load attempt
  useEffect(() => {
    let mounted = true;
    studentAPI.startAttempt(quizId)
      .then((r) => {
        if (!mounted) return;
        const d = r.data.data;
        setAttempt(d.attempt);
        setQuestions(d.questions || []);
        // Restore existing answers from the attempt if any
        const existing = {};
        if (d.attempt.answers) {
          for (const [qid, val] of Object.entries(d.attempt.answers)) {
            existing[qid] = val.selected_option || val;
          }
        }
        setAnswers(existing);
        setTimeLeft(d.duration_minutes * 60);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || !attempt) return;
    timerRef.current = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, attempt]);

  // Auto-submit when timer hits 0
  const doSubmit = useCallback(async (isAuto = false) => {
    setSubmitting(true);
    try {
      const res = await studentAPI.submitAttempt(attemptId, answersRef.current);
      navigate(`/student/quiz/${quizId}/result/${attemptId}`, {
        state: { result: res.data.data, autoSubmitted: isAuto },
      });
    } catch (e) {
      setError(getErrorMessage(e));
      setSubmitting(false);
    }
  }, [attemptId, quizId, navigate]);

  useEffect(() => {
    if (timeLeft === 0 && attempt && !submitting) {
      doSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function selectOption(qid, option) {
    setAnswers((a) => ({ ...a, [qid]: option }));
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  if (loading) return <LoadingSpinner fullPage message="Loading quiz…" />;
  if (error) return <Alert type="error" message={error} />;
  if (!attempt) return null;

  const q = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="page-enter" style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header with timer */}
      <div className={styles.attemptHeader}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
            {attempt.quiz_title || 'Quiz'}
          </h1>
          <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
            Question {currentIdx + 1} of {questions.length} · {answeredCount} answered
          </p>
        </div>
        <div className={`${styles.timer} ${timeLeft < 60 ? styles.warning : ''}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Current question */}
      {q && (
        <div className={styles.questionCard}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)' }}>
            {q.question_text}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const selected = answers[q._id] === letter;
              return (
                <button
                  key={i}
                  className={`${styles.optionBtn} ${selected ? styles.selected : ''}`}
                  onClick={() => selectOption(q._id, letter)}
                >
                  <span className={styles.optionLetter}>{letter}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className={styles.navButtons}>
        <Button
          variant="ghost"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
        >
          ← Previous
        </Button>
        {currentIdx < questions.length - 1 ? (
          <Button onClick={() => setCurrentIdx((i) => clamp(i + 1, 0, questions.length - 1))}>
            Next →
          </Button>
        ) : (
          <Button onClick={() => setShowConfirm(true)}>Submit Quiz</Button>
        )}
      </div>

      {/* Question navigator */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--space-6)' }}>
        {questions.map((qq, i) => (
          <button
            key={qq._id}
            onClick={() => setCurrentIdx(i)}
            style={{
              width: 36, height: 36, borderRadius: 'var(--radius-sm)',
              border: i === currentIdx ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: answers[qq._id] ? 'var(--color-lavender)' : 'var(--color-surface)',
              color: answers[qq._id] ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
              cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)',
            }}
            aria-label={`Go to question ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Submit confirmation modal */}
      <Modal
        isOpen={showConfirm}
        title="Submit quiz?"
        message={`You have answered ${answeredCount} of ${questions.length} questions. Once submitted, you cannot change your answers.`}
        loading={submitting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => doSubmit(false)}
        confirmLabel="Submit"
        confirmVariant="primary"
      />
    </div>
  );
}
