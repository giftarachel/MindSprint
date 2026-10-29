import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Alert from '../../components/Alert';
import styles from './AuthPages.module.css';

export default function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'student',
  });
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
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = 'Enter a valid email.';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!/[A-Za-z]/.test(form.password)) errs.password = 'Password must contain at least one letter.';
    if (!/\d/.test(form.password)) errs.password = 'Password must contain at least one number.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, role: form.role });
      // Auto-login after registration
      const user = await login(form.email.trim().toLowerCase(), form.password);
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        setErrors(errData.errors);
      } else {
        setApiError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className={styles.title}>Create account</h2>
      <p className={styles.subtitle}>Join MindSprint for free</p>

      {apiError && <Alert type="error" message={apiError} onClose={() => setApiError('')} />}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <Input
          id="name" name="name" label="Full name"
          placeholder="Jane Smith"
          value={form.name} onChange={handleChange}
          error={errors.name} autoFocus
        />
        <Input
          id="email" name="email" type="email" label="Email address"
          placeholder="you@example.com"
          value={form.email} onChange={handleChange}
          error={errors.email}
        />

        <div className={styles.field}>
          <label className={styles.label} htmlFor="role">I am a…</label>
          <select
            id="role" name="role"
            value={form.role} onChange={handleChange}
            className={styles.select}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <Input
          id="password" name="password" type="password" label="Password"
          placeholder="Min 8 chars, include a letter and number"
          value={form.password} onChange={handleChange}
          error={errors.password}
        />
        <Input
          id="confirmPassword" name="confirmPassword" type="password" label="Confirm password"
          placeholder="Repeat your password"
          value={form.confirmPassword} onChange={handleChange}
          error={errors.confirmPassword}
        />

        <Button type="submit" fullWidth loading={loading} size="lg">
          Create Account
        </Button>
      </form>

      <p className={styles.switchLink}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </>
  );
}
