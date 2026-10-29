import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './ErrorPages.module.css';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  return (
    <div className={styles.page}>
      <div className={styles.code}>403</div>
      <h1 className={styles.title}>Access Denied</h1>
      <p className={styles.message}>You don't have permission to view this page.</p>
      <Link to={user ? `/${user.role}` : '/login'} className={styles.link}>
        {user ? 'Go to Dashboard' : 'Go to Login'}
      </Link>
    </div>
  );
}
