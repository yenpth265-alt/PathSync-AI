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

// ProtectedRoute checks if the user is authenticated
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// PublicRoute redirects logged-in users away from auth pages
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <LoginPage />
            </motion.div>
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <RegisterPage />
            </motion.div>
          </PublicRoute>
        } />

        {/* Onboarding is protected but full screen */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
              <OnboardingPage />
            </motion.div>
          </ProtectedRoute>
        } />

        {/* Protected Routes */}
        <Route path="/" element={
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

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth_token'));

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(!!localStorage.getItem('auth_token'));
    };
    window.addEventListener('authStateChanged', handleAuthChange);
    return () => window.removeEventListener('authStateChanged', handleAuthChange);
  }, []);

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

  // If not authenticated or on onboarding page, we don't render the sidebar
  const isAuthPage = !isAuthenticated;
  const isFullPage = isAuthPage || window.location.pathname === '/onboarding';

  if (isFullPage) {
    return (
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
        <Sidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <main className="main-content">
          <div className="content-wrapper">
            <AnimatedRoutes />
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
