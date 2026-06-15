import { useState, useEffect, useMemo } from 'react';
import { Search, Activity, User, BookOpen, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/helpers';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterUser, setFilterUser] = useState('');

  useEffect(() => {
    api.get('/students/activity-log').then(r => {
      setLogs(r.data);
      setLoading(false);
    });
  }, []);

  const allUsers = useMemo(() => {
    const names = new Set(logs.map(l => l.performedByName).filter(Boolean));
    return [...names].sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filterUser && l.performedByName !== filterUser) return false;
      if (dateFrom && new Date(l.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(l.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.action?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q) ||
          l.studentName?.toLowerCase().includes(q) ||
          l.performedByName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, search, filterUser, dateFrom, dateTo]);

  const hasFilters = search || filterUser || dateFrom || dateTo;

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Activity Log</h2>
        <p className="text-sm text-gray-400 mt-0.5">All actions across all student cases</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search actions, students, users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input text-sm w-44" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
          <option value="">All users</option>
          {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input text-sm w-40"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            title="From date"
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="date"
            className="input text-sm w-40"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            title="To date"
          />
        </div>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterUser(''); setDateFrom(''); setDateTo(''); }}
            className="flex items-center gap-1.5 btn-secondary text-xs px-3 py-1.5"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        {logs.length !== filtered.length ? ` (filtered from ${logs.length})` : ''}
      </p>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No activity entries found</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((entry, i) => (
            <div key={entry._id || i} className="card px-4 py-3 flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                <Activity className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p className="text-sm font-medium text-gray-800 leading-snug">{entry.action}</p>
                  <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{formatDateTime(entry.createdAt)}</span>
                </div>
                {entry.details && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">{entry.details}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <User className="w-3 h-3" /> {entry.performedByName}
                  </span>
                  {entry.studentName && (
                    <Link
                      to={`/students/${entry.studentId}`}
                      className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                    >
                      <BookOpen className="w-3 h-3" /> {entry.studentName}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
