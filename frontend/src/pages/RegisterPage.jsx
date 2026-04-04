import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', company: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-screen">
      <div className="auth-grid" />
      <div className="auth-glow" />
      <div className="auth-box slide-up" style={{ width: 480 }}>
        <div className="auth-logo">RENTFORGE</div>
        <div className="auth-tagline">Create your account</div>
        <div className="auth-sub" style={{ marginBottom: 24 }}>Equipment Rental Management System</div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} required placeholder="Your name" />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input name="company" className="form-control" value={form.company} onChange={handleChange} placeholder="Company / Org" />
            </div>
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label>Password *</label>
              <input name="password" type="password" className="form-control" value={form.password} onChange={handleChange} required placeholder="Min 8 chars" minLength={8} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" className="form-control" value={form.phone} onChange={handleChange} placeholder="+91 9999999999" />
            </div>
          </div>
          <div className="form-group">
            <label>Account Type</label>
            <select name="role" className="form-control" value={form.role} onChange={handleChange}>
              <option value="customer">Customer — Rent equipment</option>
              <option value="technician">Technician — Maintenance work</option>
            </select>
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', letterSpacing: '2px' }} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : '→ CREATE ACCOUNT'}
          </button>
        </form>

        <p className="auth-link">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </div>
  );
}
