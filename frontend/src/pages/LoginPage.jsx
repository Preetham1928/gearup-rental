import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const DEMO = [
  { role: 'Admin',      email: 'admin@gearup.io',   clr: '#ef4444', icon: '⚙️' },
  { role: 'Manager',    email: 'manager@gearup.io', clr: '#f97316', icon: '📋' },
  { role: 'Customer',   email: 'priya@college.edu', clr: '#7c3aed', icon: '🎒' },
  { role: 'Technician', email: 'jordan@gearup.io',  clr: '#10b981', icon: '🔧' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'priya@college.edu', password: 'password123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Login failed. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-screen">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />
      <div className="auth-box">
        <div className="auth-logo">GearUp 🎒</div>
        <div className="auth-tagline">Your campus rental platform — rent anything, anytime!</div>

        <p className="demo-label">✨ Quick login</p>
        <div className="demo-row">
          {DEMO.map(d => (
            <button key={d.role} className="demo-pill" style={{ '--clr': d.clr }}
              onClick={() => setForm({ email: d.email, password: 'password123' })}>
              {d.icon} {d.role}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>📧 Email</label>
            <input name="email" type="email" className="form-control"
              value={form.email} onChange={handleChange} required placeholder="you@college.edu" />
          </div>
          <div className="form-group">
            <label>🔒 Password</label>
            <input name="password" type="password" className="form-control"
              value={form.password} onChange={handleChange} required placeholder="••••••••" />
          </div>
          {error && <div className="auth-error">⚠️ {error}</div>}
          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: 15 }} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : "🚀 Let's Go!"}
          </button>
        </form>

        <p className="auth-link">New here? <Link to="/register">Create account →</Link></p>
      </div>
    </div>
  );
}
