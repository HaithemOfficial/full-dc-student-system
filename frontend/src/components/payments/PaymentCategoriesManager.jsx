import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import api from '../../utils/api';

const COLOR_OPTIONS = [
  { value: 'gray',   label: 'Gray'   },
  { value: 'blue',   label: 'Blue'   },
  { value: 'green',  label: 'Green'  },
  { value: 'purple', label: 'Purple' },
  { value: 'orange', label: 'Orange' },
  { value: 'teal',   label: 'Teal'   },
  { value: 'red',    label: 'Red'    },
];

export const CATEGORY_COLORS = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  teal:   'bg-teal-100 text-teal-700',
  red:    'bg-red-100 text-red-700',
  gray:   'bg-gray-100 text-gray-600',
};

export default function PaymentCategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState({ name: '', color: 'gray' });
  const [saving, setSaving]         = useState(false);

  const load = () => api.get('/payment-categories').then(r => setCategories(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew   = () => { setEditing(null); setForm({ name: '', color: 'gray' }); setShowForm(true); };
  const openEdit  = (c) => { setEditing(c); setForm({ name: c.name, color: c.color }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/payment-categories/${editing._id}`, form);
      } else {
        await api.post('/payment-categories', form);
      }
      load();
      closeForm();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/payment-categories/${id}`).catch(() => {});
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Payment Categories</p>
          <p className="text-xs text-gray-400 mt-0.5">Categories used when recording student payments</p>
        </div>
        <button onClick={openNew} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="flex items-end gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex-1">
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Agency Fee"
              required autoFocus
            />
          </div>
          <div className="w-36">
            <label className="label">Color</label>
            <select className="input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}>
              {COLOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pb-0.5">
            <button type="submit" disabled={saving} className="btn-primary text-sm px-3 py-2">
              {saving ? '…' : <Check className="w-4 h-4" />}
            </button>
            <button type="button" onClick={closeForm} className="btn-secondary text-sm px-3 py-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-gray-400">No categories yet — add some to categorise payments.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <div key={c._id} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border border-gray-100 bg-white">
              <span className={`badge ${CATEGORY_COLORS[c.color] || CATEGORY_COLORS.gray} text-xs`}>{c.name}</span>
              <button onClick={() => openEdit(c)} className="p-0.5 text-gray-300 hover:text-gray-600 transition-colors">
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={() => handleDelete(c._id)} className="p-0.5 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
