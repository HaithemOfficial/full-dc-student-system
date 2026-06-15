import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, clearAccessToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // User profile stored in memory; basic non-sensitive fields cached in localStorage
  // for instant rendering on next load (cleared on logout)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // On mount: restore session via refresh token cookie (httpOnly — no localStorage needed)
  useEffect(() => {
    api.post('/auth/refresh')
      .then(res => {
        setAccessToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        clearAccessToken();
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.token);
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearAccessToken();
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const isFounder = user?.role === 'founder';
  const isDCAgent  = user?.role === 'dc_agent';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isFounder, isDCAgent }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
