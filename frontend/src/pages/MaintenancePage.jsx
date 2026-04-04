import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function MaintenanceModal({ onClose, onSaved }) {
  const [equipment, setEquipment] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [form, setForm] = useState({ equipmentId: '', issue: '', description: '', priority: 'medium', assignedTo: '', estimatedCost: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    api.get('/equipment').then(r => setEquipment(r.data.data));
    if (isAdmin()) api.get('/users?role=technician').then(r => setTechnicians(r.data));
  }, [isAdmin]);

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await api.post('/maintenance', form); onSaved(); }
    catch (err) { setError(err.response?.data?.error || 'Failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">LOG MAINTENANCE TICKET</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Equipment *</label>
            <select className="form-control" value={form.equipmentId} onChange={e => setForm(f => ({ ...f, equipmentId: e.target.value }))} required>
              <option value="">— Select equipment —</option>
              {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.emoji} {eq.name} ({eq.status})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Issue Summary *</label>
            <input className="form-control" value={form.issue} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))} required placeholder="e.g. Hydraulic pressure low" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed description of the issue..." />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Estimated Cost (₹)</label>
              <input type="number" className="form-control" value={form.estimatedCost} onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))} placeholder="5000" />
            </div>
          </div>
          {technicians.length > 0 && (
            <div className="form-group">
              <label>Assign Technician</label>
              <select className="form-control" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                <option value="">— Unassigned —</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          {error && <div className="auth-error">⚠ {error}</div>}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Log Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const { isAdminOrManager } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/maintenance${params}`);
      setTickets(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const resolve = async (id) => {
    const resolution = window.prompt('Enter resolution notes:');
    if (!resolution) return;
    setUpdating(id);
    try { await api.put(`/maintenance/${id}`, { status: 'completed', resolution }); fetchTickets(); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setUpdating(null); }
  };

  const startWork = async (id) => {
    setUpdating(id);
    try { await api.put(`/maintenance/${id}`, { status: 'in_progress' }); fetchTickets(); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">MAINTENANCE</h1>
          <div className="page-sub">{tickets.length} tickets</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Log Issue</button>
      </div>

      <div className="filter-bar">
        {['','pending','in_progress','completed'].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter(s)}>
            {s ? s.replace('_',' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : tickets.length === 0 ? (
          <div className="empty-state"><div className="icon">🔧</div><p>No maintenance tickets</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Ticket</th><th>Equipment</th><th>Issue</th><th>Assigned To</th><th>Priority</th><th>Est. Cost</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td className="td-mono">#{t.ticketId}</td>
                    <td>{t.equipment?.emoji} {t.equipment?.name}</td>
                    <td style={{ maxWidth: 180 }}>{t.issue}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{t.assignee?.name || '—'}</td>
                    <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                      {t.estimatedCost ? `₹${Number(t.estimatedCost).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td><span className={`badge badge-${t.status}`}>{t.status.replace('_',' ')}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {t.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" disabled={updating === t.id} onClick={() => startWork(t.id)}>
                            {updating === t.id ? '...' : '▶ Start'}
                          </button>
                        )}
                        {t.status === 'in_progress' && (
                          <button className="btn btn-success btn-sm" disabled={updating === t.id} onClick={() => resolve(t.id)}>
                            {updating === t.id ? '...' : '✓ Resolve'}
                          </button>
                        )}
                        {t.status === 'completed' && (
                          <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'DM Mono, monospace' }}>
                            ✓ Done {t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString('en-IN') : ''}
                          </span>
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

      {showModal && <MaintenanceModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchTickets(); }} />}
    </div>
  );
}
