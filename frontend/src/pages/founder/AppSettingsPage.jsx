import { useState, useEffect } from 'react';
import { Save, ToggleLeft, ToggleRight, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import PaymentCategoriesManager from '../../components/payments/PaymentCategoriesManager';

const COLOR_OPTIONS = ['gray', 'blue', 'indigo', 'yellow', 'green', 'purple', 'orange', 'lime', 'emerald'];
const COLOR_SWATCH  = {
  gray: 'bg-gray-400', blue: 'bg-blue-400', indigo: 'bg-indigo-400',
  yellow: 'bg-yellow-400', green: 'bg-green-400', purple: 'bg-purple-400',
  orange: 'bg-orange-400', lime: 'bg-lime-400', emerald: 'bg-emerald-400',
};

export default function AppSettingsPage() {
  const [reportingEmail, setReportingEmail] = useState('');
  const [maintenance, setMaintenance]       = useState({ enabled: false, message: '' });
  const [disclaimer, setDisclaimer]         = useState({ title: 'Terms & Disclaimer', body: '' });
  const [docStatuses, setDocStatuses]           = useState([]);
  const [decisionMessages, setDecisionMessages] = useState({});
  const [openColorIdx, setOpenColorIdx]         = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [saving, setSaving]                     = useState(false);
  const [savingMaint, setSavingMaint]           = useState(false);
  const [savingDisc, setSavingDisc]             = useState(false);
  const [savingStatuses, setSavingStatuses]     = useState(false);
  const [savingDecision, setSavingDecision]     = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(r => {
        setReportingEmail(r.data.reportingEmail || '');
        setMaintenance(r.data.maintenanceMode || { enabled: false, message: '' });
        setDisclaimer(r.data.disclaimer || { title: 'Terms & Disclaimer', body: '' });
        setDocStatuses(r.data.documentStatuses || []);
        setDecisionMessages(r.data.decisionMessages || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/settings', { reportingEmail });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleMaintenance = async () => {
    const next = { ...maintenance, enabled: !maintenance.enabled };
    setMaintenance(next);
    try {
      await api.patch('/settings', { maintenanceMode: next });
      toast.success(next.enabled ? 'Maintenance mode ON — students see the notice' : 'Maintenance mode OFF — app is live');
    } catch {
      setMaintenance(maintenance); // revert
      toast.error('Failed to update maintenance mode');
    }
  };

  const saveDisclaimer = async () => {
    setSavingDisc(true);
    try {
      await api.patch('/settings', { disclaimer });
      toast.success('Disclaimer saved');
    } catch {
      toast.error('Failed to save disclaimer');
    } finally {
      setSavingDisc(false);
    }
  };

  const saveDocStatuses = async () => {
    setSavingStatuses(true);
    try {
      await api.patch('/settings', { documentStatuses: docStatuses });
      toast.success('Document statuses saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingStatuses(false);
      setOpenColorIdx(null);
    }
  };

  const addStatus = () => {
    setDocStatuses(prev => [...prev, { key: `custom_${Date.now()}`, dcLabel: '', studentLabel: '', color: 'blue', isReady: false }]);
  };

  const updateStatus = (idx, field, value) =>
    setDocStatuses(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const removeStatus = (idx) =>
    setDocStatuses(prev => prev.filter((_, i) => i !== idx));

  const saveDecisionMessages = async () => {
    setSavingDecision(true);
    try {
      await api.patch('/settings', { decisionMessages });
      toast.success('Decision messages saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingDecision(false);
    }
  };

  const saveMaintMessage = async () => {
    setSavingMaint(true);
    try {
      await api.patch('/settings', { maintenanceMode: maintenance });
      toast.success('Message saved');
    } catch {
      toast.error('Failed to save message');
    } finally {
      setSavingMaint(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">App Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">General configuration for the student app</p>
      </div>

      {/* Maintenance Mode */}
      <div className={`card p-6 space-y-4 ${maintenance.enabled ? 'ring-2 ring-orange-400' : ''}`}>
        <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Student App</h2>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-gray-900 text-sm">Maintenance Mode</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Disables the student app and shows a notice to all students
            </p>
          </div>
          <button
            onClick={toggleMaintenance}
            disabled={loading}
            className="shrink-0 mt-0.5"
            title={maintenance.enabled ? 'Disable maintenance mode' : 'Enable maintenance mode'}
          >
            {maintenance.enabled
              ? <ToggleRight className="w-8 h-8 text-orange-500" />
              : <ToggleLeft  className="w-8 h-8 text-gray-300" />
            }
          </button>
        </div>

        {maintenance.enabled && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-orange-700">⚠️ Student app is currently deactivated</p>
            <div>
              <label className="label">Message shown to students</label>
              <textarea
                className="input min-h-[90px] resize-none"
                value={maintenance.message}
                onChange={e => setMaintenance(m => ({ ...m, message: e.target.value }))}
                placeholder="We are making improvements to the app. We'll be back shortly — thank you for your patience."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={saveMaintMessage}
                disabled={savingMaint}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                {savingMaint ? 'Saving…' : 'Save Message'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Disclaimer & Terms</h2>
        <p className="text-xs text-gray-400">Shown to students as a link at the bottom of the home screen.</p>
        <div>
          <label className="label">Page Title</label>
          <input
            className="input"
            value={disclaimer.title}
            onChange={e => setDisclaimer(d => ({ ...d, title: e.target.value }))}
            placeholder="Terms & Disclaimer"
          />
        </div>
        <div>
          <label className="label">Content</label>
          <textarea
            className="input min-h-[220px] resize-y font-mono text-xs leading-relaxed"
            value={disclaimer.body}
            onChange={e => setDisclaimer(d => ({ ...d, body: e.target.value }))}
            placeholder="Write your disclaimer text here..."
          />
        </div>
        <div className="flex justify-end">
          <button onClick={saveDisclaimer} disabled={savingDisc} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {savingDisc ? 'Saving…' : 'Save Disclaimer'}
          </button>
        </div>
      </div>

      {/* General */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400">General</h2>

        <div>
          <label className="label">Student Report Email</label>
          <input
            className="input"
            type="email"
            value={loading ? '' : reportingEmail}
            onChange={e => setReportingEmail(e.target.value)}
            placeholder="e.g. support@elnadjah.com"
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1.5">
            When students tap "Send Email" in the app, their email client opens pre-addressed to this address.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            disabled={saving || loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Document Statuses */}
      <div className="card p-6 space-y-4" onClick={() => setOpenColorIdx(null)}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Document Statuses</h2>
            <p className="text-xs text-gray-400 mt-0.5">Status options shown when tracking student documents. "Done" statuses count toward completion.</p>
          </div>
          <button onClick={e => { e.stopPropagation(); addStatus(); }} className="btn-secondary text-sm flex items-center gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[1rem_1fr_1fr_2.5rem_1.5rem] gap-2 px-1">
          <span />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">DC label</span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Student label</span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Done</span>
          <span />
        </div>

        <div className="space-y-2">
          {docStatuses.map((s, idx) => (
            <div key={s.key} className="grid grid-cols-[1rem_1fr_1fr_2.5rem_1.5rem] gap-2 items-center">
              {/* Color swatch — click to open picker */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setOpenColorIdx(openColorIdx === idx ? null : idx)}
                  className={`w-4 h-4 rounded-full ${COLOR_SWATCH[s.color] || 'bg-gray-400'}`}
                />
                {openColorIdx === idx && (
                  <div className="absolute left-0 top-6 z-20 bg-white border border-gray-200 rounded-xl p-2 shadow-lg flex flex-wrap gap-1 w-28">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { updateStatus(idx, 'color', c); setOpenColorIdx(null); }}
                        className={`w-5 h-5 rounded-full ${COLOR_SWATCH[c]} ${s.color === c ? 'ring-2 ring-offset-1 ring-brand-500' : ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <input
                className="input text-xs py-1.5"
                value={s.dcLabel}
                onChange={e => updateStatus(idx, 'dcLabel', e.target.value)}
                placeholder="e.g. Under Review"
              />
              <input
                className="input text-xs py-1.5"
                value={s.studentLabel}
                onChange={e => updateStatus(idx, 'studentLabel', e.target.value)}
                placeholder="e.g. In Progress"
              />
              <div className="flex justify-center">
                <input
                  type="checkbox"
                  checked={s.isReady}
                  onChange={e => updateStatus(idx, 'isReady', e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                />
              </div>
              <button
                onClick={() => removeStatus(idx)}
                className="text-gray-300 hover:text-red-400 transition-colors flex justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-1">
          <button onClick={saveDocStatuses} disabled={savingStatuses} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {savingStatuses ? 'Saving…' : 'Save Statuses'}
          </button>
        </div>
      </div>

      {/* Decision Messages */}
      <div className="card p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Decision Popup Messages</h2>
          <p className="text-xs text-gray-400 mt-0.5">What students see as a notification when a positive or negative decision is recorded.</p>
        </div>

        {[
          { key: 'uni_positive',  label: 'University — Positive',  accent: 'text-green-700', bg: 'bg-green-50' },
          { key: 'uni_negative',  label: 'University — Negative',  accent: 'text-red-700',   bg: 'bg-red-50'   },
          { key: 'visa_positive', label: 'Visa — Positive',        accent: 'text-green-700', bg: 'bg-green-50' },
          { key: 'visa_negative', label: 'Visa — Negative',        accent: 'text-red-700',   bg: 'bg-red-50'   },
        ].map(({ key, label, accent, bg }) => (
          <div key={key} className={`${bg} rounded-xl p-4 space-y-2`}>
            <p className={`text-xs font-semibold ${accent} uppercase tracking-wide`}>{label}</p>
            <input
              className="input text-sm bg-white"
              value={decisionMessages[key]?.title || ''}
              onChange={e => setDecisionMessages(m => ({ ...m, [key]: { ...(m[key] || {}), title: e.target.value } }))}
              placeholder="Popup title (e.g. Great news!)"
            />
            <textarea
              className="input text-sm resize-none bg-white"
              rows={2}
              value={decisionMessages[key]?.message || ''}
              onChange={e => setDecisionMessages(m => ({ ...m, [key]: { ...(m[key] || {}), message: e.target.value } }))}
              placeholder="Message body shown to the student..."
            />
          </div>
        ))}

        <div className="flex justify-end">
          <button onClick={saveDecisionMessages} disabled={savingDecision} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {savingDecision ? 'Saving…' : 'Save Messages'}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-5">Finance</h2>
        <PaymentCategoriesManager />
      </div>
    </div>
  );
}
