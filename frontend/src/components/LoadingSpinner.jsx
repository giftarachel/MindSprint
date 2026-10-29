import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ message = 'Loading…', fullPage = false }) {
  return (
    <div className={`${styles.wrapper} ${fullPage ? styles.fullPage : ''}`}>
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.text}>{message}</p>
    </div>
  );
}
