import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

export default function AuthLayout() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.brand}>
        <span className={styles.logo}>MS</span>
        <div>
          <h1 className={styles.name}>MindSprint</h1>
          <p className={styles.tagline}>Think Fast. Learn More. Sprint Ahead.</p>
        </div>
      </div>
      <div className={styles.card}>
        <Outlet />
      </div>
    </div>
  );
}
