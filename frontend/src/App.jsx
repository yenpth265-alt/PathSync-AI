import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
import AgentWorkstreamPage from './pages/AgentWorkstreamPage';
import PublicNavbar from './components/PublicNavbar';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './context/useAuth';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
};

const BackgroundEffects = () => (
  <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
    <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-blue-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
  </div>
);

const ProtectedRoute = ({ children }) => {
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

function AnimatedRoutes({ isDarkMode, toggleDarkMode, lang, setLang }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <LandingPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />
          </motion.div>
        } />
        <Route path="/universities" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <UniversitiesPage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/features" element={
          <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <FeaturesPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />
          </motion.div>
        } />
        <Route path="/about" element={
          <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <AboutPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />
          </motion.div>
        } />

        <Route path="/login" element={
          <PublicRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <LoginPage lang={lang} setLang={setLang} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            </motion.div>
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <RegisterPage lang={lang} setLang={setLang} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            </motion.div>
          </PublicRoute>
        } />

        <Route path="/onboarding" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <OnboardingPage />
            </motion.div>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <DashboardPage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/applications" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <ApplicationsPage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/documents" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <DocumentsPage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/explore" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <ExplorePage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />

        
        <Route path="/essay-copilot" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <EssayCopilotPage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/smart-match" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <SmartMatchPage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <ProfilePage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <AdminDashboardPage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/persona-lab" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <PersonaLabPage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/mentor" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <MentorDashboardPage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/mock-interview" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <MicroSimulationPage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/agent-stream" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <AgentWorkstreamPage lang={lang} />
            </motion.div>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
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
        <BackgroundEffects />
        {isPublicPage && (
          <PublicNavbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />
        )}
        <AnimatedRoutes isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} lang={lang} setLang={setLang} />
      </div>
    );
  }

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''} min-h-screen flex bg-background text-foreground relative overflow-hidden`}>
      <BackgroundEffects />
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
