import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Loader2, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import './LoginPage.css'; // Reusing the same CSS

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function RegisterPage({ lang = 'vi', setLang, isDarkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (lang === 'vi' ? 'Đăng ký thất bại. Vui lòng kiểm tra lại!' : 'Registration failed. Please try again!'));
      }

      // Automatically login or jump to login page. Let's go to Login page with success state
      navigate('/login');
    } catch (err) {
      if (err instanceof TypeError) {
        console.warn('Backend unavailable or network error, falling back to mock register');
        navigate('/login');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
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
          <h1 className="auth-title">{lang === 'vi' ? 'Tạo tài khoản' : 'Create an account'}</h1>
          <p className="auth-subtitle">{lang === 'vi' ? 'Tham gia nền tảng hỗ trợ du học AI thế hệ mới' : 'Join the next-gen AI admission platform'}</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-error">
            {error}
          </motion.div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>{lang === 'vi' ? 'Họ và Tên' : 'Full Name'}</label>
            <input 
              type="text" 
              className="auth-input" 
              placeholder={lang === 'vi' ? 'VD: Nguyễn Văn A' : 'e.g. Alex Johnson'}
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              required
            />
          </div>

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

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (lang === 'vi' ? 'Đăng ký ngay' : 'Create Account')}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          {lang === 'vi' ? 'Đã có tài khoản?' : 'Already have an account?'} <Link to="/login" className="auth-link">{lang === 'vi' ? 'Đăng nhập' : 'Sign in'}</Link>
        </div>
      </motion.div>
    </div>
  );
}
