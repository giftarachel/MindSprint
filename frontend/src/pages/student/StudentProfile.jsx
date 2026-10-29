import { useState, useEffect } from 'react';
import { studentAPI, getErrorMessage } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate, initials } from '../../utils';
import styles from './Student.module.css';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    studentAPI.getProfile()
      .then((r) => {
        setProfile(r.data.data);
        setForm({ name: r.data.data.name || '' });
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name cannot be empty.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await studentAPI.updateProfile({ name: form.name.trim() });
      setProfile(res.data.data);
      setSuccess('Profile updated successfully.');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error && !profile) return <Alert type="error" message={error} />;
  if (!profile) return null;

  return (
    <div className="page-enter" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 className={styles.pageTitle}>My Profile</h1>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Profile header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'var(--space-6)' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 700,
        }}>
          {initials(profile.name)}
        </div>
        <div>
          <h2 style={{ fontSize: 'var(--text-xl)' }}>{profile.name}</h2>
          <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>{profile.email}</p>
          <span className="badge badge-primary" style={{ marginTop: 4 }}>{profile.role}</span>
        </div>
      </div>

      {/* Editable form */}
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Edit Details</h2>
        <Input
          id="name" label="Full name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          id="email" label="Email address" value={profile.email} disabled
          helpText="Email cannot be changed. Contact an admin if needed."
        />
        <Input
          id="role" label="Role" value={profile.role} disabled
          helpText="Role changes are handled by administrators."
        />
        <div>
          <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Member since</span>
          <p style={{ fontWeight: 500 }}>{formatDate(profile.created_at)}</p>
        </div>
        <Button type="submit" loading={saving} style={{ alignSelf: 'flex-start' }}>Save Changes</Button>
      </form>
    </div>
  );
}
