import { Link } from 'react-router-dom';
import styles from './ErrorPages.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.code}>404</div>
      <h1 className={styles.title}>Page Not Found</h1>
      <p className={styles.message}>The page you're looking for doesn't exist.</p>
      <Link to="/" className={styles.link}>Go Home</Link>
    </div>
  );
}
