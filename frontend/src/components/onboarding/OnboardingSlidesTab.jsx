import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function OnboardingSlidesTab({ destination, allDestinations }) {
  const [allSlides, setAllSlides] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);

  const emptyForm = () => ({ title: '', body: '', emoji: '✨', destinations: [destination._id], isActive: true });

  // slides relevant to this destination: global (empty destinations) OR includes this dest
  const slides = allSlides.filter(s =>
    s.destinations?.length === 0 ||
    s.destinations?.some(d => (d._id || d) === destination._id)
  );

  const load = () => {
    setLoading(true);
    api.get('/onboarding-slides')
      .then(r => setAllSlides(r.data))
      .catch(() => toast.error('Failed to load slides'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [destination._id]);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (slide) => {
    setEditing(slide);
    setForm({
      title:        slide.title,
      body:         slide.body,
      emoji:        slide.emoji || '✨',
      destinations: slide.destinations?.map(d => d._id || d) || [],
      isActive:     slide.isActive,
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(null); };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const toggleDest = (id) => setForm(f => ({
    ...f,
    destinations: f.destinations.includes(id)
      ? f.destinations.filter(x => x !== id)
      : [...f.destinations, id],
  }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return toast.error('Title and body are required');
    setSaving(true);
    try {
      const payload = { ...form, order: editing?.order ?? allSlides.length };
      if (editing) {
        const { data } = await api.put(`/onboarding-slides/${editing._id}`, payload);
        setAllSlides(s => s.map(x => x._id === editing._id ? data : x));
      } else {
        const { data } = await api.post('/onboarding-slides', payload);
        setAllSlides(s => [...s, data]);
      }
      toast.success(editing ? 'Slide updated' : 'Slide added');
      closeForm();
    } catch {
      toast.error('Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slide) => {
    setDeleting(slide._id);
    try {
      await api.delete(`/onboarding-slides/${slide._id}`);
      setAllSlides(s => s.filter(x => x._id !== slide._id));
      toast.success('Slide deleted');
    } catch {
      toast.error('Failed to delete slide');
    } finally {
      setDeleting(null);
    }
  };

  const move = async (idx, dir) => {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= slides.length) return;
    try {
      await Promise.all([
        api.put(`/onboarding-slides/${slides[idx]._id}`,     { order: slides[swapIdx].order }),
        api.put(`/onboarding-slides/${slides[swapIdx]._id}`, { order: slides[idx].order }),
      ]);
      load();
    } catch {
      toast.error('Failed to reorder');
    }
  };

  const toggleActive = async (slide) => {
    try {
      const { data } = await api.put(`/onboarding-slides/${slide._id}`, { isActive: !slide.isActive });
      setAllSlides(s => s.map(x => x._id === slide._id ? data : x));
    } catch {
      toast.error('Failed to update slide');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          Slides shown to {destination.flag} {destination.name} students when they first open the app.
          Use <code className="text-brand-600 bg-brand-50 px-1 rounded text-xs">{'{firstName}'}</code> and{' '}
          <code className="text-brand-600 bg-brand-50 px-1 rounded text-xs">{'{destinationName}'}</code> in text.
          Slides with <Globe className="w-3 h-3 inline text-gray-400" /> are shown to all destinations.
        </p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Slide
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}

      {!loading && slides.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
          No slides for this destination yet. Add one to get started.
        </div>
      )}

      {!loading && slides.length > 0 && (
        <div className="space-y-2">
          {slides.map((slide, i) => (
            <div
              key={slide._id}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                slide.isActive ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === slides.length - 1} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-2xl w-8 text-center shrink-0">{slide.emoji}</span>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{slide.title}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{slide.body}</p>
                {slide.destinations?.length === 0 ? (
                  <div className="flex items-center gap-1 mt-1">
                    <Globe className="w-3 h-3 text-gray-300" />
                    <span className="text-[10px] text-gray-400">All destinations</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {slide.destinations.map(d => (
                      <span key={d._id || d} className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full font-medium">
                        {d.flag} {d.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => toggleActive(slide)}
                className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${slide.isActive ? 'bg-brand-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${slide.isActive ? 'left-[18px]' : 'left-0.5'}`} />
              </button>

              <button onClick={() => openEdit(slide)} className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(slide)} disabled={deleting === slide._id} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && form && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Slide' : 'Add Slide'}</h3>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <form id="slide-tab-form" onSubmit={handleSave} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div>
                  <label className="label">Emoji</label>
                  <input className="input text-center text-xl" value={form.emoji} onChange={set('emoji')} maxLength={4} placeholder="✨" />
                </div>
                <div>
                  <label className="label">Title</label>
                  <input className="input" value={form.title} onChange={set('title')} required placeholder="Welcome, {firstName}!" />
                </div>
              </div>

              <div>
                <label className="label">Body</label>
                <textarea className="input min-h-[90px] resize-none" value={form.body} onChange={set('body')} required placeholder="You're applying to {destinationName}…" />
              </div>

              <div>
                <label className="label">Destinations</label>
                <p className="text-xs text-gray-400 mb-2">Leave all unchecked to show to every student.</p>
                <div className="flex flex-wrap gap-2">
                  {allDestinations.map(d => {
                    const selected = form.destinations.includes(d._id);
                    return (
                      <button key={d._id} type="button" onClick={() => toggleDest(d._id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                          selected ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                        }`}>
                        {d.flag && <span>{d.flag}</span>}{d.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded text-brand-600" />
                <span className="text-sm text-gray-700 font-medium">Active</span>
              </label>
            </form>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button form="slide-tab-form" type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Slide'}
              </button>
              <button onClick={closeForm} className="btn-secondary px-6">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
