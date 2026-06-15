import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useReminders(filters = {}) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.done !== undefined) params.set('done', filters.done);
      const { data } = await api.get(`/reminders?${params}`);
      setReminders(data);
    } catch (e) {
      console.error('useReminders error:', e);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { reminders, loading, refetch: fetch };
}
