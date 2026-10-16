import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import RegisterCertificate from './pages/RegisterCertificate';
import VerifyCertificate from './pages/VerifyCertificate';
import Records from './pages/Records';
import CertificateDetail from './pages/CertificateDetail';
import AboutProject from './pages/AboutProject';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          background: 'var(--color-navy-950)',
        }}>
          <Sidebar />
          <main style={{
            flex: 1,
            overflowX: 'hidden',
            overflowY: 'auto',
            minHeight: '100vh',
            background: `
              radial-gradient(ellipse at 20% 0%, rgba(79,110,247,0.07) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 100%, rgba(45,212,191,0.05) 0%, transparent 60%),
              var(--color-navy-950)
            `,
          }}>
            <Routes>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/register"   element={<RegisterCertificate />} />
              <Route path="/verify"     element={<VerifyCertificate />} />
              <Route path="/records"    element={<Records />} />
              <Route path="/records/:id" element={<CertificateDetail />} />
              <Route path="/about"      element={<AboutProject />} />
              <Route path="/404"        element={<NotFound />} />
              <Route path="*"           element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
