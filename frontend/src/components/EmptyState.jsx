import styles from './EmptyState.module.css';

export default function EmptyState({ icon = '📭', title, message, children }) {
  return (
    <div className={styles.container}>
      <div className={styles.icon} aria-hidden="true">{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
      {children && <div className={styles.action}>{children}</div>}
    </div>
  );
}
