import { useState, useEffect, useCallback } from 'react';
import { adminAPI, getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { formatDate, statusBadgeClass } from '../../utils';
import styles from './Admin.module.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirm, setConfirm] = useState(null); // { type, user }
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.getUsers({ page, per_page: 20, role: roleFilter, search })
      .then((r) => {
        setUsers(r.data.data.users);
        setPages(r.data.data.pages);
        setTotal(r.data.data.total);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  function applyFilters() {
    setPage(1);
    load();
  }

  async function toggleActive(user) {
    setActionLoading(true);
    try {
      await adminAPI.updateUser(user._id, { is_active: !user.is_active });
      setSuccessMsg(`${user.name} ${user.is_active ? 'deactivated' : 'activated'}.`);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  }

  async function changeRole(user, newRole) {
    setActionLoading(true);
    try {
      await adminAPI.updateUser(user._id, { role: newRole });
      setSuccessMsg(`${user.name}'s role changed to ${newRole}.`);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  }

  async function deleteUser(user) {
    setActionLoading(true);
    try {
      await adminAPI.deleteUser(user._id);
      setSuccessMsg(`${user.name} has been deleted.`);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  }

  return (
    <div className="page-enter">
      <h1 className={styles.pageTitle}>Manage Users</h1>
      <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
        {total} user{total !== 1 ? 's' : ''} total
      </p>

      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className={styles.filterRow}>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
        <Button size="sm" variant="ghost" onClick={applyFilters}>Apply</Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <p className={styles.empty}>No users found.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge badge-primary">{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-error'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => setConfirm({ type: 'toggle', user: u })}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className={styles.iconBtn}
                        onClick={() => setConfirm({ type: 'role', user: u })}
                      >
                        Role
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.danger}`}
                        onClick={() => setConfirm({ type: 'delete', user: u })}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-4)' }}>
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span style={{ alignSelf: 'center', fontSize: 'var(--text-sm)' }}>Page {page} of {pages}</span>
          <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <Modal
        isOpen={!!confirm}
        title={
          confirm?.type === 'delete' ? 'Delete user?' :
          confirm?.type === 'toggle' ? 'Change account status?' :
          'Change user role?'
        }
        message={
          confirm?.type === 'delete'
            ? `Are you sure you want to delete ${confirm.user.name}? This cannot be undone.`
            : confirm?.type === 'toggle'
            ? `${confirm.user.is_active ? 'Deactivate' : 'Activate'} the account "${confirm.user.name}"?`
            : null
        }
        loading={actionLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm.type === 'delete') deleteUser(confirm.user);
          else if (confirm.type === 'toggle') toggleActive(confirm.user);
        }}
        confirmLabel={
          confirm?.type === 'delete' ? 'Delete' :
          confirm?.type === 'toggle' ? (confirm?.user.is_active ? 'Deactivate' : 'Activate') :
          'Confirm'
        }
      >
      </Modal>

      {/* Role change sub-panel */}
      {confirm?.type === 'role' && (
        <div className={styles.rolePanel} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          {['admin', 'teacher', 'student'].map((r) => (
            <button
              key={r}
              className={styles.iconBtn}
              disabled={r === confirm.user.role || actionLoading}
              onClick={() => changeRole(confirm.user, r)}
            >
              {r}
            </button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
