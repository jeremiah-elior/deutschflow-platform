import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { PublicLayout } from './public/PublicLayout';
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { SupportPage } from './pages/public/SupportPage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsPage } from './pages/public/TermsPage';
import { DeleteAccountPage } from './pages/public/DeleteAccountPage';
import { ImpressumPage } from './pages/public/ImpressumPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LanguagesPage } from './pages/LanguagesPage';
import { CoursesPage } from './pages/CoursesPage';
import { ChaptersPage } from './pages/ChaptersPage';
import { VocabularyPage } from './pages/VocabularyPage';
import { NotesPage } from './pages/NotesPage';
import { VideosPage } from './pages/VideosPage';
import { QuizPage } from './pages/QuizPage';
import { TaxonomyPage } from './pages/TaxonomyPage';
import { LiDPage } from './pages/LiDPage';
import { MediaPage } from './pages/MediaPage';
import { SettingsPage } from './pages/SettingsPage';
import './styles/global.css';
import './styles/public.css';

function AdminAuthBoundary() {
  return <AuthProvider><Outlet /></AuthProvider>;
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
        <Route path="/admin" element={<AdminAuthBoundary />}>
          <Route path="login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="languages" element={<LanguagesPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="chapters" element={<ChaptersPage />} />
            <Route path="vocabulary" element={<VocabularyPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="videos" element={<VideosPage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="taxonomy" element={<TaxonomyPage />} />
            <Route path="lid" element={<LiDPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
