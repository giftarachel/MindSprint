import styles from './Input.module.css';

/**
 * Reusable text input with label and error display.
 */
export default function Input({
  label,
  id,
  error,
  type = 'text',
  helpText,
  className = '',
  ...rest
}) {
  return (
    <div className={`${styles.field} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
      {helpText && !error && (
        <p id={`${id}-help`} className={styles.help}>{helpText}</p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">{error}</p>
      )}
    </div>
  );
}
