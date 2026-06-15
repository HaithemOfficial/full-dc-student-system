import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setStudentAccessToken, clearStudentAccessToken } from '../utils/api';

const AuthContext = createContext(null);

// Returns a stable random ID for this browser/device, creating one if it doesn't exist yet.
// Returns null if localStorage or crypto.randomUUID() are unavailable (old browsers, private mode).
function getOrCreateDeviceId() {
  try {
    const key = 'dc_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Sends the device ID to the backend. The backend checks whether it has seen this
// device before for this student. If not, it notifies founders + DC agent.
function checkDevice() {
  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return;
  api.post('/student/me/check-device', { deviceId }).catch(() => {});
}

export function AuthProvider({ children }) {
  // Non-sensitive display fields cached in localStorage for instant UI rendering
  const [student, setStudent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('studentUser')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // On mount: restore session via httpOnly cookie
  useEffect(() => {
    api.post('/student-auth/refresh')
      .then(res => {
        setStudentAccessToken(res.data.token);
        const s = res.data.student;
        setStudent(s);
        localStorage.setItem('studentUser', JSON.stringify(s));
        checkDevice();
      })
      .catch(() => {
        clearStudentAccessToken();
        localStorage.removeItem('studentUser');
        setStudent(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (phone, password) => {
    const { data } = await api.post('/student-auth/login', { phone, password });
    setStudentAccessToken(data.token);
    setStudent(data.student);
    localStorage.setItem('studentUser', JSON.stringify(data.student));
    checkDevice();
    return data.student;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/student-auth/logout'); } catch { /* ignore */ }
    clearStudentAccessToken();
    localStorage.removeItem('studentUser');
    setStudent(null);
  }, []);

  const refreshStudent = useCallback(async () => {
    try {
      const { data } = await api.get('/student/me');
      const updated = {
        _id: data._id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        destinationName: data.destinationName,
        currentStageName: data.currentStageName,
        onboardingCompleted: data.onboardingCompleted ?? false,
      };
      setStudent(updated);
      localStorage.setItem('studentUser', JSON.stringify(updated));
    } catch {}
  }, []);

  const markOnboardingComplete = useCallback(async () => {
    try {
      await api.post('/student/me/complete-onboarding');
      setStudent(s => {
        const updated = { ...s, onboardingCompleted: true };
        localStorage.setItem('studentUser', JSON.stringify(updated));
        return updated;
      });
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ student, loading, login, logout, refreshStudent, markOnboardingComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
