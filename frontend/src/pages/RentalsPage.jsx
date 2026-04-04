import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function NewRentalModal({ onClose, onSaved }) {
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState({ equipmentId: '', startDate: '', endDate: '', purpose: '' });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/equipment?status=available').then(r => setEquipment(r.data.data));
  }, []);

  useEffect(() => {
    if (form.equipmentId && form.startDate && form.endDate) {
      const eq = equipment.find(e => e.id === form.equipmentId);
      if (eq) {
        const days = Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000);
        if (days > 0) setPreview({ days, amount: days * eq.dailyRate, name: eq.name, rate: eq.dailyRate });
        else setPreview(null);
      }
    }
  }, [form, equipment]);

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await api.post('/rentals', form); onSaved(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to create rental.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">NEW RENTAL ORDER</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Equipment *</label>
            <select className="form-control" value={form.equipmentId} onChange={e => setForm(f => ({ ...f, equipmentId: e.target.value }))} required>
              <option value="">— Choose available equipment —</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.emoji} {eq.name} — ₹{Number(eq.dailyRate).toLocaleString('en-IN')}/day</option>
              ))}
            </select>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" className="form-control" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input type="date" className="form-control" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required min={form.startDate} />
            </div>
          </div>
          <div className="form-group">
            <label>Purpose / Notes</label>
            <textarea className="form-control" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Construction site, project name..." />
          </div>

          {preview && (
            <div style={{ background: 'rgba(244,161,26,.08)', border: '1px solid rgba(244,161,26,.2)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>RENTAL SUMMARY</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{preview.name}</span>
                <span>₹{Number(preview.rate).toLocaleString('en-IN')}/day × {preview.days} days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'Bebas Neue, cursive', fontSize: 22, color: 'var(--accent)' }}>
                <span>TOTAL</span>
                <span>₹{Number(preview.amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {error && <div className="auth-error">⚠ {error}</div>}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !preview}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '→ Submit Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RentalsPage() {
  const { user, isAdminOrManager } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(null);

  const fetchRentals = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/rentals${params}`);
      setRentals(res.data.data); setTotal(res.data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchRentals(); }, [fetchRentals]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try { await api.put(`/rentals/${id}/status`, { status }); fetchRentals(); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setUpdating(null); }
  };

  const NEXT_ACTIONS = {
    pending: isAdminOrManager() ? [{ label: '✓ Approve', status: 'approved', cls: 'btn-success' }, { label: '✕ Reject', status: 'rejected', cls: 'btn-danger' }] : [],
    approved: isAdminOrManager() ? [{ label: '▶ Activate', status: 'active', cls: 'btn-primary' }] : [],
    active: isAdminOrManager() ? [{ label: '✓ Complete', status: 'completed', cls: 'btn-success' }] : [],
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">RENTAL ORDERS</h1>
          <div className="page-sub">{total} total orders</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Rental</button>
      </div>

      <div className="filter-bar">
        {['','pending','approved','active','completed','rejected','cancelled'].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : rentals.length === 0 ? (
          <div className="empty-state"><div className="icon">📦</div><p>No rentals found</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create First Rental</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  {isAdminOrManager() && <th>Customer</th>}
                  <th>Equipment</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Amount</th>
                  <th>Status</th>
                  {isAdminOrManager() && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rentals.map(r => (
                  <tr key={r.id}>
                    <td className="td-mono">#{r.orderId}</td>
                    {isAdminOrManager() && <td>{r.customer?.name || '—'}<br /><span style={{ fontSize: 11, color: 'var(--muted)' }}>{r.customer?.company}</span></td>}
                    <td>{r.equipment?.emoji} {r.equipment?.name}</td>
                    <td style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' }}>
                      {r.startDate}<br />→ {r.endDate}
                    </td>
                    <td>{r.totalDays}d</td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 13 }}>₹{Number(r.totalAmount).toLocaleString('en-IN')}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    {isAdminOrManager() && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(NEXT_ACTIONS[r.status] || []).map(a => (
                            <button key={a.status} className={`btn btn-sm ${a.cls}`}
                              disabled={updating === r.id}
                              onClick={() => updateStatus(r.id, a.status)}>
                              {updating === r.id ? '...' : a.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <NewRentalModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchRentals(); }} />}
    </div>
  );
}
