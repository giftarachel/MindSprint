import styles from './Alert.module.css';
import { CheckCircleIcon, XCircleIcon, WarningIcon, InfoIcon, CloseIcon } from './Icons';

/**
 * Alert / notification banner.
 * type: 'success' | 'error' | 'warning' | 'info'
 */
export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  const IconMap = {
    success: CheckCircleIcon,
    error:   XCircleIcon,
    warning: WarningIcon,
    info:    InfoIcon,
  };
  const AlertIcon = IconMap[type] || InfoIcon;

  return (
    <div className={`${styles.alert} ${styles[type]}`} role="alert">
      <AlertIcon size={16} className={styles.icon} />
      <span className={styles.message}>{message}</span>
      {onClose && (
        <button className={styles.close} onClick={onClose} aria-label="Dismiss">
          <CloseIcon size={14} />
        </button>
      )}
    </div>
  );
}
