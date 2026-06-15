import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useTasks(filters = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      let url;
      if (filters.studentId) {
        url = `/tasks/student/${filters.studentId}`;
      } else {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
        if (filters.priority) params.set('priority', filters.priority);
        url = `/tasks?${params}`;
      }
      const { data } = await api.get(url);
      setTasks(data);
    } catch (e) {
      console.error('useTasks error:', e);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return { tasks, loading, refetch: fetchTasks };
}
