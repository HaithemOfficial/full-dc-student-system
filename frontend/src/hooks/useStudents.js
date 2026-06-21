import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';


export function useStudents(filters = {}) {
  const [students, setStudents]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.set(k, v); });
      const { data } = await api.get(`/students?${params}`);
      // Backend always returns { students, total, page, totalPages }
      setStudents(data.students || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  return { students, total, totalPages, loading, error, refetch: fetchStudents };
}

export function useStudent(id) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const initialLoad = useRef(true);

  const fetchStudent = useCallback(async () => {
    if (!id) return;
    if (initialLoad.current) setLoading(true);
    try {
      const { data } = await api.get(`/students/${id}`);
      setStudent(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load student');
    } finally {
      setLoading(false);
      initialLoad.current = false;
    }
  }, [id]);

  useEffect(() => { fetchStudent(); }, [fetchStudent]);

  return { student, loading, error, refetch: fetchStudent };
}
