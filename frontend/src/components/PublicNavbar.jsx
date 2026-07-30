import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicNavbar({ isDarkMode, toggleDarkMode, lang, setLang }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, profile } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStart = () => {
    if (token) {
      if (profile && profile.onboarding_done) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } else {
      navigate('/register');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed top-0 left-0 w-full z-[100] pt-4 px-4 sm:px-6 pointer-events-none flex justify-center">
      <header className={`pointer-events-auto w-full max-w-6xl transition-all duration-300 rounded-2xl border ${scrolled ? 'bg-background/80 backdrop-blur-xl shadow-lg border-primary/20 py-2' : 'bg-background/40 backdrop-blur-md border-border/50 py-3 shadow-sm'}`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <GraduationCap className="text-primary h-8 w-8" />
            <span className="font-bold text-xl tracking-tight hidden sm:block">PathSync AI</span>
          </div>
          
          {/* Main Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <button 
              onClick={() => navigate('/')}
              className={`transition-colors hover:text-primary ${isActive('/') ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
            >
              {lang === 'vi' ? 'Trang chủ' : 'Home'}
            </button>
            <button 
              onClick={() => navigate('/features')}
              className={`transition-colors hover:text-primary ${isActive('/features') ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
            >
              {lang === 'vi' ? 'Tính năng' : 'Features'}
            </button>
            <button 
              onClick={() => navigate('/about')}
              className={`transition-colors hover:text-primary ${isActive('/about') ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
            >
              {lang === 'vi' ? 'Về chúng mình' : 'About'}
            </button>
          </nav>
          
          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9"
            >
              {lang === 'vi' ? 'VI' : 'EN'}
            </button>

            <button 
              onClick={toggleDarkMode}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {!token && (
              <button 
                onClick={() => navigate('/login')}
                className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                {lang === 'vi' ? 'Đăng nhập' : 'Login'}
              </button>
            )}

            <button 
              onClick={handleStart}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-sm"
            >
              {lang === 'vi' ? 'Bắt đầu ngay' : 'Get Started'}
            </button>
          </div>
        </div>
        </div>
      </header>
    </div>
  );
}
