import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Square, Trash2, Pencil, Calendar, Clock, User, AlarmClock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, isExpired } from '../../utils/helpers';
import { NOTIFY_OPTIONS } from '../../utils/taskTypes';

function formatDateTime(dt) {
  return new Date(dt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

export function TaskItem({ task, onUpdate, showAssignee = false, onEdit }) {
  const { user, isFounder } = useAuth();
  const [confirmingDone, setConfirmingDone] = useState(false);
  const [note,     setNote]     = useState('');
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isDone    = task.status === 'done';
  const isUrgent  = task.priority === 'urgent';
  const isOverdue = task.dueDate && isExpired(task.dueDate) && !isDone;
  const canDelete = isFounder || String(task.createdBy) === String(user._id);

  const handleCheckClick = (e) => {
    e.stopPropagation();
    if (isDone) {
      markStatus('pending', '');
    } else {
      setConfirmingDone(true);
      setNote('');
    }
  };

  const markStatus = async (status, completionNote) => {
    setSaving(true);
    try {
      await api.patch(`/tasks/${task._id}/status`, { status, completionNote });
      setConfirmingDone(false);
      onUpdate();
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Delete this item?')) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success('Deleted');
      onUpdate();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`rounded-xl border transition-all group ${
      isDone    ? 'bg-gray-50 border-gray-100 opacity-70' :
      isUrgent  ? 'bg-red-50 border-red-100 hover:border-red-200' :
      isOverdue ? 'bg-orange-50 border-orange-100 hover:border-orange-200' :
                  'bg-white border-gray-100 hover:border-brand-200'
    }`}>
      <div className="flex items-start gap-3 p-3.5">
        {/* Checkbox */}
        <button
          onClick={handleCheckClick}
          className={`mt-0.5 shrink-0 transition-colors ${
            isDone ? 'text-green-500' : isUrgent ? 'text-red-400 hover:text-red-600' : 'text-gray-300 hover:text-brand-500'
          }`}
        >
          {isDone ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Overdue badge */}
          {isOverdue && !isDone && (
            <div className="mb-1">
              <span className="badge bg-red-100 text-red-700 text-xs">Overdue</span>
            </div>
          )}

          <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {isUrgent && !isDone && <span className="text-red-500 mr-1">🔴</span>}
            {task.title}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            {showAssignee && task.assignedToName && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <User className="w-3 h-3" /> {task.assignedToName}
              </span>
            )}
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue && !isDone ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                {task.hasTime
                  ? <><AlarmClock className="w-3 h-3" />{formatDateTime(task.dueDate)}</>
                  : <><Calendar className="w-3 h-3" />{formatDate(task.dueDate)}</>
                }
              </span>
            )}
            {task.hasTime && task.notifyBefore > 0 && !isDone && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {NOTIFY_OPTIONS.find(o => o.value === task.notifyBefore)?.label ?? `${task.notifyBefore}m before`}
              </span>
            )}
            {task.linkedStudentName && (
              <Link
                to={`/students/${task.linkedStudent}`}
                onClick={e => e.stopPropagation()}
                className="text-xs text-brand-600 hover:underline"
              >
                → {task.linkedStudentName}
              </Link>
            )}
            {task.stageName && (
              <span className="text-xs text-gray-400 italic">{task.stageName}{task.checklistItemLabel ? ` · ${task.checklistItemLabel}` : ''}</span>
            )}
            <span className="text-xs text-gray-300">by {task.createdByName}</span>
          </div>

          {task.notes && (
            <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
              {task.notes}
            </p>
          )}

          {isDone && task.completionNote && (
            <p className="mt-1.5 text-xs text-gray-500 bg-gray-100 rounded-lg px-2.5 py-1.5 italic">
              "{task.completionNote}"
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(task); }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Completion note prompt */}
      {confirmingDone && (
        <div className="px-3.5 pb-3.5 pt-0 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2 pt-3">Add a completion note (optional):</p>
          <textarea
            className="input text-sm min-h-[60px] resize-none"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What was done? Any outcome to note..."
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => markStatus('done', note)} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
              {saving ? 'Saving...' : 'Mark as Done'}
            </button>
            <button onClick={() => setConfirmingDone(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskList({ tasks, loading, onUpdate, showAssignee = false, onEdit }) {
  const [showDone, setShowDone] = useState(false);

  const now = new Date();
  const sorted = [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    const aOver = a.dueDate && new Date(a.dueDate) < now && a.status !== 'done';
    const bOver = b.dueDate && new Date(b.dueDate) < now && b.status !== 'done';
    if (aOver !== bOver) return aOver ? -1 : 1;
    if (a.priority !== b.priority) return a.priority === 'urgent' ? -1 : 1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const pending = sorted.filter(t => t.status === 'pending');
  const done    = sorted.filter(t => t.status === 'done');

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
      </div>
    );
  }

  if (pending.length === 0 && done.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-dashed border-gray-200">
        <CheckSquare className="w-4 h-4 text-gray-300 shrink-0" />
        <p className="text-sm text-gray-400">No pending items</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pending.map(t => (
        <TaskItem key={t._id} task={t} onUpdate={onUpdate} showAssignee={showAssignee} onEdit={onEdit} />
      ))}

      {done.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowDone(v => !v)}
            className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider pt-1 hover:text-gray-600 transition-colors"
          >
            <span>{showDone ? '▾' : '▸'}</span>
            Completed ({done.length})
          </button>
          {showDone && done.map(t => (
            <TaskItem key={t._id} task={t} onUpdate={onUpdate} showAssignee={showAssignee} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
