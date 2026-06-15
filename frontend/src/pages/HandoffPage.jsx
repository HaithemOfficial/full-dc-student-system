import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function HandoffPage() {
  const [destinations, setDestinations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', whatsapp: '',
    destinationId: '', universityPreference: '', program: '',
    bacGrade: '', languageLevel: '', serviceAmount: '',
    paymentAmount: '', paymentMethod: 'cash',
    assignedTo: '', notes: '',
  });

  useEffect(() => {
    api.get('/destinations').then(r => setDestinations(r.data.filter(d => d.isActive)));
    api.get('/users').then(r => setAgents(r.data.filter(u => u.role === 'dc_agent' && u.isActive)));
  }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/handoff', { ...form, serviceAmount: Number(form.serviceAmount) || 0, paymentAmount: Number(form.paymentAmount) || 0 });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
        <div className="card p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Handoff Complete!</h2>
          <p className="text-gray-500 text-sm">The student case has been created and assigned to the DC agent. They have been notified.</p>
          <button onClick={() => { setSubmitted(false); setForm({ firstName: '', lastName: '', phone: '', email: '', whatsapp: '', destinationId: '', universityPreference: '', program: '', bacGrade: '', languageLevel: '', serviceAmount: '', paymentAmount: '', paymentMethod: 'cash', assignedTo: '', notes: '' }); }}
            className="btn-primary mt-6 w-full justify-center">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-lg mb-3">
            <BookOpen className="w-6 h-6 text-brand-600" />
          </div>
          <h1 className="text-xl font-bold text-white">Student Handoff Form</h1>
          <p className="text-brand-200 text-sm mt-1">Submit a new student case to the DC team</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Student Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">First Name *</label><input className="input" value={form.firstName} onChange={set('firstName')} required /></div>
              <div><label className="label">Last Name *</label><input className="input" value={form.lastName} onChange={set('lastName')} required /></div>
              <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={set('phone')} required /></div>
              <div><label className="label">WhatsApp</label><input className="input" value={form.whatsapp} onChange={set('whatsapp')} /></div>
              <div className="col-span-2"><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Study Plan</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Destination *</label>
                <select className="input" value={form.destinationId} onChange={set('destinationId')} required>
                  <option value="">Select...</option>
                  {destinations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assign DC Agent *</label>
                <select className="input" value={form.assignedTo} onChange={set('assignedTo')} required>
                  <option value="">Select agent...</option>
                  {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
              <div><label className="label">University Preference</label><input className="input" value={form.universityPreference} onChange={set('universityPreference')} /></div>
              <div><label className="label">Program</label><input className="input" value={form.program} onChange={set('program')} /></div>
              <div><label className="label">BAC Grade</label><input className="input" value={form.bacGrade} onChange={set('bacGrade')} /></div>
              <div><label className="label">Language Level</label><input className="input" value={form.languageLevel} onChange={set('languageLevel')} /></div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Payment</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Service Amount (DZD)</label><input className="input" type="number" value={form.serviceAmount} onChange={set('serviceAmount')} /></div>
              <div><label className="label">Initial Payment (DZD)</label><input className="input" type="number" value={form.paymentAmount} onChange={set('paymentAmount')} /></div>
              <div>
                <label className="label">Payment Method</label>
                <select className="input" value={form.paymentMethod} onChange={set('paymentMethod')}>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="ccp">CCP</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[70px] resize-none" value={form.notes} onChange={set('notes')} placeholder="Anything the DC agent should know about this student..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? 'Submitting...' : 'Submit Handoff'}
          </button>
        </form>
      </div>
    </div>
  );
}
