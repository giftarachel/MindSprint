import { useState, useEffect } from 'react';
import { categoriesAPI, getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import styles from './Admin.module.css';

export default function ManageCategories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({ name: '', description: '' });
  const [editing, setEditing] = useState(null); // category being edited
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  function load() {
    setLoading(true);
    categoriesAPI.list()
      .then((r) => setCats(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setActionLoading(true);
    try {
      await categoriesAPI.create({ name: form.name, description: form.description });
      setForm({ name: '', description: '' });
      setSuccess('Category created.');
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdate() {
    if (!editing?.name.trim()) return;
    setActionLoading(true);
    try {
      await categoriesAPI.update(editing._id, { name: editing.name, description: editing.description });
      setSuccess('Category updated.');
      setEditing(null);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      await categoriesAPI.delete(confirmDelete._id);
      setSuccess('Category deleted.');
      setConfirmDelete(null);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="page-enter">
      <h1 className={styles.pageTitle}>Manage Categories</h1>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Create form */}
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <input
          className={styles.filterRow ? '' : ''}
          style={{ padding: '8px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', minWidth: 200, fontSize: 'var(--text-sm)' }}
          placeholder="Category name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          style={{ padding: '8px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', minWidth: 200, fontSize: 'var(--text-sm)' }}
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <Button type="submit" size="sm" loading={actionLoading}>Add Category</Button>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : cats.length === 0 ? (
        <p className={styles.empty}>No categories yet. Create one above.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Name</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td className="text-muted">{c.description || '—'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} onClick={() => setEditing(c)}>Edit</button>
                      <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setConfirmDelete(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(40,34,56,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 28, maxWidth: 400, width: '100%' }}>
            <h2 style={{ marginBottom: 16, fontSize: 'var(--text-xl)' }}>Edit Category</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                style={{ padding: '8px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                value={editing.name}
                onChange={(e) => setEditing((c) => ({ ...c, name: e.target.value }))}
                placeholder="Name"
              />
              <input
                style={{ padding: '8px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                value={editing.description || ''}
                onChange={(e) => setEditing((c) => ({ ...c, description: e.target.value }))}
                placeholder="Description"
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button size="sm" loading={actionLoading} onClick={handleUpdate}>Save</Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!confirmDelete}
        title="Delete category?"
        message={`Delete "${confirmDelete?.name}"? Quizzes using it will lose the category reference.`}
        loading={actionLoading}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />
    </div>
  );
}
