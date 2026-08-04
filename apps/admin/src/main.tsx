import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from './public/PublicLayout';
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { SupportPage } from './pages/public/SupportPage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsPage } from './pages/public/TermsPage';
import { DeleteAccountPage } from './pages/public/DeleteAccountPage';
import { ImpressumPage } from './pages/public/ImpressumPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import './styles/global.css';
import './styles/public.css';

// Keep Supabase/admin code out of the public bundle's initial execution path.
// This lets public/legal pages render even when an admin-specific VITE_* value
// is temporarily missing or misconfigured during deployment.
const AdminApp = lazy(() => import('./AdminApp'));

function AdminLoader() {
  return (
    <Suspense fallback={<div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading DeutschFlow Admin…</div>}>
      <AdminApp />
    </Suspense>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/delete-account" element={<DeleteAccountPage />} />
          <Route path="/account-deletion" element={<Navigate to="/delete-account" replace />} />
          <Route path="/impressum" element={<ImpressumPage />} />
        </Route>

        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        {['languages', 'courses', 'chapters', 'vocabulary', 'notes', 'videos', 'quiz', 'taxonomy', 'lid', 'media', 'settings'].map((path) => (
          <Route key={path} path={`/${path}`} element={<Navigate to={`/admin/${path}`} replace />} />
        ))}

        <Route path="/admin/*" element={<AdminLoader />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
