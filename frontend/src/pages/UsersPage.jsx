import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function UserModal({ user: editUser, onClose, onSaved }) {
  const [form, setForm] = useState(editUser || { name: '', email: '', password: '', role: 'customer', company: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!editUser?.id;

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isEdit) await api.put(`/users/${editUser.id}`, form);
      else await api.post('/users', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{isEdit ? 'EDIT USER' : 'ADD USER'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            {!isEdit && (
              <div className="form-group">
                <label>Password *</label>
                <input type="password" className="form-control" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
              </div>
            )}
            <div className="form-group">
              <label>Role</label>
              <select className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {['admin','manager','customer','technician'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Company</label>
              <input className="form-control" value={form.company || ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            {isEdit && (
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.isActive ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}
          </div>
          {error && <div className="auth-error">⚠ {error}</div>}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : isEdit ? 'Save Changes' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ROLE_LABELS = { admin: '⚙️ Admin', manager: '📋 Manager', customer: '👤 Customer', technician: '🔧 Technician' };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const res = await api.get(`/users?${params}`);
      setUsers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    setDeleting(id);
    try { await api.delete(`/users/${id}`); fetchUsers(); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">USER MANAGEMENT</h1>
          <div className="page-sub">{users.length} registered users</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add User</button>
      </div>

      <div className="filter-bar">
        <div className="search-wrap" style={{ flex: 1 }}>
          <span className="search-icon">🔍</span>
          <input className="form-control search-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {['admin','manager','customer','technician'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Company</th><th>Last Login</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: { admin: '#ef4444', manager: '#f4a11a', customer: '#3b82f6', technician: '#22c55e' }[u.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#000', flexShrink: 0 }}>
                          {u.name[0]}
                        </div>
                        <strong style={{ fontSize: 13 }}>{u.name}</strong>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' }}>{u.email}</td>
                    <td><span className={`badge badge-${u.role}`}>{ROLE_LABELS[u.role]}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{u.company || '—'}</td>
                    <td style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                    </td>
                    <td><span className={`badge badge-${u.isActive ? 'available' : 'cancelled'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}>Edit</button>
                        {u.id !== currentUser?.id && u.isActive && (
                          <button className="btn btn-danger btn-sm" disabled={deleting === u.id} onClick={() => deactivate(u.id)}>
                            {deleting === u.id ? '...' : 'Deactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <UserModal
          user={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}
