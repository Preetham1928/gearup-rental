import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CATEGORIES = [
  { label: 'Laptops & Gadgets', icon: '💻', color: '#7c3aed', bg: '#ede9fe' },
  { label: 'Cameras', icon: '📷', color: '#ec4899', bg: '#fce7f3' },
  { label: 'Gaming Gear', icon: '🎮', color: '#3b82f6', bg: '#dbeafe' },
  { label: 'Books & Lab', icon: '📚', color: '#10b981', bg: '#d1fae5' },
  { label: 'Sports', icon: '🏏', color: '#f97316', bg: '#ffedd5' },
  { label: 'Music', icon: '🎵', color: '#8b5cf6', bg: '#ede9fe' },
  { label: 'Events', icon: '🎭', color: '#f43f5e', bg: '#ffe4e6' },
];

export default function DashboardPage() {
  const { user, isAdminOrManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [eqRes, rentRes] = await Promise.all([
          api.get('/equipment?limit=6').catch(() => null),
          isAdminOrManager() ? api.get('/reports/overview').catch(() => null) : null,
        ]);
        if (eqRes) setEquipment(eqRes.data?.data || []);
        if (rentRes) setStats(rentRes.data);

        if (isAdminOrManager()) {
          const pendingRes = await api.get('/rentals?status=pending&limit=5').catch(() => null);
          if (pendingRes) setRentals(pendingRes.data?.data || []);
        }
      } finally { setLoading(false); }
    };
    fetchAll();
  }, [isAdminOrManager]);

  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/rentals/${id}/status`, { status });
      setRentals(prev => prev.filter(r => r.id !== id));
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
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
          {user?.role === 'customer'
            ? 'What do you need to rent today?'
            : `Managing GearUp · ${user?.role}`}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/equipment" className="btn" style={{ background: '#fff', color: '#7c3aed', fontWeight: 800 }}>🔍 Browse Gear</Link>
          {user?.role === 'customer' && <Link to="/rentals" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}>📦 My Rentals</Link>}
        </div>
      </div>

      {/* Stats — admin/manager only */}
      {isAdminOrManager() && stats && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Gear', val: stats.equipment?.total, icon: '🎒', color: '#7c3aed', bg: '#ede9fe', change: `${stats.equipment?.available} available` },
            { label: 'Active Rentals', val: stats.rentals?.active, icon: '📦', color: '#3b82f6', bg: '#dbeafe', change: `${stats.rentals?.pending} pending` },
            { label: 'Students', val: stats.totalUsers, icon: '👥', color: '#10b981', bg: '#d1fae5', change: `${stats.rentals?.completed} completed` },
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
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, marginBottom: 16 }}>Browse by Category</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <Link to={`/equipment?category=${c.label}`} key={c.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 99,
                background: c.bg, color: c.color,
                fontWeight: 800, fontSize: 14,
                textDecoration: 'none',
                border: `2px solid ${c.bg}`,
                transition: 'all .2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: 18 }}>{c.icon}</span> {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Equipment */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20 }}>✨ Featured Gear</h2>
          <Link to="/equipment" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        <div className="grid-3">
          {equipment.slice(0, 6).map(eq => (
            <div key={eq.id} className="panel" style={{ overflow: 'hidden', transition: 'all .2s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,58,237,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ background: 'linear-gradient(135deg, #f7f3ff, #fce7f3)', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                {eq.emoji}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#1e1b4b' }}>{eq.name}</div>
                  <span className={`badge badge-${eq.status}`}>{eq.status}</span>
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#7c3aed' }}>
                  ₹{Number(eq.dailyRate).toLocaleString('en-IN')}
                  <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>/day</span>
                </div>
                {eq.status === 'available' && (
                  <Link to="/rentals" className="btn btn-primary btn-sm" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}>
                    Rent Now →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Requests — admin/manager */}
      {isAdminOrManager() && rentals.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">⏳ Pending Requests</span>
            <span className="badge badge-pending">{rentals.length} waiting</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Order</th><th>Student</th><th>Item</th><th>Days</th><th>Amount</th><th>Actions</th></tr></thead>
                <tbody>
                  {rentals.map(r => (
                    <tr key={r.id}>
                      <td style={{ color: '#7c3aed', fontWeight: 800 }}>#{r.orderId}</td>
                      <td>{r.customer?.name}</td>
                      <td>{r.equipment?.emoji} {r.equipment?.name}</td>
                      <td>{r.totalDays}d</td>
                      <td style={{ fontWeight: 800, color: '#1e1b4b' }}>{fmt(r.totalAmount)}</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-xs" onClick={() => updateStatus(r.id, 'approved')}>✓ Approve</button>
                        <button className="btn btn-danger btn-xs" onClick={() => updateStatus(r.id, 'rejected')}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
