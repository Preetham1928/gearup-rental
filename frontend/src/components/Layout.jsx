import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const ROLE_COLORS = { admin: '#ef4444', manager: '#f97316', customer: '#7c3aed', technician: '#10b981' };

// CI/CD and Monitoring are REMOVED from all roles
const NAV_ITEMS = [
  { path: '/',            label: 'Home',         icon: '🏠', exact: true, roles: ['admin','manager','customer','technician'] },
  { path: '/equipment',   label: 'Browse Gear',  icon: '🎒', roles: ['admin','manager','customer','technician'] },
  { path: '/rentals',     label: 'My Rentals',   icon: '📦', roles: ['admin','manager','customer'] },
  { path: '/requests',    label: 'Requests',     icon: '📋', roles: ['admin','manager','customer'] },
  { path: '/maintenance', label: 'Maintenance',  icon: '🔧', roles: ['admin','manager','technician'] },
  { path: '/reports',     label: 'Reports',      icon: '📊', roles: ['admin','manager'] },
  { path: '/users',       label: 'Users',        icon: '👥', roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const avatarColor = ROLE_COLORS[user?.role] || '#7c3aed';
  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(user?.role));

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="burger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
        <div className="topbar-logo">GearUp 🎒</div>
        <div className="topbar-tagline">Campus Rental Platform</div>
        <div className="topbar-right">
          <div className="user-chip">
            <div className="user-avatar" style={{ background: avatarColor }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="user-name">{user?.name?.split(' ')[0]}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-section">Menu</div>
        {visibleNav.map(item => (
          <NavLink key={item.path} to={item.path} end={item.exact}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        <div className="page-wrapper slide-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
