import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Loader2, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { startDemo } from '../services/demoStore';
import AnimatedBackground from '../components/AnimatedBackground';
import './LoginPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function LoginPage({ lang = 'vi', setLang, isDarkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (lang === 'vi' ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại!' : 'Login failed. Please check your credentials!'));
      }

      // Save token and jump to dashboard using AuthContext
      login(data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Không thể kết nối đến Backend. Vui lòng kiểm tra lại hệ thống!');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = () => {
    startDemo();
    login('pathsync-demo-token');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="auth-container relative">
      <AnimatedBackground variant="hero" />
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button 
          onClick={() => setLang && setLang(lang === 'vi' ? 'en' : 'vi')}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-black/10 dark:hover:bg-white/10 h-9 w-9"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          {lang === 'vi' ? 'VI' : 'EN'}
        </button>
        <button 
          onClick={toggleDarkMode}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-black/10 dark:hover:bg-white/10 h-9 w-9"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <div className="auth-logo">
            <div className="icon-container">
              <GraduationCap size={28} color="#fff" />
            </div>
            PathSync AI
          </div>
          <h1 className="auth-title">{lang === 'vi' ? 'Chào mừng trở lại' : 'Welcome back'}</h1>
          <p className="auth-subtitle">{lang === 'vi' ? 'Đăng nhập vào tài khoản của bạn để tiếp tục' : 'Sign in to your account to continue'}</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-error">
            {error}
          </motion.div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>{lang === 'vi' ? 'Địa chỉ Email' : 'Email address'}</label>
            <input 
              type="email" 
              className="auth-input" 
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="auth-input-group">
            <label>{lang === 'vi' ? 'Mật khẩu' : 'Password'}</label>
            <input 
              type="password" 
              className="auth-input" 
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <div className="auth-options">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" /> {lang === 'vi' ? 'Nhớ mật khẩu' : 'Remember me'}
            </label>
            <a href="#" className="auth-link">{lang === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}</a>
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (lang === 'vi' ? 'Đăng nhập' : 'Sign In')}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          {lang === 'vi' ? 'Chưa có tài khoản?' : "Don't have an account?"} <Link to="/register" className="auth-link">{lang === 'vi' ? 'Đăng ký ngay' : 'Sign up'}</Link>
        </div>
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button type="button" onClick={handleDemo} className="auth-link" style={{ background: 'none', border: 0, cursor: 'pointer' }}>
            {lang === 'vi' ? 'Khám phá workspace mẫu (không cần tài khoản)' : 'Explore a sample workspace (no account needed)'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
