import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Globe, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const EMPTY_FORM = { title: '', url: '', description: '', emoji: '🔗', destinations: [], isActive: true };

export default function UsefulLinksManager() {
  const [links, setLinks]               = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/useful-links'),
      api.get('/destinations'),
    ]).then(([l, d]) => {
      setLinks(l.data);
      setDestinations(d.data.filter(x => x.isActive));
    }).catch(() => toast.error('Failed to load links')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = (link) => {
    setEditing(link);
    setForm({
      title:        link.title,
      url:          link.url,
      description:  link.description || '',
      emoji:        link.emoji || '🔗',
      destinations: link.destinations?.map(d => d._id || d) || [],
      isActive:     link.isActive,
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const toggleDest = (id) => {
    setForm(f => ({
      ...f,
      destinations: f.destinations.includes(id)
        ? f.destinations.filter(x => x !== id)
        : [...f.destinations, id],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return toast.error('Title and URL are required');
    setSaving(true);
    try {
      const payload = { ...form, order: editing?.order ?? links.length };
      if (editing) {
        const { data } = await api.put(`/useful-links/${editing._id}`, payload);
        setLinks(s => s.map(x => x._id === editing._id ? data : x));
      } else {
        const { data } = await api.post('/useful-links', payload);
        setLinks(s => [...s, data]);
      }
      toast.success(editing ? 'Link updated' : 'Link added');
      closeForm();
    } catch {
      toast.error('Failed to save link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (link) => {
    setDeleting(link._id);
    try {
      await api.delete(`/useful-links/${link._id}`);
      setLinks(s => s.filter(x => x._id !== link._id));
      toast.success('Link deleted');
    } catch {
      toast.error('Failed to delete link');
    } finally {
      setDeleting(null);
    }
  };

  const move = async (index, dir) => {
    const next = [...links];
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    setLinks(next);
    try {
      await Promise.all([
        api.put(`/useful-links/${next[index]._id}`, { order: index }),
        api.put(`/useful-links/${next[swapIdx]._id}`, { order: swapIdx }),
      ]);
    } catch {
      toast.error('Failed to reorder');
      load();
    }
  };

  const toggleActive = async (link) => {
    try {
      const { data } = await api.put(`/useful-links/${link._id}`, { isActive: !link.isActive });
      setLinks(s => s.map(x => x._id === link._id ? data : x));
    } catch {
      toast.error('Failed to update link');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          External links shown to students in the Tools section of the app. Can be destination-specific or shown to all.
        </p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Link
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}

      {!loading && links.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
          No links yet. Add one to get started.
        </div>
      )}

      {!loading && links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, i) => (
            <div
              key={link._id}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                link.isActive ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === links.length - 1} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Emoji */}
              <span className="text-2xl w-8 text-center shrink-0">{link.emoji}</span>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-gray-900 text-sm truncate">{link.title}</p>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-brand-600 transition-colors shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                {link.description && <p className="text-xs text-gray-400 truncate mt-0.5">{link.description}</p>}
                <p className="text-[10px] text-gray-300 truncate mt-0.5">{link.url}</p>
                {link.destinations?.length > 0 ? (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {link.destinations.map(d => (
                      <span key={d._id || d} className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full font-medium">
                        {d.flag} {d.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-1">
                    <Globe className="w-3 h-3 text-gray-300" />
                    <span className="text-[10px] text-gray-400">All destinations</span>
                  </div>
                )}
              </div>

              {/* Active toggle */}
              <button
                onClick={() => toggleActive(link)}
                className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${link.isActive ? 'bg-brand-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${link.isActive ? 'left-[18px]' : 'left-0.5'}`} />
              </button>

              {/* Actions */}
              <button onClick={() => openEdit(link)} className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(link)} disabled={deleting === link._id} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Link' : 'Add Link'}</h3>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form id="link-form" onSubmit={handleSave} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div>
                  <label className="label">Emoji</label>
                  <input className="input text-center text-xl" value={form.emoji} onChange={set('emoji')} maxLength={4} placeholder="🔗" />
                </div>
                <div>
                  <label className="label">Title *</label>
                  <input className="input" value={form.title} onChange={set('title')} required placeholder="University Website" />
                </div>
              </div>

              <div>
                <label className="label">URL *</label>
                <input className="input" type="url" value={form.url} onChange={set('url')} required placeholder="https://..." />
              </div>

              <div>
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={set('description')} placeholder="Short description (optional)" />
              </div>

              <div>
                <label className="label">Destinations</label>
                <p className="text-xs text-gray-400 mb-2">Leave all unchecked to show to every student.</p>
                {destinations.length === 0 ? (
                  <p className="text-xs text-gray-400">No active destinations found.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {destinations.map(d => {
                      const selected = form.destinations.includes(d._id);
                      return (
                        <button
                          key={d._id}
                          type="button"
                          onClick={() => toggleDest(d._id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                            selected ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                          }`}
                        >
                          {d.flag && <span>{d.flag}</span>}
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded text-brand-600"
                />
                <span className="text-sm text-gray-700 font-medium">Active</span>
              </label>
            </form>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button form="link-form" type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Link'}
              </button>
              <button onClick={closeForm} className="btn-secondary px-6">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
