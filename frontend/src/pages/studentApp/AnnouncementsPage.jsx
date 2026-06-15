import { useState, useEffect } from 'react';
import { Plus, Send, Clock, Trash2, Eye, Copy, X, ChevronDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const TYPE_CONFIG = {
  info:        { label: 'Info',        color: 'bg-blue-100 text-blue-700',   border: 'border-l-blue-400',   dot: 'bg-blue-400' },
  important:   { label: 'Important',   color: 'bg-orange-100 text-orange-700', border: 'border-l-orange-400', dot: 'bg-orange-400' },
  urgent:      { label: 'Urgent',      color: 'bg-red-100 text-red-700',      border: 'border-l-red-400',    dot: 'bg-red-400' },
  celebration: { label: 'Celebration', color: 'bg-green-100 text-green-700',  border: 'border-l-green-400',  dot: 'bg-green-400' },
};

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-500' },
  scheduled: { label: 'Scheduled', color: 'bg-amber-100 text-amber-700' },
  sent:      { label: 'Sent',      color: 'bg-green-100 text-green-700' },
};

const BLANK_FORM = {
  title: '',
  message: '',
  type: 'info',
  target: 'all_students',
  destinations: [],
  specificStudents: [],
  scheduledFor: '',
};

function PreviewCard({ form }) {
  const cfg = TYPE_CONFIG[form.type] || TYPE_CONFIG.info;
  return (
    <div className={`rounded-2xl border-l-4 ${cfg.border} bg-white shadow-sm px-4 py-4`}>
      <div className="flex items-start gap-3">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{form.title || 'Announcement title...'}</p>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{form.message || 'Your message will appear here...'}</p>
          <p className="text-xs text-gray-400 mt-1.5">Just now</p>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [step, setStep] = useState(1);
  const [recipientCount, setRecipientCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [search, setSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [viewingId, setViewingId] = useState(null);

  const reload = () => {
    api.get('/announcements')
      .then(r => setAnnouncements(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/announcements'),
      api.get('/destinations'),
      api.get('/students'),
    ]).then(([aRes, dRes, sRes]) => {
      setAnnouncements(aRes.data);
      setDestinations(dRes.data);
      setStudents(sRes.data.students || []);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  // Live recipient count
  useEffect(() => {
    if (!composerOpen || step !== 2) return;
    setLoadingCount(true);
    const timer = setTimeout(() => {
      api.post('/announcements/preview-count', {
        target: form.target,
        destinations: form.destinations,
        specificStudents: form.specificStudents,
      }).then(r => setRecipientCount(r.data.count)).catch(() => setRecipientCount(null)).finally(() => setLoadingCount(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [form.target, form.destinations, form.specificStudents, step, composerOpen]);

  const setF = (field) => (e) => setForm(p => ({ ...p, [field]: e.target ? e.target.value : e }));

  const toggleDest = (id) => setForm(p => ({
    ...p,
    destinations: p.destinations.includes(id) ? p.destinations.filter(d => d !== id) : [...p.destinations, id],
  }));

  const toggleStudent = (id) => setForm(p => ({
    ...p,
    specificStudents: p.specificStudents.includes(id) ? p.specificStudents.filter(s => s !== id) : [...p.specificStudents, id],
  }));

  const openComposer = (prefill = null) => {
    setForm(prefill ? { ...BLANK_FORM, ...prefill, title: prefill.status === 'sent' ? `Copy of ${prefill.title}` : prefill.title } : BLANK_FORM);
    setStep(1);
    setRecipientCount(null);
    setComposerOpen(true);
  };

  const saveDraft = async () => {
    if (!form.title.trim() || !form.message.trim()) return toast.error('Title and message are required');
    setSaving(true);
    try {
      await api.post('/announcements', { ...form, status: 'draft' });
      toast.success('Saved as draft');
      reload();
      setComposerOpen(false);
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const schedule = async () => {
    if (!form.scheduledFor) return toast.error('Select a date/time to schedule');
    setSaving(true);
    try {
      await api.post('/announcements', { ...form, status: 'scheduled' });
      toast.success('Announcement scheduled');
      reload();
      setComposerOpen(false);
    } catch { toast.error('Failed to schedule'); } finally { setSaving(false); }
  };

  const sendNow = async () => {
    setSaving(true);
    try {
      const res = await api.post('/announcements', { ...form, status: 'draft' });
      await api.post(`/announcements/${res.data._id}/send`);
      toast.success(`Sent to ${res.data.recipientCount ?? recipientCount} students`);
      reload();
      setComposerOpen(false);
      setConfirmSend(false);
    } catch { toast.error('Failed to send'); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { await api.delete(`/announcements/${id}`); reload(); toast.success('Deleted'); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete'); }
  };

  const filtered = announcements.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.message.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStudents = students.filter(s =>
    !studentSearch || `${s.firstName} ${s.lastName} ${s.phone}`.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const viewingAnn = viewingId ? announcements.find(a => a._id === viewingId) : null;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-400 mt-0.5">Push messages to students in the PWA</p>
        </div>
        <button onClick={() => openComposer()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9 text-sm w-full max-w-sm"
          placeholder="Search announcements..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-3xl mb-2">📢</p>
          <p className="font-semibold text-gray-700">No announcements yet</p>
          <p className="text-sm text-gray-400 mt-1">Send your first message to students</p>
          <button onClick={() => openComposer()} className="btn-primary mt-4">Create announcement</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recipients</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(ann => {
                const typeCfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
                const statusCfg = STATUS_CONFIG[ann.status] || STATUS_CONFIG.draft;
                const date = ann.sentAt || ann.scheduledFor || ann.createdAt;
                const targetLabel = ann.target === 'all_students' ? 'All students'
                  : ann.target === 'by_destination' ? 'By destination'
                  : `${ann.specificStudents?.length || 0} students`;
                return (
                  <tr key={ann._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">{ann.title}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{ann.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${typeCfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${typeCfg.dot}`} />
                        {typeCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600">{targetLabel}</p>
                      {ann.status === 'sent' && <p className="text-xs text-gray-400">{ann.recipientCount} delivered</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setViewingId(ann._id)} className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openComposer({ ...ann, status: undefined })} className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors" title="Duplicate">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {ann.status !== 'sent' && (
                          <button onClick={() => remove(ann._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* View modal */}
      {viewingAnn && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-gray-900">{viewingAnn.title}</h3>
              <button onClick={() => setViewingId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{viewingAnn.message}</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div><span className="font-medium">Type:</span> {TYPE_CONFIG[viewingAnn.type]?.label}</div>
              <div><span className="font-medium">Status:</span> {viewingAnn.status}</div>
              <div><span className="font-medium">Sent by:</span> {viewingAnn.sentByName || '—'}</div>
              <div><span className="font-medium">Recipients:</span> {viewingAnn.recipientCount || '—'}</div>
              {viewingAnn.sentAt && <div className="col-span-2"><span className="font-medium">Sent at:</span> {new Date(viewingAnn.sentAt).toLocaleString()}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Composer modal */}
      {composerOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-900">New Announcement</h3>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {[1, 2, 3].map(s => (
                    <button
                      key={s}
                      onClick={() => setStep(s)}
                      className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${step === s ? 'bg-brand-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button onClick={() => setComposerOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">
              {/* Step 1: Write */}
              {step === 1 && (
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="label">Title *</label>
                      <input className="input" value={form.title} onChange={setF('title')} placeholder="e.g. Important update about your visa" maxLength={80} />
                      <p className="text-xs text-gray-400 mt-1">{form.title.length}/80</p>
                    </div>
                    <div>
                      <label className="label">Message *</label>
                      <textarea className="input min-h-[100px] resize-none" value={form.message} onChange={setF('message')} placeholder="Your full message to students..." />
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                          <button
                            key={key}
                            onClick={() => setForm(p => ({ ...p, type: key }))}
                            className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${form.type === key ? `${cfg.color} border-current` : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                          >
                            {cfg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Preview</p>
                    <PreviewCard form={form} />
                    <p className="text-xs text-gray-400 mt-3">This is how it will look in the student's Updates screen.</p>
                  </div>
                </div>
              )}

              {/* Step 2: Recipients */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Who should receive this announcement?</p>
                  <div className="space-y-3">
                    {[
                      { key: 'all_students', icon: '🌍', label: 'All Students', desc: 'Send to all students with PWA access' },
                      { key: 'by_destination', icon: '🎯', label: 'By Destination', desc: 'Send to students in specific destinations' },
                      { key: 'specific_students', icon: '👤', label: 'Specific Students', desc: 'Hand-pick individual students' },
                    ].map(opt => (
                      <div key={opt.key}>
                        <button
                          onClick={() => setForm(p => ({ ...p, target: opt.key }))}
                          className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${form.target === opt.key ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <span className="text-2xl mt-0.5">{opt.icon}</span>
                          <div>
                            <p className={`font-semibold text-sm ${form.target === opt.key ? 'text-brand-700' : 'text-gray-700'}`}>{opt.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                          </div>
                        </button>
                        {form.target === 'by_destination' && opt.key === 'by_destination' && (
                          <div className="mt-2 pl-4 grid grid-cols-2 gap-2">
                            {destinations.map(d => (
                              <label key={d._id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={form.destinations.includes(d._id)}
                                  onChange={() => toggleDest(d._id)}
                                  className="w-4 h-4 rounded border-gray-300 text-brand-600"
                                />
                                <span className="text-sm text-gray-700">{d.flag} {d.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {form.target === 'specific_students' && opt.key === 'specific_students' && (
                          <div className="mt-2 pl-4 space-y-2">
                            <input
                              className="input text-sm"
                              placeholder="Search students..."
                              value={studentSearch}
                              onChange={e => setStudentSearch(e.target.value)}
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2">
                              {filteredStudents.slice(0, 50).map(s => (
                                <label key={s._id} className="flex items-center gap-2 cursor-pointer py-1 px-2 hover:bg-gray-50 rounded-lg">
                                  <input
                                    type="checkbox"
                                    checked={form.specificStudents.includes(s._id)}
                                    onChange={() => toggleStudent(s._id)}
                                    className="w-4 h-4 rounded border-gray-300 text-brand-600"
                                  />
                                  <span className="text-sm text-gray-700">{s.firstName} {s.lastName}</span>
                                  <span className="text-xs text-gray-400 ml-auto">{s.phone}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 text-sm text-brand-700 font-medium">
                    {loadingCount ? 'Counting...' : recipientCount !== null ? `Will be sent to ${recipientCount} student${recipientCount !== 1 ? 's' : ''}` : '—'}
                  </div>
                </div>
              )}

              {/* Step 3: Send / Schedule */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="card p-4 border-brand-100 bg-brand-50">
                    <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-3">Preview</p>
                    <PreviewCard form={form} />
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => setConfirmSend(true)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
                    >
                      <Send className="w-4 h-4" /> Send Now
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-400">or schedule</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="datetime-local"
                        className="input flex-1 text-sm"
                        value={form.scheduledFor}
                        onChange={setF('scheduledFor')}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      <button onClick={schedule} disabled={saving || !form.scheduledFor} className="btn-secondary flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Schedule
                      </button>
                    </div>
                    <button onClick={saveDraft} disabled={saving} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                      Save as draft
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => step > 1 ? setStep(s => s - 1) : setComposerOpen(false)}
                className="btn-secondary text-sm"
              >
                {step === 1 ? 'Cancel' : '← Back'}
              </button>
              {step < 3 && (
                <button
                  onClick={() => {
                    if (step === 1 && (!form.title.trim() || !form.message.trim())) return toast.error('Title and message are required');
                    setStep(s => s + 1);
                  }}
                  className="btn-primary text-sm"
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm send modal */}
      {confirmSend && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl text-center space-y-4">
            <p className="text-3xl">📢</p>
            <p className="font-bold text-gray-900">Send this announcement?</p>
            <p className="text-sm text-gray-500">
              This will be sent to{' '}
              <span className="font-semibold text-brand-600">
                {loadingCount ? '...' : recipientCount !== null ? `${recipientCount} student${recipientCount !== 1 ? 's' : ''}` : 'all targeted students'}
              </span>
              {' '}and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSend(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={sendNow} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Sending...' : 'Confirm Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
