import { useEffect } from 'react';
import styles from './Modal.module.css';
import Button from './Button';

/**
 * Accessible confirmation modal.
 */
export default function Modal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', confirmVariant = 'danger', loading = false, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.panel}>
        <h2 id="modal-title" className={styles.title}>{title}</h2>
        {message && <p className={styles.message}>{message}</p>}
        {children}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
