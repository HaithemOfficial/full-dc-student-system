import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Check, Pencil, Trash2, ExternalLink,
  Calendar, Clock, User, Loader, AlarmClock, Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useReminders } from '../hooks/useReminders';
import { useAuth } from '../context/AuthContext';
import ReminderModal, { TYPE_META, NOTIFY_OPTIONS } from '../components/reminders/ReminderModal';

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function groupByDate(reminders) {
  const now = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow  = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek  = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);

  const groups = [
    { key: 'overdue',   label: 'Overdue',       items: [] },
    { key: 'today',     label: 'Today',         items: [] },
    { key: 'tomorrow',  label: 'Tomorrow',      items: [] },
    { key: 'week',      label: 'This Week',     items: [] },
    { key: 'later',     label: 'Later',         items: [] },
  ];

  for (const r of reminders) {
    const d = new Date(r.reminderAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (!r.isDone && day < today)        groups[0].items.push(r);
    else if (day.getTime() === today.getTime())    groups[1].items.push(r);
    else if (day.getTime() === tomorrow.getTime()) groups[2].items.push(r);
    else if (day < nextWeek)             groups[3].items.push(r);
    else                                 groups[4].items.push(r);
  }

  return groups.filter(g => g.items.length > 0);
}

// ── Reminder Card ────────────────────────────────────────────────────────────

function ReminderCard({ r, onToggle, onEdit, onDelete, isFounder }) {
  const [togglingDone, setTogglingDone] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const meta = TYPE_META[r.type] || TYPE_META.custom;
  const isOverdue = !r.isDone && new Date(r.reminderAt) < new Date();

  const handleToggle = async () => {
    setTogglingDone(true);
    try { await onToggle(r._id); } finally { setTogglingDone(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this reminder?')) return;
    setDeleting(true);
    try { await onDelete(r._id); } finally { setDeleting(false); }
  };

  return (
    <div className={`card p-4 flex items-start gap-3 transition-all ${r.isDone ? 'opacity-60' : ''} ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}>
      {/* Done toggle */}
      <button
        onClick={handleToggle}
        disabled={togglingDone}
        title={r.isDone ? 'Mark as not done' : 'Mark as done'}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          r.isDone
            ? 'bg-green-500 border-green-500 text-white'
            : isOverdue
            ? 'border-red-300 hover:border-red-500 hover:bg-red-50'
            : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50'
        }`}
      >
        {togglingDone
          ? <Loader className="w-3 h-3 animate-spin" />
          : r.isDone
          ? <Check className="w-3 h-3" strokeWidth={3} />
          : null
        }
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`badge ${meta.color}`}>{meta.label}</span>
          {isOverdue && <span className="badge bg-red-100 text-red-700">Overdue</span>}
          {isFounder && r.createdByName && (
            <span className="text-xs text-gray-400">by {r.createdByName}</span>
          )}
        </div>

        <p className={`text-sm font-semibold text-gray-900 ${r.isDone ? 'line-through text-gray-400' : ''}`}>
          {r.title}
        </p>

        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDateTime(r.reminderAt)}
          </span>
          {r.notifyBefore > 0 && (
            <span className="flex items-center gap-1">
              <AlarmClock className="w-3 h-3" />
              {NOTIFY_OPTIONS.find(o => o.value === r.notifyBefore)?.label ?? `${r.notifyBefore}m before`}
            </span>
          )}
        </div>

        {(r.studentName || r.stageName || r.checklistItemLabel) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 flex-wrap">
            {r.studentName && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {r.student
                  ? <Link to={`/students/${r.student}`} className="text-brand-600 hover:underline">{r.studentName}</Link>
                  : r.studentName
                }
              </span>
            )}
            {r.stageName && <span className="text-gray-300">·</span>}
            {r.stageName && <span>{r.stageName}</span>}
            {r.checklistItemLabel && <span className="text-gray-300">·</span>}
            {r.checklistItemLabel && <span className="italic">{r.checklistItemLabel}</span>}
          </div>
        )}

        {r.notes && (
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{r.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(r)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5 text-gray-400" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          {deleting
            ? <Loader className="w-3.5 h-3.5 text-gray-400 animate-spin" />
            : <Trash2 className="w-3.5 h-3.5 text-red-400" />
          }
        </button>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function RemindersPage() {
  const { isFounder } = useAuth();
  const [showDone, setShowDone] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');

  const { reminders, loading, refetch } = useReminders({ done: showDone ? undefined : undefined });

  // Split upcoming vs done client-side so we can switch without refetch
  const upcoming = useMemo(() => reminders.filter(r => !r.isDone), [reminders]);
  const done = useMemo(() => reminders.filter(r => r.isDone), [reminders]);

  const visible = useMemo(() => {
    const list = showDone ? done : upcoming;
    return typeFilter ? list.filter(r => r.type === typeFilter) : list;
  }, [showDone, done, upcoming, typeFilter]);

  const grouped = useMemo(() => groupByDate(visible), [visible]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };
  const onSaved = () => { closeModal(); refetch(); };

  const handleToggle = async (id) => {
    await api.patch(`/reminders/${id}/done`);
    refetch();
  };

  const handleDelete = async (id) => {
    await api.delete(`/reminders/${id}`);
    toast.success('Reminder deleted');
    refetch();
  };

  const upcomingOverdue = upcoming.filter(r => new Date(r.reminderAt) < new Date()).length;

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reminders</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {upcoming.length} upcoming
            {upcomingOverdue > 0 && <span className="text-red-500"> · {upcomingOverdue} overdue</span>}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Reminder
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Done toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setShowDone(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!showDone ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setShowDone(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${showDone ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Done
          </button>
        </div>

        {/* Type filter */}
        <select
          className="input text-sm py-1.5 w-auto"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          {Object.entries(TYPE_META).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-dashed border-gray-200">
          <Bell className="w-4 h-4 text-gray-300 shrink-0" />
          <p className="text-sm text-gray-400 flex-1">
            {showDone ? 'No completed reminders' : 'No upcoming reminders'}
          </p>
          {!showDone && (
            <button onClick={openCreate} className="text-xs text-brand-600 hover:underline shrink-0 flex items-center gap-1">
              <Plus className="w-3 h-3" /> New Reminder
            </button>
          )}
        </div>
      ) : showDone ? (
        // Done list — flat, no grouping needed
        <div className="space-y-2">
          {visible.map(r => (
            <ReminderCard
              key={r._id}
              r={r}
              onToggle={handleToggle}
              onEdit={openEdit}
              onDelete={handleDelete}
              isFounder={isFounder}
            />
          ))}
        </div>
      ) : (
        // Upcoming — grouped by date
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.key} className="space-y-2">
              <p className={`text-xs font-semibold uppercase tracking-wider px-1 ${
                group.key === 'overdue' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {group.label}
              </p>
              {group.items.map(r => (
                <ReminderCard
                  key={r._id}
                  r={r}
                  onToggle={handleToggle}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  isFounder={isFounder}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ReminderModal
          initial={editing}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
