import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSignature, Smartphone, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function NewStudentPage() {
  const navigate = useNavigate();
  const { isFounder, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [customProgram, setCustomProgram] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', whatsapp: '',
    destination: '', assignedTo: '', university: '', program: '',
    serviceAmount: '', notes: '', contractSigned: false, salesAgent: '',
  });

  useEffect(() => {
    api.get('/destinations').then(r => setDestinations(r.data.filter(d => d.isActive)));
    if (isFounder) {
      api.get('/users').then(r => setAgents(r.data.filter(u => u.role === 'dc_agent' && u.isActive)));
    }
  }, [isFounder]);

  useEffect(() => {
    if (form.destination) {
      api.get(`/universities?destination=${form.destination}`).then(r => setUniversities(r.data));
    }
  }, [form.destination]);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleDestinationChange = (e) => {
    setForm(f => ({ ...f, destination: e.target.value, university: '', program: '' }));
    setCustomProgram(false);
  };

  const handleUniversityChange = (e) => {
    setForm(f => ({ ...f, university: e.target.value, program: '' }));
    setCustomProgram(false);
  };

  const selectedUni = universities.find(u => u._id === form.university);
  const uniPrograms = selectedUni?.programs || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.destination) return toast.error('Please select a destination');
    setLoading(true);
    try {
      const payload = {
        ...form,
        assignedTo: isFounder ? form.assignedTo : user._id,
        serviceAmount: Number(form.serviceAmount) || 0,
        university: form.university || undefined,
      };
      const { data } = await api.post('/students', payload);
      if (data.generatedPassword) {
        setCredentials({ phone: payload.whatsapp || '—', password: data.generatedPassword, studentId: data._id });
      } else {
        toast.success('Student added successfully');
        navigate(`/students/${data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Phone: ${credentials.phone}\nPassword: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (credentials) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-8 text-center space-y-6">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Smartphone className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Student Added!</h2>
            <p className="text-sm text-gray-500">Share these credentials with the student so they can log in to the El Nadjah app.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Phone (login)</p>
              <p className="font-mono font-semibold text-gray-900">{credentials.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Password</p>
              <p className="font-mono font-semibold text-brand-700 text-lg tracking-widest">{credentials.password}</p>
            </div>
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            This password will not be shown again. Copy it now and give it to the student.
          </p>
          <div className="flex gap-3">
            <button onClick={copyCredentials} className="btn-secondary flex items-center gap-2 flex-1 justify-center">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => navigate(`/students/${credentials.studentId}`)} className="btn-primary flex-1">
              Open Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
          <p className="text-sm text-gray-400">Fill in the student's information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-brand-600">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input className="input" value={form.firstName} onChange={set('firstName')} required placeholder="Ahmed" />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input" value={form.lastName} onChange={set('lastName')} required placeholder="Bensalem" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-brand-600">Assignment</h3>
          <div>
            <label className="label">Destination *</label>
            <select className="input" value={form.destination} onChange={handleDestinationChange} required>
              <option value="">Select destination...</option>
              {destinations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          {isFounder && (
            <div>
              <label className="label">Assign to DC Agent *</label>
              <select className="input" value={form.assignedTo} onChange={set('assignedTo')} required={isFounder}>
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
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-brand-600">Finance</h3>
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
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-brand-600">Notes</h3>
          <textarea
            className="input min-h-[80px] resize-none"
            value={form.notes}
            onChange={set('notes')}
            placeholder="Any additional notes about this student..."
          />
        </div>

        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={loading} className="btn-primary px-8">
            {loading ? 'Adding...' : 'Add Student'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-6">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
