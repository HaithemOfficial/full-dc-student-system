import { useState, useEffect } from 'react';
import { Save, Search, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const TABS = ['Settings', 'Codes Directory'];

const DEFAULT_SETTINGS = {
  active: true,
  referrerDiscount: 5000,
  referredDiscount: 5000,
  discountAppliesTo: 'second installment',
  rulesText: '',
  howToUseText: '',
  popupTitle: 'Share & Save Together 🎁',
  popupMessage: '',
};

// ── Settings tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const [form, setForm]     = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    api.get('/referral/settings')
      .then(r => setForm({ ...DEFAULT_SETTINGS, ...r.data }))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const setNum = (f) => (e) => setForm(p => ({ ...p, [f]: Number(e.target.value) }));

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/referral/settings', form);
      toast.success('Referral settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Active toggle */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">Referral Program</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {form.active ? 'Active — students see the referral program in their app' : 'Inactive — referral UI is hidden from students'}
          </p>
        </div>
        <button
          onClick={() => setForm(p => ({ ...p, active: !p.active }))}
          className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${form.active ? 'bg-brand-600' : 'bg-gray-200'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Discount amounts */}
      <div className="card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Discount Amounts</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Referrer discount (student who shared)</label>
            <div className="flex items-center gap-2">
              <input className="input flex-1" type="number" min="0" value={form.referrerDiscount} onChange={setNum('referrerDiscount')} />
              <span className="text-sm text-gray-400 shrink-0">DA</span>
            </div>
          </div>
          <div>
            <label className="label">Referred discount (new student)</label>
            <div className="flex items-center gap-2">
              <input className="input flex-1" type="number" min="0" value={form.referredDiscount} onChange={setNum('referredDiscount')} />
              <span className="text-sm text-gray-400 shrink-0">DA</span>
            </div>
          </div>
        </div>
        <div>
          <label className="label">Discount applies to</label>
          <input className="input" value={form.discountAppliesTo} onChange={set('discountAppliesTo')} placeholder="e.g. second installment" />
        </div>
      </div>

      {/* Popup content */}
      <div className="card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Popup Content</h2>
        <div>
          <label className="label">Popup Title</label>
          <input className="input" value={form.popupTitle} onChange={set('popupTitle')} placeholder="Share & Save Together 🎁" />
        </div>
        <div>
          <label className="label">Popup Message</label>
          <input className="input" value={form.popupMessage} onChange={set('popupMessage')} placeholder="Short message shown on the popup…" />
        </div>
      </div>

      {/* Full content */}
      <div className="card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Content</h2>
        <div>
          <label className="label">Rules Text</label>
          <textarea className="input resize-none text-sm" rows={4} value={form.rulesText} onChange={set('rulesText')} placeholder="Full explanation of the referral program shown to students…" />
        </div>
        <div>
          <label className="label">How To Use</label>
          <textarea className="input resize-none text-sm" rows={5} value={form.howToUseText} onChange={set('howToUseText')} placeholder="Step-by-step instructions…" />
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ── Codes Directory tab ───────────────────────────────────────────────────────
function CodesTab() {
  const [lookup, setLookup]         = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError]   = useState('');
  const [lookingUp, setLookingUp]       = useState(false);

  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [data, setData]       = useState({ students: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState('');

  const load = (p = 1, q = search) => {
    setLoading(true);
    api.get(`/referral/codes?search=${encodeURIComponent(q)}&page=${p}&limit=20`)
      .then(r => { setData(r.data); setPage(p); })
      .catch(() => toast.error('Failed to load codes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, ''); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(1, search);
  };

  const doLookup = async () => {
    if (!lookup.trim()) return;
    setLookingUp(true);
    setLookupResult(null);
    setLookupError('');
    try {
      const { data: s } = await api.get(`/referral/lookup?code=${encodeURIComponent(lookup.trim())}`);
      setLookupResult(s);
    } catch (e) {
      setLookupError(e.response?.data?.message || 'Code not found');
    } finally {
      setLookingUp(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Quick lookup */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm">Quick Code Lookup</h2>
        <p className="text-xs text-gray-400">Type a student's referral code to see who it belongs to — useful during a sales call.</p>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={lookup}
            onChange={e => setLookup(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && doLookup()}
            placeholder="e.g. KARIM-4821"
          />
          <button onClick={doLookup} disabled={lookingUp || !lookup.trim()} className="btn-primary px-4">
            {lookingUp ? 'Looking up…' : 'Look Up'}
          </button>
        </div>
        {lookupResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
              {lookupResult.firstName?.[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{lookupResult.firstName} {lookupResult.lastName}</p>
              <p className="text-xs text-gray-500">{lookupResult.phone} · {lookupResult.destinationName} · {lookupResult.currentStageName}</p>
            </div>
          </div>
        )}
        {lookupError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{lookupError}</p>
        )}
      </div>

      {/* Directory */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, or code…"
            />
          </div>
          <button type="submit" className="btn-secondary px-4">Search</button>
        </form>

        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : data.students.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-400 text-sm">No students with referral codes found.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Destination</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Referral Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.students.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                      {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.destinationName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.currentStageName || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {s.referralCode}
                        </span>
                        <button
                          onClick={() => copyCode(s.referralCode)}
                          className="p-1 text-gray-400 hover:text-brand-600 transition-colors"
                          title="Copy code"
                        >
                          {copied === s.referralCode
                            ? <Check className="w-3.5 h-3.5 text-green-500" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">{data.total} total · Page {data.page} of {data.pages}</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => load(page - 1)}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => load(page + 1)}
                    disabled={page >= data.pages}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReferralPage() {
  const [tab, setTab] = useState(0);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configure the referral program and manage student codes</p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <SettingsTab />}
      {tab === 1 && <CodesTab />}
    </div>
  );
}
