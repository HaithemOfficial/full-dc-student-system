import { useState } from 'react';
import { Plus, Trash2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

export default function CommunicationLog({ student, onUpdate }) {
  const { isFounder } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);
    try {
      await api.post(`/students/${student._id}/communications`, {
        contactType: 'student',
        channel: 'other',
        summary: note,
      });
      toast.success('Note logged');
      setShowForm(false);
      setNote('');
      onUpdate();
    } catch {
      toast.error('Failed to log note');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commId) => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/students/${student._id}/communications/${commId}`);
      toast.success('Note deleted');
      onUpdate();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const comms = [...(student.communications || [])].reverse();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">Communication Notes</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Note
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card p-4 space-y-3 border-brand-100 bg-brand-50">
          <textarea
            className="input min-h-[80px] resize-none"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What happened? What was discussed or agreed?"
            autoFocus
            required
          />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary text-sm">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setNote(''); }} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {comms.length === 0 ? (
        <div className="card p-8 text-center">
          <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No notes logged yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {comms.map(c => (
            <div key={c._id} className="card p-3.5 flex items-start gap-3 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 leading-relaxed">{c.summary}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {c.loggedByName || 'Unknown'} · {formatDateTime(c.createdAt)}
                </p>
              </div>
              {isFounder && (
                <button
                  onClick={() => handleDelete(c._id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all shrink-0 mt-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
