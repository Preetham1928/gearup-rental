import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f7f3ff, #fce7f3)',
      fontFamily: 'Nunito, sans-serif', textAlign: 'center', padding: 20
    }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🎒</div>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 48, color: '#7c3aed', marginBottom: 8 }}>404</h1>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#6b7280', marginBottom: 24 }}>
        Oops! This page doesn't exist.
      </p>
      <Link to="/" style={{
        background: '#7c3aed', color: '#fff', padding: '12px 28px',
        borderRadius: 99, fontWeight: 800, fontSize: 15,
        textDecoration: 'none'
      }}>
        🏠 Go Home
      </Link>
    </div>
  );
}