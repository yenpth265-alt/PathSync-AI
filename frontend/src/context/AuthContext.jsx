import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken } from '../utils/auth';
import { getUserProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getAuthToken());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      if (err.message === 'Unauthorized') {
        logout();
      } else {
        // Fallback for demo frontend if backend is offline
        const localProfile = JSON.parse(localStorage.getItem('mock_profile') || 'null');
        setProfile(localProfile || { 
          full_name: 'Khách hàng', 
          email: 'guest@pathsync.ai',
          onboarding_done: false 
        });
      }
    }
  };

  useEffect(() => {
    const handleLogoutEvent = () => logout();
    window.addEventListener('auth:logout', handleLogoutEvent);
    
    if (token) {
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
      setProfile(null);
    }

    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setProfile(null);
  };

  const updateProfileState = (newData) => {
    setProfile(prev => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('mock_profile', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      profile, 
      loading, 
      login, 
      logout, 
      updateProfileState,
      refreshProfile: fetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
