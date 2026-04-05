import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CATEGORIES = [
  { label: 'Laptops', icon: '💻', color: '#7c3aed', bg: '#ede9fe' },
  { label: 'Cameras', icon: '📷', color: '#ec4899', bg: '#fce7f3' },
  { label: 'Gaming', icon: '🎮', color: '#3b82f6', bg: '#dbeafe' },
  { label: 'Books', icon: '📚', color: '#10b981', bg: '#d1fae5' },
  { label: 'Sports', icon: '🏏', color: '#f97316', bg: '#ffedd5' },
  { label: 'Music', icon: '🎵', color: '#8b5cf6', bg: '#ede9fe' },
  { label: 'Events', icon: '🎭', color: '#f43f5e', bg: '#ffe4e6' },
];

export default function DashboardPage() {
  const { user, isAdminOrManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [pendingRentals, setPendingRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rentForm, setRentForm] = useState({ startDate: '', endDate: '', purpose: '' });
  const [summary, setSummary] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const eqRes = await api.get('/equipment?status=available&limit=9').catch(() => null);
        if (eqRes) setEquipment(eqRes.data?.data || []);

        if (isAdminOrManager()) {
          const [statsRes, rentalsRes] = await Promise.all([
            api.get('/reports/overview').catch(() => null),
            api.get('/rentals?status=pending&limit=5').catch(() => null),
          ]);
          if (statsRes) setStats(statsRes.data);
          if (rentalsRes) setPendingRentals(rentalsRes.data?.data || []);
        }
      } finally { setLoading(false); }
    };
    fetchAll();
  }, [isAdminOrManager]);

  useEffect(() => {
    if (selectedItem && rentForm.startDate && rentForm.endDate) {
      const days = Math.ceil((new Date(rentForm.endDate) - new Date(rentForm.startDate)) / 86400000);
      if (days > 0) setSummary({ days, total: days * selectedItem.dailyRate });
      else setSummary(null);
    } else setSummary(null);
  }, [rentForm, selectedItem]);

  const openRent = (item) => {
    setSelectedItem(item);
    setRentForm({ startDate: '', endDate: '', purpose: '' });
    setSummary(null);
    setShowRentModal(true);
  };

  const handleRent = async () => {
    if (!rentForm.startDate || !rentForm.endDate) { alert('Please select dates'); return; }
    setSaving(true);
    try {
      await api.post('/rentals', {
        equipmentId: selectedItem.id,
        startDate: rentForm.startDate,
        endDate: rentForm.endDate,
        purpose: rentForm.purpose
      });
      setShowRentModal(false);
      setSuccessMsg(`✅ ${selectedItem.name} rented successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      // Refresh equipment list
      const eqRes = await api.get('/equipment?status=available&limit=9');
      setEquipment(eqRes.data?.data || []);
    } catch (e) { alert(e.response?.data?.error || 'Failed to rent'); }
    finally { setSaving(false); }
  };

  const updateRentalStatus = async (id, status) => {
    try {
      await api.put(`/rentals/${id}/status`, { status });
      setPendingRentals(prev => prev.filter(r => r.id !== id));
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  return (
    <div className="fade-in">

      {/* Success Message */}
      {successMsg && (
        <div style={{
          background: '#d1fae5', border: '2px solid #10b981',
          borderRadius: 16, padding: '14px 20px', marginBottom: 20,
          fontWeight: 800, color: '#065f46', fontSize: 15
        }}>
          {successMsg}
        </div>
      )}

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
        borderRadius: 24, padding: '32px 36px', marginBottom: 28,
        color: '#fff', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', fontSize: 100, opacity: 0.15 }}>🎒</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Hey {user?.name?.split(' ')[0]}! 👋
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, opacity: 0.9, marginBottom: 20 }}>
          {user?.role === 'customer' ? 'What do you want to rent today?' : `Managing GearUp · ${user?.role}`}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/equipment" className="btn" style={{ background: '#fff', color: '#7c3aed', fontWeight: 800 }}>🔍 Browse All Gear</Link>
          <Link to="/rentals" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}>📦 My Rentals</Link>
        </div>
      </div>

      {/* Stats — admin/manager only */}
      {isAdminOrManager() && stats && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Gear', val: stats.equipment?.total, icon: '🎒', color: '#7c3aed', bg: '#ede9fe', change: `${stats.equipment?.available} available` },
            { label: 'Active Rentals', val: stats.rentals?.active, icon: '📦', color: '#3b82f6', bg: '#dbeafe', change: `${stats.rentals?.pending} pending` },
            { label: 'Users', val: stats.totalUsers, icon: '👥', color: '#10b981', bg: '#d1fae5', change: `${stats.rentals?.completed} completed` },
            { label: 'Revenue', val: fmt(stats.totalRevenue), icon: '💰', color: '#f97316', bg: '#ffedd5', change: `${stats.openMaintenanceTickets} open tickets`, small: true },
          ].map((s, i) => (
            <div key={i} className="stat-card slide-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="bg-blob" style={{ background: s.color }} />
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-val" style={{ fontSize: s.small ? 26 : 36, color: s.color }}>{s.val ?? '—'}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-change" style={{ color: s.color }}>{s.change}</div>
            </div>
          ))}
        </div>
      )}

      {/* Categories */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, marginBottom: 14 }}>Browse by Category</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <Link to={`/equipment?category=${c.label.toLowerCase()}`} key={c.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 99,
                background: c.bg, color: c.color,
                fontWeight: 800, fontSize: 14,
                textDecoration: 'none',
                border: `2px solid ${c.bg}`,
                transition: 'all .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: 18 }}>{c.icon}</span> {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Available Gear — with Rent Now button */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20 }}>✨ Available Gear</h2>
          <Link to="/equipment" className="btn btn-ghost btn-sm">View All →</Link>
        </div>

        {equipment.length === 0
          ? (
            <div className="empty-state panel">
              <div className="icon">🎒</div>
              <p>No equipment available right now</p>
              <Link to="/equipment" className="btn btn-primary btn-sm">+ List an Item</Link>
            </div>
          )
          : (
            <div className="grid-3">
              {equipment.map(eq => (
                <div key={eq.id} className="panel"
                  style={{ overflow: 'hidden', transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,58,237,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>

                  <div style={{ background: 'linear-gradient(135deg,#f7f3ff,#fce7f3)', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50 }}>
                    {eq.emoji}
                  </div>

                  <div style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: '#1e1b4b' }}>{eq.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#7c3aed' }}>
                          ₹{Number(eq.dailyRate).toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>/day</span>
                      </div>
                      <span className="badge badge-available">Available</span>
                    </div>

                    {/* Rent Now button — works directly from home page */}
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => openRent(eq)}
                    >
                      🛒 Rent Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Pending Requests — admin/manager */}
      {isAdminOrManager() && pendingRentals.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">⏳ Pending Requests</span>
            <span className="badge badge-pending">{pendingRentals.length} waiting</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Order</th><th>Customer</th><th>Item</th><th>Days</th><th>Amount</th><th>Actions</th></tr></thead>
                <tbody>
                  {pendingRentals.map(r => (
                    <tr key={r.id}>
                      <td style={{ color: '#7c3aed', fontWeight: 800 }}>#{r.orderId}</td>
                      <td>{r.customer?.name}</td>
                      <td>{r.equipment?.emoji} {r.equipment?.name}</td>
                      <td>{r.totalDays}d</td>
                      <td style={{ fontWeight: 800 }}>{fmt(r.totalAmount)}</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-xs" onClick={() => updateRentalStatus(r.id, 'approved')}>✓ Approve</button>
                        <button className="btn btn-danger btn-xs" onClick={() => updateRentalStatus(r.id, 'rejected')}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rent Now Modal */}
      {showRentModal && selectedItem && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRentModal(false)}>
          <div className="modal">
            <div className="modal-title">🛒 Rent — {selectedItem.emoji} {selectedItem.name}</div>

            <div style={{ background: 'linear-gradient(135deg,#f7f3ff,#fce7f3)', borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 48 }}>{selectedItem.emoji}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedItem.name}</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#7c3aed' }}>
                  ₹{Number(selectedItem.dailyRate).toLocaleString('en-IN')}
                  <span style={{ fontFamily: 'Nunito,sans-serif', fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>/day</span>
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label>📅 Start Date</label>
                <input type="date" className="form-control" value={rentForm.startDate}
                  onChange={e => setRentForm(f => ({ ...f, startDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label>📅 End Date</label>
                <input type="date" className="form-control" value={rentForm.endDate}
                  onChange={e => setRentForm(f => ({ ...f, endDate: e.target.value }))}
                  min={rentForm.startDate || new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div className="form-group">
              <label>📝 Purpose</label>
              <input className="form-control" value={rentForm.purpose}
                onChange={e => setRentForm(f => ({ ...f, purpose: e.target.value }))}
                placeholder="e.g. College project, Sports tournament..." />
            </div>

            {summary && (
              <div style={{ background: '#f7f3ff', borderRadius: 16, padding: 16, marginBottom: 8, border: '2px solid #ede9fe' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#7c3aed', marginBottom: 8 }}>📋 Rental Summary</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>
                  <span>Duration</span><span>{summary.days} day{summary.days > 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>
                  <span>Rate</span><span>₹{Number(selectedItem.dailyRate).toLocaleString('en-IN')}/day</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#7c3aed', borderTop: '2px solid #ede9fe', paddingTop: 8 }}>
                  <span>TOTAL</span><span>₹{Number(summary.total).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRentModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRent} disabled={saving}>
                {saving ? 'Booking...' : '🚀 Confirm Rental'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}