import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { studentAPI, getErrorMessage } from '../../services/api';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDateTime, formatDuration } from '../../utils';
import styles from './Student.module.css';

export default function QuizResult() {
  const { quizId, attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    studentAPI.getAttempt(attemptId)
      .then((r) => setData(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;
  if (!data) return null;

  const { attempt, quiz, questions } = data;
  const autoSubmitted = location.state?.autoSubmitted;
  const passed = attempt.passed;
  const hasPassFail = attempt.passed !== null && attempt.passed !== undefined;
  const correctCount = Object.values(attempt.answers || {}).filter((a) => a.is_correct).length;
  const incorrectCount = (quiz?.total_marks ? questions.length : 0) - correctCount;

  return (
    <div className="page-enter" style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Result header */}
      <div className={styles.resultHeader}>
        {autoSubmitted && (
          <p className="badge badge-warning" style={{ marginBottom: 12 }}>⏱ Auto-submitted (time expired)</p>
        )}
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, marginBottom: 8 }}>{quiz.title}</h1>
        <div className={`${styles.resultScore} ${hasPassFail ? (passed ? styles.pass : styles.fail) : ''}`}>
          {attempt.percentage}%
        </div>
        {hasPassFail && (
          <p style={{ marginTop: 8, fontWeight: 500, color: passed ? 'var(--color-success)' : 'var(--color-error)' }}>
            {passed ? 'PASSED' : 'FAILED'}
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className={styles.resultGrid}>
        <div className={styles.resultStat}>
          <p className="label">Score</p>
          <p className="value">{attempt.score}/{attempt.total_marks}</p>
        </div>
        <div className={styles.resultStat}>
          <p className="label">Percentage</p>
          <p className="value">{attempt.percentage}%</p>
        </div>
        <div className={styles.resultStat}>
          <p className="label">Correct</p>
          <p className="value" style={{ color: 'var(--color-success)' }}>{correctCount}</p>
        </div>
        <div className={styles.resultStat}>
          <p className="label">Incorrect</p>
          <p className="value" style={{ color: 'var(--color-error)' }}>{incorrectCount}</p>
        </div>
        <div className={styles.resultStat}>
          <p className="label">Duration</p>
          <p className="value">{formatDuration(attempt.duration_seconds)}</p>
        </div>
        <div className={styles.resultStat}>
          <p className="label">Submitted</p>
          <p className="value" style={{ fontSize: 'var(--text-sm)' }}>{formatDateTime(attempt.submitted_at)}</p>
        </div>
      </div>

      {/* Answer review */}
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>
        Answer Review
      </h2>
      {questions.map((q, idx) => {
        const answer = attempt.answers?.[q._id] || {};
        return (
          <div key={q._id} className={styles.reviewQuestion}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>Q{idx + 1}. {q.question_text}</h4>
              <span className={`badge ${answer.is_correct ? 'badge-success' : 'badge-error'}`}>
                {answer.is_correct ? '✓ Correct' : '✕ Incorrect'}
              </span>
            </div>
            {q.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isCorrect = letter === q.correct_option;
              const isSelected = letter === answer.selected_option;
              let className = styles.reviewOption;
              if (isCorrect) className += ' ' + styles.correctOpt;
              else if (isSelected && !isCorrect) className += ' ' + styles.wrongOpt;
              return (
                <div key={i} className={className}>
                  {letter}. {opt}
                  {isCorrect && ' ✓'}
                  {isSelected && !isCorrect && ' (your answer)'}
                </div>
              );
            })}
            {q.explanation && (
              <p className="text-muted" style={{ marginTop: 8, fontSize: 'var(--text-sm)' }}>
                <strong>Explanation:</strong> {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 'var(--space-8)' }}>
        <Button variant="ghost" onClick={() => navigate('/student/history')}>View History</Button>
        <Button variant="ghost" onClick={() => navigate('/student/leaderboard')}>Leaderboard</Button>
        <Button onClick={() => navigate('/student/quizzes')}>Browse More Quizzes</Button>
      </div>
    </div>
  );
}
