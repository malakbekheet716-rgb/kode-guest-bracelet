import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import * as authApi from '../api/authApi';

const AuthContext = createContext(null);
const STORAGE_KEY = 'kode_gbs_session';

function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  useEffect(() => {
    if (!session) return undefined;
    const interval = setInterval(() => {
      if (session.expiresAt < Date.now()) {
        setSessionExpired(true);
        setSession(null);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [session]);

  const login = useCallback(async (name, employeeId) => {
    const result = await authApi.login({ name, employeeId });
    setSessionExpired(false);
    setSession({ token: result.token, expiresAt: result.expiresAt, operator: result.operator });
    return result.operator;
  }, []);

  const logout = useCallback(() => setSession(null), []);
  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const value = useMemo(() => ({
    operator: session?.operator || null,
    isAuthenticated: Boolean(session),
    sessionExpired,
    login,
    logout,
    clearSessionExpired,
  }), [session, sessionExpired, login, logout, clearSessionExpired]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
