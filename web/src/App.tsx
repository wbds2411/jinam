import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard.js';
import { useUserStore } from './stores/userStore.js';

const MainPage = lazy(() => import('./pages/MainPage.js'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.js'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.js'));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage.js'));
const LegalPage = lazy(() => import('./pages/LegalPage.js'));

/** 설정의 테마/모션 감소를 실제 DOM에 반영한다 (darkMode: 'class'). */
function ThemeApplier() {
  const { theme, reducedMotion } = useUserStore(s => s.settings);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark' || theme === 'night-soothing');
    root.classList.toggle('theme-night', theme === 'night-soothing');
    root.classList.toggle('reduce-motion', reducedMotion);
  }, [theme, reducedMotion]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <ThemeApplier />
        <Suspense fallback={<div role="status" className="p-6 text-center text-sm">화면을 준비하고 있어요…</div>}>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthGuard>
    </BrowserRouter>
  );
}

export default App;
