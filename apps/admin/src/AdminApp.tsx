import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
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

function AdminAuthBoundary() {
  return <AuthProvider><Outlet /></AuthProvider>;
}

export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminAuthBoundary />}>
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
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
