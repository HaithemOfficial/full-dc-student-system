import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { NOTIFY_OPTIONS } from '../../utils/taskTypes';

export default function ActionItemForm({ initial, defaultStudent, onClose, onSaved }) {
  const { user, isFounder } = useAuth();
  const isEdit = !!initial?._id;

  const [loading,        setLoading]        = useState(false);
  const [users,          setUsers]          = useState([]);
  const [students,       setStudents]       = useState([]);
  const [stages,         setStages]         = useState([]);
  const [checklist,      setChecklist]      = useState([]);
  const [studentQuery,   setStudentQuery]   = useState('');
  const [showStudentDrop, setShowStudentDrop] = useState(false);

  const studentLocked = !!defaultStudent;

  // Parse existing dueDate into date + time strings
  const parseDate = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';
  const parseTime = (d) => d ? new Date(d).toTimeString().slice(0, 5) : '';

  const [form, setForm] = useState({
    title:              initial?.title          ?? '',
    priority:           initial?.priority       ?? 'normal',
    date:               parseDate(initial?.dueDate),
    time:               initial?.hasTime        ? parseTime(initial?.dueDate) : '',
    hasTime:            initial?.hasTime        ?? false,
    notifyBefore:       initial?.notifyBefore   ?? 0,
    assignedTo:         initial?.assignedTo     ?? user._id,
    linkedStudent:      initial?.linkedStudent  ?? defaultStudent?._id ?? '',
    linkedStudentName:  initial?.linkedStudentName ?? (defaultStudent ? `${defaultStudent.firstName} ${defaultStudent.lastName}` : ''),
    stageName:          initial?.stageName      ?? '',
    checklistItemLabel: initial?.checklistItemLabel ?? '',
    notes:              initial?.notes          ?? '',
  });

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const setField = (f, v) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    setStudentQuery(form.linkedStudentName || '');
  }, []);

  useEffect(() => {
    api.get('/users/assignable').then(r => {
      setUsers(isFounder ? r.data : r.data.filter(u => u.role === 'founder' || u._id === user._id));
    });
    if (!studentLocked) {
      api.get('/students').then(r => setStudents(r.data.students || [])).catch(() => {});
    }
  }, [isFounder, studentLocked]);

  // Load pipeline stages when a student is selected
  useEffect(() => {
    if (!form.linkedStudent) { setStages([]); setChecklist([]); return; }
    const stu = students.find(s => s._id === form.linkedStudent);
    const destId = stu?.destination?._id || stu?.destination
      || (defaultStudent?._id === form.linkedStudent ? initial?.destinationId : null);
    if (!destId) return;
    api.get(`/destinations/${destId}`)
      .then(r => setStages([...(r.data.pipelineStages || [])].sort((a, b) => a.order - b.order)))
      .catch(() => {});
  }, [form.linkedStudent, students]);

  useEffect(() => {
    if (!form.stageName) { setChecklist([]); return; }
    const stage = stages.find(s => s.name === form.stageName);
    setChecklist(stage?.checklist || []);
  }, [form.stageName, stages]);

  const matchedStudents = students
    .filter(s => studentQuery.length > 0 &&
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentQuery.toLowerCase()))
    .slice(0, 8);

  const pickStudent = (s) => {
    setForm(p => ({ ...p, linkedStudent: s._id, linkedStudentName: `${s.firstName} ${s.lastName}`, stageName: '', checklistItemLabel: '' }));
    setStudentQuery(`${s.firstName} ${s.lastName}`);
    setShowStudentDrop(false);
  };

  const clearStudent = () => {
    setForm(p => ({ ...p, linkedStudent: '', linkedStudentName: '', stageName: '', checklistItemLabel: '' }));
    setStudentQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assignedTo) return toast.error('Please select who to assign this to');

    let dueDate;
    if (form.date) {
      if (form.hasTime && form.time) {
        dueDate = new Date(`${form.date}T${form.time}:00`);
      } else {
        dueDate = new Date(`${form.date}T00:00:00`);
      }
    }

    const payload = {
      title:              form.title,
      priority:           form.priority,
      assignedTo:         form.assignedTo,
      linkedStudent:      form.linkedStudent || undefined,
      dueDate:            dueDate,
      hasTime:            form.hasTime && !!form.time,
      notifyBefore:       form.hasTime && form.time ? Number(form.notifyBefore) : 0,
      stageName:          form.stageName || '',
      checklistItemLabel: form.checklistItemLabel || '',
      notes:              form.notes || '',
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/tasks/${initial._id}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/tasks', payload);
        toast.success('Created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isEdit ? 'Edit Item' : 'New Item'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form id="action-item-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="label">What needs to be done? *</label>
            <input
              className="input"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Follow up on passport copy"
              required
              autoFocus
            />
          </div>

          {/* Priority */}
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={set('priority')}>
              <option value="normal">Normal</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="label">Due Date <span className="text-gray-300 font-normal">— Optional</span></label>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={e => {
                setField('date', e.target.value);
                if (!e.target.value) { setField('hasTime', false); setField('time', ''); }
              }}
            />
          </div>

          {/* Time — only when date is set */}
          {form.date && (
            <div className="space-y-3 pl-3 border-l-2 border-brand-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-brand-600"
                  checked={form.hasTime}
                  onChange={e => {
                    setField('hasTime', e.target.checked);
                    if (!e.target.checked) setField('time', '');
                  }}
                />
                <span className="text-sm text-gray-700">Include exact time <span className="text-gray-400 text-xs">(enables notification)</span></span>
              </label>

              {form.hasTime && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Time *</label>
                    <input
                      className="input"
                      type="time"
                      value={form.time}
                      onChange={set('time')}
                      required={form.hasTime}
                    />
                  </div>
                  <div>
                    <label className="label">Notify me</label>
                    <select className="input" value={form.notifyBefore} onChange={set('notifyBefore')}>
                      {NOTIFY_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assign to */}
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
          </div>

          {/* Student */}
          <div>
            <label className="label">Student <span className="text-gray-300 font-normal">— Optional</span></label>
            {studentLocked ? (
              <div className="input bg-gray-50 text-gray-700 flex items-center gap-2 cursor-default">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                {form.linkedStudentName}
              </div>
            ) : (
              <div className="relative">
                <input
                  className="input pr-8"
                  value={studentQuery}
                  onChange={e => {
                    setStudentQuery(e.target.value);
                    setForm(p => ({ ...p, linkedStudent: '', linkedStudentName: '', stageName: '', checklistItemLabel: '' }));
                    setShowStudentDrop(true);
                  }}
                  onFocus={() => studentQuery && setShowStudentDrop(true)}
                  onBlur={() => setTimeout(() => setShowStudentDrop(false), 150)}
                  placeholder="Type student name to search..."
                />
                {(form.linkedStudent || studentQuery) && (
                  <button type="button" onClick={clearStudent} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
                {showStudentDrop && matchedStudents.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-20 max-h-48 overflow-y-auto">
                    {matchedStudents.map(s => (
                      <button key={s._id} type="button" onMouseDown={() => pickStudent(s)}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0">
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

          {/* Stage */}
          {stages.length > 0 && (
            <div>
              <label className="label">Pipeline Stage <span className="text-gray-300 font-normal">— Optional</span></label>
              <select className="input" value={form.stageName}
                onChange={e => setForm(p => ({ ...p, stageName: e.target.value, checklistItemLabel: '' }))}>
                <option value="">— No stage —</option>
                {stages.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          )}

          {/* Checklist item */}
          {checklist.length > 0 && (
            <div>
              <label className="label">Checklist Item <span className="text-gray-300 font-normal">— Optional</span></label>
              <select className="input" value={form.checklistItemLabel} onChange={set('checklistItemLabel')}>
                <option value="">— No item —</option>
                {checklist.map(i => <option key={i._id} value={i.label}>{i.label}</option>)}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Notes <span className="text-gray-300 font-normal">— Optional</span></label>
            <textarea
              className="input resize-none min-h-[64px] text-sm"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Any extra details..."
            />
          </div>
        </form>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button form="action-item-form" type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
          </button>
          <button onClick={onClose} className="btn-secondary px-5">Cancel</button>
        </div>
      </div>
    </div>
  );
}
