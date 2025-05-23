import React, { createContext, useContext, useState, useEffect } from 'react';

const BASE_URL = 'https://geosolver-backend-production.up.railway.app';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const getInitialToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
  const getInitialRefreshToken = () => localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getInitialToken);
  const [refreshToken, setRefreshToken] = useState(getInitialRefreshToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user info on mount if token exists
  useEffect(() => {
    console.log('AuthContext useEffect token:', token);
    if (token) {
      setLoading(true);
      fetch(`${BASE_URL}/api/auth/account`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setUser(data.user || data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setUser(null);
    }
  }, [token]);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        // Съхраняване според rememberMe
        if (rememberMe) {
          localStorage.setItem('token', data.token);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('refreshToken');
        } else {
          sessionStorage.setItem('token', data.token);
          if (data.refreshToken) sessionStorage.setItem('refreshToken', data.refreshToken);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
        setUser(data.user);
        setError(null);
        return true;
      } else {
        setError(data.message || 'Грешка при вход.');
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        return false;
      }
    } catch (e) {
      setError('Грешка при връзка със сървъра.');
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password, repeatPassword, purpose) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, repeatPassword, purpose }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        // По подразбиране регистрацията ще пази в localStorage
        localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        setUser(data.user);
        setError(null);
        return true;
      } else {
        setError(data.message || 'Грешка при регистрация.');
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        return false;
      }
    } catch (e) {
      setError('Грешка при връзка със сървъра.');
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    if (refreshToken) {
      try {
        await fetch(`${BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {}
    }
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setError(null);
        return data.message || 'Изпратен е email за възстановяване на парола.';
      } else {
        setError(data.message || 'Грешка при заявка за нова парола.');
        return false;
      }
    } catch (e) {
      setError('Грешка при връзка със сървъра.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const changePassword = async (oldPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setError(null);
        return true;
      } else {
        setError(data.message || 'Грешка при смяна на паролата.');
        return false;
      }
    } catch (e) {
      setError('Грешка при връзка със сървъра.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, forgotPassword, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 