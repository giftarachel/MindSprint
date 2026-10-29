import styles from './StatCard.module.css';

/**
 * Dashboard statistic card.
 */
export default function StatCard({ label, value, icon, color = 'primary', sub }) {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.content}>
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>{value ?? '—'}</p>
        {sub && <p className={styles.sub}>{sub}</p>}
      </div>
      {icon && <div className={styles.icon} aria-hidden="true">{icon}</div>}
    </div>
  );
}
