import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useActionItems(filters = {}) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, v);
      });
      const { data } = await api.get(`/tasks?${params}`);
      setItems(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { items, loading, refetch: fetch };
}
