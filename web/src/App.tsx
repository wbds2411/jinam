import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppStatus } from './components/AppStatus.js';
import { AuthGuard } from './components/AuthGuard.js';
import { lazy, Suspense } from 'react';
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.js'));
import MainPage from './pages/MainPage.js';
import SettingsPage from './pages/SettingsPage.js';

function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <AppStatus />
        <Suspense fallback={<p role="status" className="page">화면을 불러오는 중…</p>}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AuthGuard>
    </BrowserRouter>
  );
}

export default App;
