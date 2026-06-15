import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function TaskForm({ onClose, onSave, defaultStudent }) {
  const { user, isFounder } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    title: '',
    priority: 'normal',
    assignedTo: user._id,
    linkedStudent: defaultStudent?._id || '',
    dueDate: '',
    notes: '',
  });

  const [studentQuery, setStudentQuery] = useState(
    defaultStudent ? `${defaultStudent.firstName} ${defaultStudent.lastName}` : ''
  );
  const [showStudentDrop, setShowStudentDrop] = useState(false);

  useEffect(() => {
    api.get('/users/assignable').then(r => {
      setUsers(isFounder ? r.data : r.data.filter(u => u.role === 'founder' || u._id === user._id));
    });
    if (!defaultStudent) {
      api.get('/students').then(r => setStudents(r.data.students || []));
    }
  }, [isFounder]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const matchedStudents = students
    .filter(s => studentQuery.length > 0 &&
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentQuery.toLowerCase()))
    .slice(0, 8);

  const handleStudentInput = (e) => {
    setStudentQuery(e.target.value);
    setForm(p => ({ ...p, linkedStudent: '' }));
    setShowStudentDrop(true);
  };

  const pickStudent = (s) => {
    setForm(p => ({ ...p, linkedStudent: s._id }));
    setStudentQuery(`${s.firstName} ${s.lastName}`);
    setShowStudentDrop(false);
  };

  const clearStudentLink = () => {
    setForm(p => ({ ...p, linkedStudent: '' }));
    setStudentQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assignedTo) return toast.error('Please select who to assign this task to');
    setLoading(true);
    try {
      await api.post('/tasks', {
        ...form,
        linkedStudent: form.linkedStudent || undefined,
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Task created');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">New Task</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">What needs to be done? *</label>
            <input
              className="input"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Follow up with student about passport copy"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Notes <span className="text-gray-300 font-normal">— Optional</span></label>
            <textarea
              className="input text-sm min-h-[60px] resize-none"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Any extra details or context for this task..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                <option value="normal">Normal</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Due Date <span className="text-gray-300 font-normal">— Optional</span></label>
              <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
            </div>
          </div>

          <div>
            <label className="label">Assign to *</label>
            <select className="input" value={form.assignedTo} onChange={set('assignedTo')} required>
              <option value="">Select person...</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>
                  {u._id === user._id ? `${u.name} (Me)` : `${u.name} (${u.role === 'founder' ? 'Founder' : 'DC Agent'})`}
                </option>
              ))}
            </select>
            {!isFounder && (
              <p className="text-xs text-gray-400 mt-1">You can assign to yourself or to a founder</p>
            )}
          </div>

          <div>
            <label className="label">Linked Student <span className="text-gray-300 font-normal">— Optional</span></label>
            {defaultStudent ? (
              <div className="input bg-gray-50 text-gray-600 cursor-not-allowed">
                {defaultStudent.firstName} {defaultStudent.lastName}
              </div>
            ) : (
              <div className="relative">
                <input
                  className="input pr-8"
                  value={studentQuery}
                  onChange={handleStudentInput}
                  onFocus={() => studentQuery && setShowStudentDrop(true)}
                  onBlur={() => setTimeout(() => setShowStudentDrop(false), 150)}
                  placeholder="Type student name to search..."
                />
                {(form.linkedStudent || studentQuery) && (
                  <button
                    type="button"
                    onClick={clearStudentLink}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {showStudentDrop && matchedStudents.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-20 max-h-48 overflow-y-auto">
                    {matchedStudents.map(s => (
                      <button
                        key={s._id}
                        type="button"
                        onMouseDown={() => pickStudent(s)}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        {s.firstName} {s.lastName}
                      </button>
                    ))}
                  </div>
                )}
                {form.linkedStudent && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Student linked
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Creating...' : 'Create Task'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
