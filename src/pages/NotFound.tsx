import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 32, textAlign: 'center' }}>
      <div style={{
        fontSize: 96, fontWeight: 800, lineHeight: 1,
        background: 'linear-gradient(135deg, #1e3a70, #0f2040)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: 16,
      }}>404</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Page Not Found</h1>
      <p style={{ fontSize: 14, color: '#334155', maxWidth: 400, marginBottom: 28 }}>
        The page you're looking for doesn't exist. It may have been moved or you followed a broken link.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
          <Home size={14} />
          Go to Dashboard
        </Link>
        <Link to="/verify" className="btn-secondary" style={{ textDecoration: 'none' }}>
          <Search size={14} />
          Verify Certificate
        </Link>
      </div>
    </div>
  );
}
