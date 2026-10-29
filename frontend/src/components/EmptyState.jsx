import styles from './EmptyState.module.css';
import { InboxIcon } from './Icons';

export default function EmptyState({ icon: IconComponent, title, message, children }) {
  const Icon = IconComponent || InboxIcon;
  return (
    <div className={styles.container}>
      <div className={styles.iconWrap} aria-hidden="true">
        <Icon size={40} color="var(--color-primary-light)" />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
      {children && <div className={styles.action}>{children}</div>}
    </div>
  );
}
