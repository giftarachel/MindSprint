/**
 * AuthContext – global authentication state.
 * Wraps the app and provides user, login, logout, and loading state.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, getErrorMessage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // initial session check

  // Check existing session on mount
  useEffect(() => {
    authAPI.me()
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Listen for session-expired events (from api.js interceptor)
  useEffect(() => {
    const handler = () => {
      setUser(null);
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    setUser(res.data.data);
    return res.data.data;
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout().catch(() => {});
    setUser(null);
  }, []);

  const register = useCallback(async (formData) => {
    const res = await authAPI.register(formData);
    return res.data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
