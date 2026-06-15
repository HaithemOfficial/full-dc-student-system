import { useState, useEffect } from 'react';
import { X, FileSignature } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentProfileEditor({ student, onClose, onSave }) {
  const { isFounder, user } = useAuth();
  const [loading, setLoading]       = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [agents, setAgents]         = useState([]);
  const [universities, setUniversities] = useState([]);
  const [customProgram, setCustomProgram] = useState(false);

  const [form, setForm] = useState({
    firstName:   student.firstName  || '',
    lastName:    student.lastName   || '',
    whatsapp:    student.whatsapp   || '',
    email:       student.email      || '',
    destination: student.destination?._id || student.destination || '',
    assignedTo:  student.assignedTo?._id  || student.assignedTo  || '',
    salesAgent:  student.salesAgent || '',
    university:  student.university?._id  || student.university  || '',
    program:     student.program    || '',
    serviceAmount: student.serviceAmount || '',
    contractSigned: student.contractSigned || false,
    notes:       student.notes      || '',
  });

  useEffect(() => {
    api.get('/destinations').then(r => setDestinations(r.data.filter(d => d.isActive)));
    if (isFounder) {
      api.get('/users').then(r => setAgents(r.data.filter(u => u.role === 'dc_agent' && u.isActive)));
    }
  }, [isFounder]);

  useEffect(() => {
    if (form.destination) {
      api.get(`/universities?destination=${form.destination}`).then(r => {
        setUniversities(r.data);
        // When editing, detect if the existing program is custom (not in the uni's program list)
        const uniId = student.university?._id || student.university;
        if (uniId && student.program) {
          const uni = r.data.find(u => u._id === uniId);
          const known = (uni?.programs || []).map(p => p.name);
          if (known.length > 0 && !known.includes(student.program)) setCustomProgram(true);
        }
      });
    } else {
      setUniversities([]);
    }
  }, [form.destination]);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
  };

  const handleUniversityChange = (e) => {
    setForm(f => ({ ...f, university: e.target.value, program: '' }));
    setCustomProgram(false);
  };

  const selectedUni = universities.find(u => u._id === form.university);
  const uniPrograms = selectedUni?.programs || [];

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/students/${student._id}`, {
        ...form,
        assignedTo: isFounder ? form.assignedTo : (user?._id || student.assignedTo?._id || student.assignedTo),
        serviceAmount: Number(form.serviceAmount) || 0,
        university: form.university || undefined,
      });
      toast.success('Profile updated');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Edit Student Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form id="profile-form" onSubmit={handleSave} className="p-6 space-y-6">

            {/* Personal Information */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Personal Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input className="input" value={form.firstName} onChange={set('firstName')} required />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input className="input" value={form.lastName} onChange={set('lastName')} required />
                </div>
                <div>
                  <label className="label">WhatsApp</label>
                  <input className="input" value={form.whatsapp} onChange={set('whatsapp')} placeholder="+213 ..." />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={set('email')} />
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Assignment</p>
              <div>
                <label className="label">Destination *</label>
                {isFounder ? (
                  <select className="input" value={form.destination} onChange={set('destination')} required>
                    <option value="">Select destination...</option>
                    {destinations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                ) : (
                  <input className="input bg-gray-50 text-gray-500 cursor-not-allowed" value={student.destinationName || '—'} readOnly />
                )}
              </div>
              {isFounder && (
                <div>
                  <label className="label">Assign to DC Agent *</label>
                  <select className="input" value={form.assignedTo} onChange={set('assignedTo')} required>
                    <option value="">Select agent...</option>
                    {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Sales Agent</label>
                <select className="input" value={form.salesAgent} onChange={set('salesAgent')}>
                  <option value="">Select sales agent...</option>
                  {['Kamillia', 'Telisa', 'Ines', 'Mohand', 'Hafsa'].map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">University</label>
                  <select className="input" value={form.university} onChange={handleUniversityChange}>
                    <option value="">Select university...</option>
                    {universities.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Program</label>
                  {uniPrograms.length > 0 && !customProgram ? (
                    <select
                      className="input"
                      value={form.program}
                      onChange={e => {
                        if (e.target.value === '__custom__') { setCustomProgram(true); setForm(f => ({ ...f, program: '' })); }
                        else { setForm(f => ({ ...f, program: e.target.value })); }
                      }}
                    >
                      <option value="">Select program...</option>
                      {uniPrograms.map(p => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
                      <option value="__custom__">Other (type manually)…</option>
                    </select>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <input className="input flex-1" value={form.program} onChange={set('program')} placeholder="e.g. Business Administration" />
                      {uniPrograms.length > 0 && (
                        <button type="button" onClick={() => { setCustomProgram(false); setForm(f => ({ ...f, program: '' })); }} className="text-xs text-brand-600 hover:underline shrink-0">
                          ← list
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Finance */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Finance</p>
              <div>
                <label className="label">Service Amount (DZD)</label>
                <input className="input" type="number" value={form.serviceAmount} onChange={set('serviceAmount')} placeholder="0" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.contractSigned}
                  onChange={set('contractSigned')}
                  className="w-4 h-4 rounded text-brand-600"
                />
                <span className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                  <FileSignature className="w-4 h-4 text-gray-500" />
                  Contract Signed
                </span>
              </label>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Notes</p>
              <textarea
                className="input min-h-[80px] resize-none"
                value={form.notes}
                onChange={set('notes')}
                placeholder="Any additional notes about this student..."
              />
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button form="profile-form" type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="btn-secondary px-6">Cancel</button>
        </div>
      </div>
    </div>
  );
}
