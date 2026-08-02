import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Loader2, Sun, Moon, ShieldCheck, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { sendOTP, verifyOTP } from '../services/api';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';
import './LoginPage.css';

export default function RegisterPage({ lang = 'vi', setLang, isDarkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpDebug, setOtpDebug] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await sendOTP(formData.email, formData.password, formData.full_name);
      setStep(2);
      if (res.otp_debug) {
        setOtpDebug(res.otp_debug);
        toast.success(
          lang === 'vi' 
            ? `Mã OTP đã gửi đến ${formData.email}! (Mã thử nghiệm: ${res.otp_debug})` 
            : `OTP sent to ${formData.email}! (Dev Code: ${res.otp_debug})`,
          { duration: 8000 }
        );
      } else {
        toast.success(
          lang === 'vi' 
            ? `Vui lòng kiểm tra hộp thư ${formData.email} để nhận mã OTP!` 
            : `Please check your email ${formData.email} for the OTP code!`
        );
      }
    } catch (err) {
      setError(err.message || (lang === 'vi' ? 'Gửi OTP thất bại. Thử lại sau!' : 'Failed to send OTP. Try again!'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await verifyOTP(formData.email, otpCode);
      toast.success(lang === 'vi' ? 'Xác thực tài khoản thành công!' : 'Account verified successfully!');
      if (res.token) {
        login(res.token);
      }
      navigate('/onboarding');
    } catch (err) {
      setError(err.message || (lang === 'vi' ? 'Mã OTP không đúng hoặc đã hết hạn!' : 'Invalid or expired OTP code!'));
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
          <h1 className="auth-title">
            {step === 1 
              ? (lang === 'vi' ? 'Tạo tài khoản' : 'Create an Account') 
              : (lang === 'vi' ? 'Xác thực Email OTP' : 'Verify Email OTP')}
          </h1>
          <p className="auth-subtitle">
            {step === 1 
              ? (lang === 'vi' ? 'Điền thông tin cá nhân để nhận mã xác thực' : 'Enter your details to receive a 6-digit OTP code') 
              : (lang === 'vi' ? `Nhập mã 6 số đã gửi tới ${formData.email}` : `Enter the 6-digit code sent to ${formData.email}`)}
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-error">
            {error}
          </motion.div>
        )}

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleSendOTP}>
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
              <label>{lang === 'vi' ? 'Địa chỉ Email' : 'Email Address'}</label>
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
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (lang === 'vi' ? 'Gửi mã OTP' : 'Send OTP Code')}
              {!isLoading && <Mail size={18} />}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyOTP}>
            <div className="auth-input-group">
              <label>{lang === 'vi' ? 'Mã xác thực OTP (6 chữ số)' : 'OTP Verification Code (6 digits)'}</label>
              <input 
                type="text" 
                className="auth-input text-center text-xl tracking-widest font-bold" 
                placeholder="123456"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            </div>

            {otpDebug && (
              <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid #3b82f6', fontSize: '13px', color: '#3b82f6', marginBottom: '12px' }}>
                💡 <strong>Dev Helper:</strong> {lang === 'vi' ? 'Mã OTP thử nghiệm:' : 'Dev OTP Code:'} <strong>{otpDebug}</strong>
              </div>
            )}

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (lang === 'vi' ? 'Xác nhận & Đăng nhập' : 'Verify & Sign In')}
              {!isLoading && <ShieldCheck size={18} />}
            </button>

            <button 
              type="button" 
              onClick={() => setStep(1)} 
              style={{ marginTop: '8px', width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}
            >
              ← {lang === 'vi' ? 'Quay lại thay đổi Email' : 'Back to edit Email'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          {lang === 'vi' ? 'Đã có tài khoản?' : 'Already have an account?'} <Link to="/login" className="auth-link">{lang === 'vi' ? 'Đăng nhập' : 'Sign in'}</Link>
        </div>
      </motion.div>
    </div>
  );
}
