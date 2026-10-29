import styles from './Alert.module.css';

/**
 * Alert / notification banner.
 * type: 'success' | 'error' | 'warning' | 'info'
 */
export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  const icons = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
  };

  return (
    <div className={`${styles.alert} ${styles[type]}`} role="alert">
      <span className={styles.icon} aria-hidden="true">{icons[type]}</span>
      <span className={styles.message}>{message}</span>
      {onClose && (
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
