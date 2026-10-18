import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 32, textAlign: 'center' }}>
      <div style={{
        fontSize: 96, fontWeight: 800, lineHeight: 1,
        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: 16,
      }}>404</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Page Not Found</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 420, marginBottom: 28, lineHeight: 1.6 }}>
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
