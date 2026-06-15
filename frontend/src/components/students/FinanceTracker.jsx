import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatDate, formatCurrency, PAYMENT_METHODS } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_COLORS = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  teal:   'bg-teal-100 text-teal-700',
  red:    'bg-red-100 text-red-700',
  gray:   'bg-gray-100 text-gray-600',
};

const EMPTY_FORM = { amount: '', date: new Date().toISOString().split('T')[0], method: 'cash', category: '', notes: '' };

export default function FinanceTracker({ student, onUpdate }) {
  const { isFounder } = useAuth();
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    api.get('/payment-categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const totalPaid = (student.payments || [])
    .filter(p => (p.category || '').toLowerCase().trim() === 'service fee')
    .reduce((sum, p) => sum + p.amount, 0);
  const remaining = (student.serviceAmount || 0) - totalPaid;
  const progress  = student.serviceAmount > 0 ? (totalPaid / student.serviceAmount) * 100 : 0;

  const getCatMeta = (name) => categories.find(c => c.name === name);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditingId(p._id);
    setForm({
      amount:   String(p.amount),
      date:     p.date ? p.date.split('T')[0] : new Date().toISOString().split('T')[0],
      method:   p.method || 'cash',
      category: p.category || '',
      notes:    p.notes || '',
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { amount: Number(form.amount), date: form.date, method: form.method, category: form.category, notes: form.notes };
      if (editingId) {
        await api.put(`/students/${student._id}/payments/${editingId}`, payload);
        toast.success('Payment updated');
      } else {
        await api.post(`/students/${student._id}/payments`, payload);
        toast.success('Payment recorded');
      }
      closeForm();
      onUpdate();
    } catch {
      toast.error(editingId ? 'Failed to update payment' : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId) => {
    if (!confirm('Delete this payment?')) return;
    try {
      await api.delete(`/students/${student._id}/payments/${paymentId}`);
      toast.success('Payment deleted');
      onUpdate();
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Service Amount</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(student.serviceAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Paid</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Remaining</p>
            <p className={`text-xl font-bold ${remaining > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
        {student.serviceAmount > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Collection progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add Payment */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">Payment History</h3>
        <button onClick={openAdd} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Payment
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4 border-brand-100 bg-brand-50">
          <h4 className="text-sm font-semibold text-brand-700">{editingId ? 'Edit Payment' : 'Record Payment'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (DZD) *</label>
              <input
                className="input" type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required min="1" placeholder="0"
              />
            </div>
            <div>
              <label className="label">Date *</label>
              <input
                className="input" type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Method</label>
              <select className="input" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input
              className="input"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional note..."
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary text-sm">
              {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Save Payment'}
            </button>
            <button type="button" onClick={closeForm} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Payments list */}
      {!student.payments?.length ? (
        <div className="card p-8 text-center">
          <TrendingUp className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No payments recorded yet</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Recorded By</th>
                <th className="px-5 py-3">Notes</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...student.payments].reverse().map(p => {
                const cat = p.category ? getCatMeta(p.category) : null;
                const colorCls = cat ? (CATEGORY_COLORS[cat.color] || CATEGORY_COLORS.gray) : null;
                return (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-3.5">
                      {p.category
                        ? <span className={`badge ${colorCls} text-xs`}>{p.category}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{formatDate(p.date)}</td>
                    <td className="px-5 py-3.5 capitalize text-gray-500">{p.method?.replace('_', ' ')}</td>
                    <td className="px-5 py-3.5 text-gray-500">{p.recordedByName || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-400">{p.notes || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="text-gray-300 hover:text-brand-500 transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {isFounder && (
                          <button onClick={() => handleDelete(p._id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
