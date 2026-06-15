import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export const TYPE_META = {
  interview:          { label: 'Interview',          color: 'bg-purple-100 text-purple-700' },
  vfs_appointment:    { label: 'VFS Appointment',    color: 'bg-blue-100 text-blue-700' },
  document_deadline:  { label: 'Document Deadline',  color: 'bg-orange-100 text-orange-700' },
  follow_up:          { label: 'Follow-up Call',     color: 'bg-green-100 text-green-700' },
  meeting:            { label: 'Meeting',            color: 'bg-indigo-100 text-indigo-700' },
  custom:             { label: 'Custom',             color: 'bg-gray-100 text-gray-700' },
};

export const NOTIFY_OPTIONS = [
  { value: 0,    label: 'At the time' },
  { value: 15,   label: '15 minutes before' },
  { value: 30,   label: '30 minutes before' },
  { value: 60,   label: '1 hour before' },
  { value: 120,  label: '2 hours before' },
  { value: 1440, label: '1 day before' },
];

export default function ReminderModal({ initial, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [stages, setStages] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [studentQuery, setStudentQuery] = useState(initial?.studentName ?? '');
  const [showStudentDrop, setShowStudentDrop] = useState(false);

  const [form, setForm] = useState({
    title: initial?.title ?? '',
    type: initial?.type ?? 'custom',
    date: initial?.reminderAt ? new Date(initial.reminderAt).toISOString().slice(0, 10) : '',
    time: initial?.reminderAt ? new Date(initial.reminderAt).toTimeString().slice(0, 5) : '',
    notifyBefore: initial?.notifyBefore ?? 0,
    student: initial?.student ?? '',
    studentName: initial?.studentName ?? '',
    stageName: initial?.stageName ?? '',
    checklistItemLabel: initial?.checklistItemLabel ?? '',
    notes: initial?.notes ?? '',
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const studentLocked = !!(initial?.student && initial?.studentName && !initial?._id);

  useEffect(() => {
    if (!studentLocked) {
      api.get('/students').then(r => setStudents(r.data.students || [])).catch(() => {});
    }
  }, [studentLocked]);

  useEffect(() => {
    if (!form.student) { setStages([]); setChecklist([]); return; }
    const stu = students.find(s => s._id === form.student);
    const destId = stu?.destination?._id || stu?.destination || initial?.destinationId;
    if (!destId) return;
    api.get(`/destinations/${destId}`)
      .then(r => {
        const sorted = [...(r.data.pipelineStages || [])].sort((a, b) => a.order - b.order);
        setStages(sorted);
      })
      .catch(() => {});
  }, [form.student, students]);

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
    setForm(f => ({ ...f, student: s._id, studentName: `${s.firstName} ${s.lastName}`, stageName: '', checklistItemLabel: '' }));
    setStudentQuery(`${s.firstName} ${s.lastName}`);
    setShowStudentDrop(false);
  };

  const clearStudent = () => {
    setForm(f => ({ ...f, student: '', studentName: '', stageName: '', checklistItemLabel: '' }));
    setStudentQuery('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time) return toast.error('Please select a date and time');
    setSaving(true);
    try {
      const reminderAt = new Date(`${form.date}T${form.time}:00`);
      const payload = {
        title: form.title,
        type: form.type,
        reminderAt,
        notifyBefore: Number(form.notifyBefore),
        student: form.student || undefined,
        studentName: form.studentName || '',
        stageName: form.stageName || '',
        checklistItemLabel: form.checklistItemLabel || '',
        notes: form.notes || '',
      };
      if (initial?._id) {
        await api.put(`/reminders/${initial._id}`, payload);
        toast.success('Reminder updated');
      } else {
        await api.post('/reminders', payload);
        toast.success('Reminder created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save reminder');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{initial?._id ? 'Edit Reminder' : 'New Reminder'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form id="reminder-form" onSubmit={handleSave} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. VFS appointment for Ahmed"
              required
            />
          </div>

          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={set('type')}>
              {Object.entries(TYPE_META).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" value={form.date} onChange={set('date')} required />
            </div>
            <div>
              <label className="label">Time *</label>
              <input className="input" type="time" value={form.time} onChange={set('time')} required />
            </div>
          </div>

          <div>
            <label className="label">Send notification</label>
            <select className="input" value={form.notifyBefore} onChange={set('notifyBefore')}>
              {NOTIFY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Student — locked when opened from a student profile */}
          <div>
            <label className="label">Linked student</label>
            {studentLocked ? (
              <div className="input bg-gray-50 text-gray-700 flex items-center gap-2 cursor-default">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                {form.studentName}
              </div>
            ) : (
              <div className="relative">
                <input
                  className="input pr-8"
                  value={studentQuery}
                  onChange={e => {
                    setStudentQuery(e.target.value);
                    setForm(f => ({ ...f, student: '', studentName: '', stageName: '', checklistItemLabel: '' }));
                    setShowStudentDrop(true);
                  }}
                  onFocus={() => studentQuery && setShowStudentDrop(true)}
                  onBlur={() => setTimeout(() => setShowStudentDrop(false), 150)}
                  placeholder="Type student name to search..."
                />
                {(form.student || studentQuery) && (
                  <button type="button" onClick={clearStudent} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
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
                {form.student && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Student linked
                  </p>
                )}
              </div>
            )}
          </div>

          {stages.length > 0 && (
            <div>
              <label className="label">Pipeline stage (optional)</label>
              <select
                className="input"
                value={form.stageName}
                onChange={(e) => setForm(f => ({ ...f, stageName: e.target.value, checklistItemLabel: '' }))}
              >
                <option value="">— No stage —</option>
                {stages.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          )}

          {checklist.length > 0 && (
            <div>
              <label className="label">Checklist item (optional)</label>
              <select className="input" value={form.checklistItemLabel} onChange={set('checklistItemLabel')}>
                <option value="">— No item —</option>
                {checklist.map(i => <option key={i._id} value={i.label}>{i.label}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input resize-none min-h-[72px]"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Any additional details..."
            />
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button form="reminder-form" type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? 'Saving...' : initial?._id ? 'Save Changes' : 'Create Reminder'}
          </button>
          <button onClick={onClose} className="btn-secondary px-5">Cancel</button>
        </div>
      </div>
    </div>
  );
}
