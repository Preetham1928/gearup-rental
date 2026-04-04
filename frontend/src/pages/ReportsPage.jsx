import React, { useEffect, useState } from 'react';
import api from '../api';

export default function ReportsPage() {
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topEquip, setTopEquip] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/overview'),
      api.get('/reports/revenue'),
      api.get('/reports/top-equipment'),
      api.get('/reports/activity'),
    ]).then(([ov, rev, top, act]) => {
      setOverview(ov.data);
      setRevenue(rev.data);
      setTopEquip(top.data);
      setActivity(act.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  const maxRev = Math.max(...revenue.map(r => r.revenue), 1);
  const maxEquipRev = Math.max(...topEquip.map(e => Number(e.totalRevenue)), 1);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">REPORTS & ANALYTICS</h1>
          <div className="page-sub">Business intelligence overview</div>
        </div>
        <button className="btn btn-ghost" onClick={() => window.print()}>⬇ Export</button>
      </div>

      {/* KPI Grid */}
      {overview && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card orange">
            <div className="stat-icon">🏗️</div>
            <div className="stat-val">{overview.equipment.total}</div>
            <div className="stat-label">Total Fleet</div>
            <div className="stat-change" style={{ color: 'var(--muted)' }}>{overview.equipment.available} available</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon">📦</div>
            <div className="stat-val">{overview.rentals.total}</div>
            <div className="stat-label">Total Rentals</div>
            <div className="stat-change" style={{ color: 'var(--muted)' }}>{overview.rentals.active} active now</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">💰</div>
            <div className="stat-val" style={{ fontSize: 28 }}>₹{(overview.totalRevenue / 100000).toFixed(1)}L</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon">👥</div>
            <div className="stat-val">{overview.totalUsers}</div>
            <div className="stat-label">Active Users</div>
            <div className="stat-change" style={{ color: 'var(--muted)' }}>{overview.openMaintenanceTickets} open tickets</div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Revenue Chart */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">MONTHLY REVENUE</div>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130 }}>
              {revenue.map((r, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>
                    {r.revenue > 0 ? `₹${(r.revenue/1000).toFixed(0)}K` : ''}
                  </span>
                  <div style={{ width: '100%', height: `${Math.max(4, (r.revenue / maxRev) * 100)}px`, background: i === revenue.length - 1 ? 'var(--accent)' : 'rgba(244,161,26,0.4)', transition: 'height .5s ease' }} title={`₹${r.revenue.toLocaleString('en-IN')}`} />
                  <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' }}>{r.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rental breakdown */}
        {overview && (
          <div className="panel">
            <div className="panel-header"><div className="panel-title">RENTAL STATUS BREAKDOWN</div></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Completed', val: overview.rentals.completed, color: 'var(--success)' },
                { label: 'Active', val: overview.rentals.active, color: 'var(--info)' },
                { label: 'Pending', val: overview.rentals.pending, color: 'var(--warning)' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, fontFamily: 'DM Mono, monospace' }}>
                    <span style={{ color: 'var(--muted)' }}>{item.label}</span>
                    <span>{item.val} ({overview.rentals.total ? Math.round((item.val / overview.rentals.total) * 100) : 0}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${overview.rentals.total ? (item.val / overview.rentals.total) * 100 : 0}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Equipment */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header"><div className="panel-title">TOP PERFORMING EQUIPMENT</div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Equipment</th><th>Total Rentals</th><th>Revenue</th><th>Utilization</th></tr></thead>
            <tbody>
              {topEquip.map(eq => (
                <tr key={eq.id}>
                  <td>{eq.emoji} <strong>{eq.name}</strong> <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>({eq.equipmentId})</span></td>
                  <td>{eq.totalRentals}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', color: 'var(--accent)' }}>₹{Number(eq.totalRevenue).toLocaleString('en-IN')}</td>
                  <td style={{ width: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${(Number(eq.totalRevenue) / maxEquipRev) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--muted)', width: 36 }}>
                        {Math.round((Number(eq.totalRevenue) / maxEquipRev) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log from MongoDB */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">ACTIVITY LOG</div>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>MongoDB · Last 50 events</span>
        </div>
        {activity.length === 0 ? (
          <div className="empty-state"><div className="icon">📡</div><p>No activity logs (MongoDB may be offline)</p></div>
        ) : (
          <div className="panel-body" style={{ padding: 0 }}>
            <table>
              <thead><tr><th>Action</th><th>User</th><th>Role</th><th>Resource</th><th>Time</th></tr></thead>
              <tbody>
                {activity.slice(0, 20).map((log, i) => (
                  <tr key={i}>
                    <td><span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{log.action}</span></td>
                    <td style={{ fontSize: 13 }}>{log.userName}</td>
                    <td><span className={`badge badge-${log.userRole}`}>{log.userRole}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>{log.resourceType || '—'}</td>
                    <td style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' }}>
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
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
