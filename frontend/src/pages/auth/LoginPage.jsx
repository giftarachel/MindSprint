import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Alert from '../../components/Alert';
import styles from './AuthPages.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
    setApiError('');
  }

  function validate() {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!form.password) errs.password = 'Password is required.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const user = await login(form.email.trim().toLowerCase(), form.password);
      const dest = from || `/${user.role}`;
      navigate(dest, { replace: true });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className={styles.title}>Welcome back</h2>
      <p className={styles.subtitle}>Sign in to your MindSprint account</p>

      {apiError && (
        <Alert type="error" message={apiError} onClose={() => setApiError('')} />
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <Input
          id="email" name="email" type="email" label="Email address"
          placeholder="you@example.com"
          value={form.email} onChange={handleChange}
          error={errors.email} autoComplete="email" autoFocus
        />
        <Input
          id="password" name="password" type="password" label="Password"
          placeholder="Enter your password"
          value={form.password} onChange={handleChange}
          error={errors.password} autoComplete="current-password"
        />
        <Button type="submit" fullWidth loading={loading} size="lg">
          Sign In
        </Button>
      </form>

      <p className={styles.switchLink}>
        Don&apos;t have an account?{' '}
        <Link to="/register">Create one</Link>
      </p>
    </>
  );
}
