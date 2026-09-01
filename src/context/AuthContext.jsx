import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import * as authApi from '../api/authApi';

const AuthContext = createContext(null);

const STORAGE_KEY = 'kode_gbs_session';

function getStoredSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw);

    if (
      !session ||
      !session.expiresAt ||
      session.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to restore session:', error);

    window.localStorage.removeItem(STORAGE_KEY);

    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession);
  const [sessionExpired, setSessionExpired] = useState(false);

  /*
   * Keep the session in localStorage.
   */
  useEffect(() => {
    if (session) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(session)
      );
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  /*
   * Automatically expire the session.
   */
  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const checkSession = () => {
      if (
        session.expiresAt &&
        session.expiresAt <= Date.now()
      ) {
        setSessionExpired(true);
        setSession(null);
      }
    };

    checkSession();

    const interval = window.setInterval(
      checkSession,
      15000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [session]);

  /*
   * Login using employee name + employee ID.
   */
  const login = useCallback(
    async (name, employeeId) => {
      const result = await authApi.login({
        name,
        employeeId,
      });

      if (!result) {
        throw new Error('Login failed.');
      }

      if (!result.operator) {
        throw new Error(
          'Login succeeded but operator information is missing.'
        );
      }

      const newSession = {
        token: result.token,
        expiresAt: result.expiresAt,
        operator: result.operator,
      };

      setSessionExpired(false);
      setSession(newSession);

      return result.operator;
    },
    []
  );

  /*
   * Logout.
   */
  const logout = useCallback(() => {
    setSession(null);
    setSessionExpired(false);

    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  /*
   * Used after showing the session-expired message.
   */
  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const value = useMemo(
    () => ({
      session,

      operator: session?.operator || null,

      isAuthenticated: Boolean(session),

      sessionExpired,

      login,
      logout,
      clearSessionExpired,
    }),
    [
      session,
      sessionExpired,
      login,
      logout,
      clearSessionExpired,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/*
 * IMPORTANT:
 * This is the named export that ProtectedRoute.jsx,
 * Navbar.jsx, LoginPage.jsx, CreateJobPage.jsx, etc.
 * are importing.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
}