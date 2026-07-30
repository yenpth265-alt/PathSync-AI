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
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';
import PublicNavbar from './components/PublicNavbar';
import { AuthProvider, useAuth } from './context/AuthContext';

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
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (profile && profile.onboarding_done !== true && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (profile && profile.onboarding_done === true && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
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
              <DashboardPage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/applications" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <ApplicationsPage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/documents" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <DocumentsPage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/explore" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <ExplorePage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/universities" element={<Navigate to="/explore" replace />} />
        
        <Route path="/essay-copilot" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <EssayCopilotPage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/smart-match" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <SmartMatchPage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <ProfilePage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/persona-lab" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <PersonaLabPage />
            </motion.div>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppLayout() {
  const { token, loading } = useAuth();
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  const [lang, setLang] = useState('vi');

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
    return <div className="loading-screen">Loading PathSync AI...</div>;
  }

  const dashboardRoutes = ['/dashboard', '/applications', '/documents', '/explore', '/essay-copilot', '/smart-match', '/profile', '/persona-lab', '/universities'];
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
      <Sidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
