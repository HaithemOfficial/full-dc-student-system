import { useState, useEffect } from 'react';
import { Plus, Pencil, UserX, Key, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'dc_agent',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        const payload = { name: form.name, email: form.email, role: form.role, phone: form.phone };
        await api.put(`/users/${user._id}`, payload);
      } else {
        await api.post('/users', form);
      }
      toast.success(user ? 'User updated' : 'User created');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{user ? 'Edit User' : 'Add Team Member'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={set('name')} required /></div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
          {!user && <div><label className="label">Password *</label><input className="input" type="password" value={form.password} onChange={set('password')} required minLength={6} /></div>}
          <div>
            <label className="label">Role *</label>
            <select className="input" value={form.role} onChange={set('role')}>
              <option value="dc_agent">DC Agent</option>
              <option value="founder">Founder</option>
            </select>
          </div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : user ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-6">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchUsers = () => api.get('/users').then(r => { setUsers(r.data); setLoading(false); });
  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (user) => {
    await api.put(`/users/${user._id}`, { isActive: !user.isActive });
    toast.success(user.isActive ? 'User deactivated' : 'User reactivated');
    fetchUsers();
  };

  const resetPassword = async (userId) => {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) return toast.error('Password too short');
    await api.put(`/users/${userId}/reset-password`, { newPassword });
    toast.success('Password reset');
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Team</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage founders and DC agents</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last Login</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${u.role === 'founder' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role === 'founder' ? 'Founder' : 'DC Agent'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(u)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => resetPassword(u._id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Reset Password">
                        <Key className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleActive(u)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors" title={u.isActive ? 'Deactivate' : 'Reactivate'}>
                        {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <UserModal
          user={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}
