import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import DocumentsPage from './pages/DocumentsPage';
import ExplorePage from './pages/ExplorePage';
import EssayCopilotPage from './pages/EssayCopilotPage';
import SmartMatchPage from './pages/SmartMatchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import PersonaLabPage from './pages/PersonaLabPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';
import UniversitiesPage from './pages/UniversitiesPage';
import MentorDashboardPage from './pages/MentorDashboardPage';
import MicroSimulationPage from './pages/MicroSimulationPage';
import PublicNavbar from './components/PublicNavbar';
import AnimatedBackground from './components/AnimatedBackground';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './context/useAuth';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const BackgroundEffects = () => (
  <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
    <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-blue-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-primary gap-4">
      <Loader2 className="h-10 w-10 animate-spin" />
      <p className="text-sm font-medium animate-pulse">Đang tải...</p>
    </div>
  );
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-primary gap-4">
      <Loader2 className="h-10 w-10 animate-spin" />
      <p className="text-sm font-medium animate-pulse">Đang tải hồ sơ...</p>
    </div>
  );
  const onboardingComplete = Boolean(profile.onboarding_done);

  if (!onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingComplete && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-primary">
      <Loader2 className="h-10 w-10 animate-spin" />
    </div>
  );
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Route transitions used to be wrapped in AnimatePresence (mode="wait") with
// a per-route motion.div and `key={location.pathname}` on <Routes> — the
// textbook react-router + framer-motion recipe. In production it left every
// client-side navigation stuck: the URL changed but the previously rendered
// page never swapped out (confirmed by comparing a sidebar click against a
// hard reload of the same URL, which rendered correctly). A full page
// reload always worked, so routing itself is fine — only the animated
// transition wrapper was breaking the swap. Plain <Routes> guarantees
// navigation actually renders the matched route; a fade transition is a
// nice-to-have, working navigation is not optional.
function AnimatedRoutes({ isDarkMode, toggleDarkMode, lang, setLang }) {
  return (
    <Routes>
      <Route path="/" element={<LandingPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />} />
      <Route path="/universities" element={
        <ProtectedRoute>
          <UniversitiesPage lang={lang} />
        </ProtectedRoute>
      } />
      <Route path="/features" element={<FeaturesPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />} />
      <Route path="/about" element={<AboutPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />} />

      <Route path="/login" element={
        <PublicRoute>
          <LoginPage lang={lang} setLang={setLang} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage lang={lang} setLang={setLang} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        </PublicRoute>
      } />

      <Route path="/onboarding" element={
        <ProtectedRoute>
          <OnboardingPage />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage lang={lang} />
        </ProtectedRoute>
      } />
      <Route path="/applications" element={
        <ProtectedRoute>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <ApplicationsPage lang={lang} />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute>
          <DocumentsPage lang={lang} />
        </ProtectedRoute>
      } />
      <Route path="/explore" element={
        <ProtectedRoute>
          <ExplorePage lang={lang} />
        </ProtectedRoute>
      } />

      <Route path="/essay-copilot" element={
        <ProtectedRoute>
          <EssayCopilotPage lang={lang} />
        </ProtectedRoute>
      } />
      <Route path="/smart-match" element={
        <ProtectedRoute>
          <SmartMatchPage lang={lang} />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage lang={lang} />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboardPage lang={lang} />
        </ProtectedRoute>
      } />
      <Route path="/persona-lab" element={
        <ProtectedRoute>
          <PersonaLabPage lang={lang} />
        </ProtectedRoute>
      } />
      <Route path="/mentor" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorDashboardPage lang={lang} />
        </ProtectedRoute>
      } />
      <Route path="/mock-interview" element={
        <ProtectedRoute>
          <MicroSimulationPage lang={lang} />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppLayout() {
  const { loading } = useAuth();
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('lang') || 'vi';
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-sm font-medium animate-pulse">Loading PathSync AI...</p>
      </div>
    );
  }

  const dashboardRoutes = ['/dashboard', '/applications', '/documents', '/explore', '/essay-copilot', '/smart-match', '/profile', '/persona-lab', '/universities', '/admin', '/mentor', '/mock-interview', '/agent-stream'];
  const isDashboardRoute = dashboardRoutes.some(route => location.pathname.startsWith(route));
  const isFullPage = !isDashboardRoute;
  const isPublicPage = ['/', '/features', '/about'].includes(location.pathname);

  if (isFullPage) {
    return (
      <div className={`${isDarkMode ? 'dark-mode' : ''} min-h-screen bg-background text-foreground relative flex flex-col`}>
        {isPublicPage && <BackgroundEffects />}
        {isPublicPage && (
          <PublicNavbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />
        )}
        <AnimatedRoutes isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />
      </div>
    );
  }

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''} min-h-screen flex bg-background text-foreground relative overflow-hidden`}>
      <AnimatedBackground variant="subtle" />
      <Sidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />
      <main className="main-content">
        <div className="content-wrapper">
          <AnimatedRoutes isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}
