import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const STORAGE_KEY = '_notifiedItems';

function loadNotified() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}

function saveNotified(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set].slice(-300)));
}

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const notifiedRef = useRef(loadNotified());

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes, timedRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
        api.get('/tasks?hasTime=true&status=pending'),
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.count);

      // Toast for timed items that just became due
      const now = new Date();
      timedRes.data.forEach(item => {
        if (notifiedRef.current.has(item._id)) return;
        if (new Date(item.dueDate) <= now) {
          toast(`⏰ ${item.title}${item.linkedStudentName ? ` · ${item.linkedStudentName}` : ''}`, {
            duration: 8000,
            style: { fontWeight: 500 },
          });
          notifiedRef.current.add(item._id);
          saveNotified(notifiedRef.current);
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await api.put('/notifications/mark-all-read');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
