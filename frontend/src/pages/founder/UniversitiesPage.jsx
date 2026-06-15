import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function UniversityModal({ university, destinations, onClose, onSave }) {
  const [form, setForm] = useState({
    name: university?.name || '',
    destination: university?.destination?._id || university?.destination || '',
    city: university?.city || '',
    website: university?.website || '',
    applicationFee: university?.applicationFee || '',
    contactPerson: university?.contactPerson || '',
    contactEmail: university?.contactEmail || '',
    isPartner: university?.isPartner || false,
    notes: university?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (f) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [f]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (university) {
        await api.put(`/universities/${university._id}`, form);
      } else {
        await api.post('/universities', form);
      }
      toast.success(university ? 'University updated' : 'University added');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">{university ? 'Edit University' : 'Add University'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">University Name *</label><input className="input" value={form.name} onChange={set('name')} required /></div>
          <div>
            <label className="label">Destination *</label>
            <select className="input" value={form.destination} onChange={set('destination')} required>
              <option value="">Select destination...</option>
              {destinations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">City</label><input className="input" value={form.city} onChange={set('city')} /></div>
            <div><label className="label">Application Fee (€)</label><input className="input" type="number" value={form.applicationFee} onChange={set('applicationFee')} /></div>
            <div><label className="label">Contact Person</label><input className="input" value={form.contactPerson} onChange={set('contactPerson')} /></div>
            <div><label className="label">Contact Email</label><input className="input" type="email" value={form.contactEmail} onChange={set('contactEmail')} /></div>
          </div>
          <div><label className="label">Website</label><input className="input" type="url" value={form.website} onChange={set('website')} placeholder="https://..." /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPartner} onChange={set('isPartner')} className="w-4 h-4 text-brand-600 rounded" />
            <span className="text-sm text-gray-700">Partner University</span>
          </label>
          <div><label className="label">Notes</label><textarea className="input min-h-[70px] resize-none" value={form.notes} onChange={set('notes')} /></div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-6">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filterDest, setFilterDest] = useState('');

  const fetchData = () => Promise.all([
    api.get(`/universities${filterDest ? `?destination=${filterDest}` : ''}`),
    api.get('/destinations'),
  ]).then(([u, d]) => { setUniversities(u.data); setDestinations(d.data); setLoading(false); });

  useEffect(() => { fetchData(); }, [filterDest]);

  const handleDelete = async (id) => {
    if (!confirm('Remove this university?')) return;
    await api.delete(`/universities/${id}`);
    toast.success('University removed');
    fetchData();
  };

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Universities</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage the university database per destination</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary">
          <Plus className="w-4 h-4" /> Add University
        </button>
      </div>

      <div className="flex gap-3">
        <select className="input w-auto" value={filterDest} onChange={e => setFilterDest(e.target.value)}>
          <option value="">All Destinations</option>
          {destinations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      ) : universities.length === 0 ? (
        <div className="card p-10 text-center">
          <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No universities added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {universities.map(u => (
            <div key={u._id} className="card p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">{u.name}</p>
                  {u.isPartner && <span className="badge bg-brand-100 text-brand-700 text-xs">Partner</span>}
                </div>
                <p className="text-xs text-gray-400">{u.destination?.name} · {u.city || '—'}</p>
                {u.applicationFee > 0 && <p className="text-xs text-gray-400 mt-0.5">App fee: €{u.applicationFee}</p>}
                {u.contactPerson && <p className="text-xs text-gray-400">Contact: {u.contactPerson}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setModal(u)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(u._id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <UniversityModal
          university={modal === 'new' ? null : modal}
          destinations={destinations}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchData(); }}
        />
      )}
    </div>
  );
}
