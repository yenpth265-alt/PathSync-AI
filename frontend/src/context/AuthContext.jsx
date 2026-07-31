import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/auth';
import { getUserProfile } from '../services/api';
import { AuthContext } from './authContext';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getAuthToken());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      if (err.message === 'Unauthorized') {
        logout();
      }
      throw err;
    }
  };

  useEffect(() => {
    const handleLogoutEvent = () => logout();
    window.addEventListener('auth:logout', handleLogoutEvent);

    if (token) {
      setLoading(true);
      fetchProfile()
        .catch(() => {
          // A stale token or an unavailable API must never leave protected routes
          // on an infinite "loading profile" screen.
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setProfile(null);
      setLoading(false);
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
    setProfile((prev) => ({ ...(prev || {}), ...newData }));
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        profile,
        loading,
        login,
        logout,
        updateProfileState,
        refreshProfile: fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
