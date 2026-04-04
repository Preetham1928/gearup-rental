import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function RequestsPage() {
  const { user, isAdminOrManager } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const url = isAdminOrManager() ? '/rentals?status=pending' : '/rentals';
      const res = await api.get(url);
      const data = res.data.data;
      setRentals(isAdminOrManager() ? data : data.filter(r => r.status === 'pending'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [isAdminOrManager]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const act = async (id, status) => {
    setUpdating(id);
    try { await api.put(`/rentals/${id}/status`, { status }); fetchPending(); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdminOrManager() ? 'PENDING REQUESTS' : 'MY REQUESTS'}</h1>
          <div className="page-sub">
            {isAdminOrManager() ? `${rentals.length} awaiting approval` : 'Your submitted rental requests'}
          </div>
        </div>
        {!isAdminOrManager() && (
          <Link to="/rentals" className="btn btn-primary">+ New Request</Link>
        )}
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : rentals.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>{isAdminOrManager() ? 'No pending requests' : 'No requests submitted yet'}</p>
            {!isAdminOrManager() && <Link to="/rentals" className="btn btn-primary">Submit a Request</Link>}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  {isAdminOrManager() && <th>Customer</th>}
                  <th>Equipment</th>
                  <th>Duration</th>
                  <th>Total</th>
                  <th>Purpose</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  {isAdminOrManager() && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rentals.map(r => (
                  <tr key={r.id}>
                    <td className="td-mono">#{r.orderId}</td>
                    {isAdminOrManager() && (
                      <td>
                        <strong>{r.customer?.name}</strong>
                        <br /><span style={{ fontSize: 11, color: 'var(--muted)' }}>{r.customer?.company}</span>
                      </td>
                    )}
                    <td>{r.equipment?.emoji} {r.equipment?.name}</td>
                    <td style={{ fontSize: 12, fontFamily: 'DM Mono, monospace' }}>{r.totalDays} days</td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--accent)' }}>
                      ₹{Number(r.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 150 }}>{r.purpose || '—'}</td>
                    <td style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    {isAdminOrManager() && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success btn-sm" disabled={updating === r.id}
                            onClick={() => act(r.id, 'approved')}>
                            {updating === r.id ? '...' : '✓ Approve'}
                          </button>
                          <button className="btn btn-danger btn-sm" disabled={updating === r.id}
                            onClick={() => act(r.id, 'rejected')}>
                            {updating === r.id ? '...' : '✕'}
                          </button>
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
    </div>
  );
}
