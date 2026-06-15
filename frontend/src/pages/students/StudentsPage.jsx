import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import { Search, Plus, AlertTriangle, Flag, X } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';
import api from '../../utils/api';

const PAGE_SIZE = 15;

export default function StudentsPage() {
  const [searchParams] = useSearchParams();
  const { isFounder } = useAuth();

  const [searchInput,        setSearchInput]        = useState('');
  const [search,             setSearch]             = useState('');
  const [filterDestination,  setFilterDestination]  = useState('');
  const [filterAgent,        setFilterAgent]        = useState('');
  const [filterStage,        setFilterStage]        = useState('');
  const [filterStatus,       setFilterStatus]       = useState(
    searchParams.get('urgent') === 'true' ? 'urgent' :
    searchParams.get('flagged') === 'true' ? 'flagged' : ''
  );
  const [filterPayment,      setFilterPayment]      = useState('');
  const [page,               setPage]               = useState(1);

  const [destinations, setDestinations] = useState([]);
  const [agents,       setAgents]       = useState([]);

  // Debounce search input — only hit backend after typing stops
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when any filter changes
  useEffect(() => { setPage(1); }, [filterDestination, filterAgent, filterStage, filterStatus, filterPayment]);

  const backendFilters = {
    page,
    limit: PAGE_SIZE,
    ...(search             && { search }),
    ...(filterDestination  && { destination: filterDestination }),
    ...(filterAgent        && { agent: filterAgent }),
    ...(filterStage        && { stage: filterStage }),
    ...(filterStatus === 'urgent'      && { urgent: 'true' }),
    ...(filterStatus === 'flagged'     && { flagged: 'true' }),
    ...(filterStatus === 'no_contract' && { status: 'no_contract' }),
    ...(filterPayment      && { payment: filterPayment }),
  };

  const { students, total, totalPages, loading } = useStudents(backendFilters);

  useEffect(() => {
    api.get('/destinations').then(r => setDestinations(r.data));
    if (isFounder) api.get('/users').then(r => setAgents(r.data.filter(u => u.role === 'dc_agent')));
  }, [isFounder]);

  const stageOptions = useMemo(() => {
    const names = new Set();
    destinations.forEach(d => (d.pipelineStages || []).forEach(s => s.name && names.add(s.name)));
    return [...names].sort();
  }, [destinations]);

  const anyFilter = searchInput || filterDestination || filterAgent || filterStage || filterStatus || filterPayment;
  const clearAll  = () => {
    setSearchInput(''); setSearch(''); setFilterDestination(''); setFilterAgent('');
    setFilterStage(''); setFilterStatus(''); setFilterPayment(''); setPage(1);
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Students</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? '...' : `${total} student${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/students/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Student
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, WhatsApp..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select className="input w-auto text-sm" value={filterDestination} onChange={e => setFilterDestination(e.target.value)}>
            <option value="">All Destinations</option>
            {destinations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>

          <select className="input w-auto text-sm" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option value="">All Stages</option>
            {stageOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select className="input w-auto text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="urgent">Urgent</option>
            <option value="flagged">Flagged</option>
            <option value="no_contract">No Contract</option>
          </select>

          <select className="input w-auto text-sm" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
            <option value="">All Payments</option>
            <option value="has_debt">Has Remaining Debt</option>
            <option value="paid">Fully Paid</option>
            <option value="unpaid">No Payments Yet</option>
          </select>

          {isFounder && (
            <select className="input w-auto text-sm" value={filterAgent} onChange={e => setFilterAgent(e.target.value)}>
              <option value="">All Agents</option>
              {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          )}

          {anyFilter && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
          </div>
        ) : students.length === 0 ? (
          <div className="card p-10 text-center"><p className="text-gray-400 text-sm">No students found</p></div>
        ) : students.map(s => (
          <Link key={s._id} to={`/students/${s._id}`} className="card p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
              {s.firstName?.charAt(0)}{s.lastName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{s.firstName} {s.lastName}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{s.destinationName} · {s.currentStageName || '—'}</p>
              {s.remainingDebt > 0 && <p className="text-xs text-red-500">{s.remainingDebt.toLocaleString()} DZD remaining</p>}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {s.isUrgent  && <span className="badge bg-red-100 text-red-600 text-xs">Urgent</span>}
              {s.isFlagged && <span className="badge bg-yellow-100 text-yellow-600 text-xs">Flagged</span>}
              {!s.isUrgent && !s.isFlagged && <span className="badge bg-green-50 text-green-700 text-xs">Active</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block card overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg" />)}
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No students found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Destination</th>
                <th className="px-5 py-3">Current Stage</th>
                {isFounder && <th className="px-5 py-3">Agent</th>}
                <th className="px-5 py-3">Finance</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link to={`/students/${s._id}`} className="flex items-center gap-2 group">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {s.firstName?.charAt(0)}{s.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-brand-600">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-gray-400">{s.email || s.whatsapp || '—'}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{s.destinationName}</td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-brand-50 text-brand-700">{s.currentStageName || '—'}</span>
                  </td>
                  {isFounder && <td className="px-5 py-3.5 text-gray-500">{s.assignedTo?.name || '—'}</td>}
                  <td className="px-5 py-3.5">
                    <div className="text-xs">
                      <p className="text-gray-900 font-medium">{s.totalPaid?.toLocaleString()} DZD</p>
                      {s.remainingDebt > 0 && <p className="text-red-500">{s.remainingDebt?.toLocaleString()} remaining</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5 flex-wrap">
                      {s.isUrgent && (
                        <span className="badge bg-red-100 text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Urgent
                        </span>
                      )}
                      {s.isFlagged && (
                        <span className="badge bg-yellow-100 text-yellow-600 flex items-center gap-1">
                          <Flag className="w-3 h-3" /> Flagged
                        </span>
                      )}
                      {!s.isUrgent && !s.isFlagged && <span className="badge bg-green-50 text-green-700">Active</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onChange={p => { setPage(p); window.scrollTo(0, 0); }} />
    </div>
  );
}
