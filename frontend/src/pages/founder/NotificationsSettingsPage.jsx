import { useState, useEffect, useMemo } from 'react';
import { Bell, ChevronDown, ChevronRight, RotateCcw, Save, Plus, Pencil, Trash2, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// ─── Standard catalog notifications ───────────────────────────────────────────

const CATEGORY_ORDER = ['Student', 'DC Agent', 'Founders'];

const CATEGORY_CONFIG = {
  'Student':  { color: 'text-purple-600' },
  'DC Agent': { color: 'text-brand-600' },
  'Founders': { color: 'text-amber-600' },
};

const RECIPIENT_COLOR = {
  'Student PWA':            'bg-purple-100 text-purple-700',
  'Assigned DC Agent':      'bg-brand-100 text-brand-700',
  'Task Assignee':          'bg-blue-100 text-blue-700',
  'Task Creator':           'bg-blue-100 text-blue-700',
  'All Founders':           'bg-amber-100 text-amber-700',
  'Creator + All Founders': 'bg-amber-100 text-amber-700',
};

function Toggle({ enabled, onChange, saving }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(!enabled); }}
      disabled={saving}
      className={`relative shrink-0 rounded-full transition-colors focus:outline-none ${enabled ? 'bg-brand-600' : 'bg-gray-200'} ${saving ? 'opacity-60 cursor-wait' : ''}`}
      style={{ width: 40, height: 22 }}
      aria-checked={enabled}
      role="switch"
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
      />
    </button>
  );
}

function NotifCard({ notif, onSaved }) {
  const [open, setOpen]       = useState(false);
  const [enabled, setEnabled] = useState(notif.enabled);
  const [title, setTitle]     = useState(notif.titleTemplate   || notif.defaultTitle);
  const [message, setMessage] = useState(notif.messageTemplate || notif.defaultMessage);
  const [saving, setSaving]   = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setEnabled(notif.enabled);
    setTitle(notif.titleTemplate   || notif.defaultTitle);
    setMessage(notif.messageTemplate || notif.defaultMessage);
  }, [notif]);

  const isTemplateDirty =
    title   !== (notif.titleTemplate   || notif.defaultTitle) ||
    message !== (notif.messageTemplate || notif.defaultMessage);

  // Toggle auto-saves immediately
  const handleToggle = async (next) => {
    setEnabled(next);
    setToggling(true);
    try {
      await api.put(`/notification-settings/${notif.key}`, {
        enabled: next,
        titleTemplate:   title   === notif.defaultTitle   ? '' : title,
        messageTemplate: message === notif.defaultMessage ? '' : message,
      });
      onSaved();
    } catch {
      setEnabled(!next); // revert on error
      toast.error('Failed to save');
    } finally {
      setToggling(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/notification-settings/${notif.key}`, {
        enabled,
        titleTemplate:   title   === notif.defaultTitle   ? '' : title,
        messageTemplate: message === notif.defaultMessage ? '' : message,
      });
      toast.success('Saved');
      onSaved();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setTitle(notif.defaultTitle);
    setMessage(notif.defaultMessage);
  };

  const recipientClass = RECIPIENT_COLOR[notif.recipientNote] || 'bg-gray-100 text-gray-600';

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
      {/* Header row */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
        onClick={() => setOpen(v => !v)}
      >
        <Toggle enabled={enabled} onChange={handleToggle} saving={toggling} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-sm ${enabled ? 'text-gray-900' : 'text-gray-400'}`}>
              {notif.label}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${recipientClass}`}>
              {notif.recipientNote}
            </span>
            {isTemplateDirty && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                unsaved
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{notif.description}</p>
          {notif.vars?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wider">vars:</span>
              {notif.vars.map(v => (
                <code key={v} className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono leading-none">{v}</code>
              ))}
            </div>
          )}
        </div>

        {open
          ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
          : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
        }
      </div>

      {/* Expanded template editor */}
      {open && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Title</label>
            <input
              className="input text-sm w-full"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={notif.defaultTitle}
              disabled={!enabled}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Message</label>
            <textarea
              className="input text-sm w-full resize-none"
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={notif.defaultMessage}
              disabled={!enabled}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving || !isTemplateDirty}
              className="btn-primary text-sm px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save text'}
            </button>
            <button
              onClick={reset}
              className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <span className="ml-auto text-[11px] text-gray-400 truncate max-w-[220px]">
              Default: <em>{notif.defaultTitle}</em>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom notification rules ─────────────────────────────────────────────────

const TRIGGER_CONFIG = {
  stage_reached: {
    label: 'Student reaches a stage',
    vars: ['{studentName}', '{stageName}', '{destinationName}'],
    conditionType: 'stage',
  },
  document_status_changed: {
    label: 'Document status changes',
    vars: ['{studentName}', '{documentName}', '{status}', '{destinationName}'],
    conditionType: 'document',
  },
  student_assigned: {
    label: 'Student is assigned to an agent',
    vars: ['{studentName}', '{agentName}', '{destinationName}'],
    conditionType: 'destination',
  },
  visa_phase_started: {
    label: 'Visa process phase starts',
    vars: ['{studentName}', '{destinationName}'],
    conditionType: 'destination',
  },
  student_created: {
    label: 'New student is added',
    vars: ['{firstName}', '{lastName}', '{destinationName}', '{agentName}'],
    conditionType: 'destination',
  },
  payment_recorded: {
    label: 'Payment is recorded',
    vars: ['{studentName}', '{amount}', '{currency}', '{destinationName}'],
    conditionType: 'none',
  },
};

const RECIPIENT_LABELS = {
  student:        { label: 'Student',    color: 'bg-purple-100 text-purple-700' },
  assigned_agent: { label: 'DC Agent',   color: 'bg-brand-100 text-brand-700' },
  all_founders:   { label: 'Founders',   color: 'bg-amber-100 text-amber-700' },
};

const DOC_STATUSES = [
  { value: 'not_requested',          label: 'Not Requested' },
  { value: 'requested',              label: 'Requested' },
  { value: 'received',               label: 'Received' },
  { value: 'under_review',           label: 'Under Review' },
  { value: 'approved',               label: 'Approved' },
  { value: 'sent_for_translation',   label: 'Sent for Translation' },
  { value: 'translated',             label: 'Translated' },
  { value: 'sent_for_legalization',  label: 'Sent for Legalization' },
  { value: 'legalized',              label: 'Legalized' },
  { value: 'ready',                  label: 'Ready' },
];

const BLANK_RULE = {
  label: '',
  trigger: 'stage_reached',
  condition: { stageName: '', documentName: '', documentStatus: '', destinationName: '' },
  recipient: 'student',
  title: '',
  message: '',
  enabled: true,
};

function RuleModal({ existing, onClose, onSaved }) {
  const isEditing = Boolean(existing);
  const [form, setForm] = useState(existing
    ? { ...BLANK_RULE, ...existing, condition: { ...BLANK_RULE.condition, ...(existing.condition || {}) } }
    : BLANK_RULE
  );
  const [saving, setSaving]         = useState(false);
  const [destinations, setDests]    = useState([]);

  useEffect(() => {
    api.get('/destinations').then(r => setDests(r.data || [])).catch(() => {});
  }, []);

  const stageNames = useMemo(() => {
    const s = new Set();
    destinations.forEach(d => (d.pipelineStages || []).forEach(st => st.name && s.add(st.name)));
    return [...s].sort();
  }, [destinations]);

  const documentNames = useMemo(() => {
    const s = new Set();
    destinations.forEach(d => (d.documentDefinitions || []).forEach(doc => doc.name && s.add(doc.name)));
    return [...s].sort();
  }, [destinations]);

  const destNames = useMemo(() => destinations.map(d => d.name).sort(), [destinations]);

  const setF    = field => e => setForm(p => ({ ...p, [field]: e.target.value }));
  const setCond = field => e => setForm(p => ({ ...p, condition: { ...p.condition, [field]: e.target.value } }));
  const resetCond = () => setForm(p => ({ ...p, condition: { stageName: '', documentName: '', documentStatus: '', destinationName: '' } }));

  const condType = TRIGGER_CONFIG[form.trigger]?.conditionType || 'none';
  const vars     = TRIGGER_CONFIG[form.trigger]?.vars || [];

  const save = async () => {
    if (!form.label.trim())   return toast.error('Label is required');
    if (!form.title.trim())   return toast.error('Title is required');
    if (!form.message.trim()) return toast.error('Message is required');
    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/custom-notification-rules/${existing._id}`, form);
        toast.success('Rule updated');
      } else {
        await api.post('/custom-notification-rules', form);
        toast.success('Rule created');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-500" />
            <h3 className="font-bold text-gray-900">{isEditing ? 'Edit Rule' : 'New Custom Rule'}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Label */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Rule name *</label>
            <input className="input w-full" value={form.label} onChange={setF('label')} placeholder="e.g. Visa stage alert" autoFocus />
          </div>

          {/* Trigger */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Trigger — when does this fire?</label>
            <select className="input w-full" value={form.trigger} onChange={e => { setForm(p => ({ ...p, trigger: e.target.value })); resetCond(); }}>
              {Object.entries(TRIGGER_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          {/* Condition */}
          {condType !== 'none' && (
            <div className="border border-gray-100 rounded-xl p-3 space-y-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500">
                Condition <span className="text-gray-300 font-normal">(optional — leave empty to match all)</span>
              </p>

              {condType === 'stage' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Stage</label>
                  <select className="input text-sm w-full bg-white" value={form.condition.stageName} onChange={setCond('stageName')}>
                    <option value="">Any stage</option>
                    {stageNames.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {condType === 'document' && (
                <>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Document</label>
                    <select className="input text-sm w-full bg-white" value={form.condition.documentName} onChange={setCond('documentName')}>
                      <option value="">Any document</option>
                      {documentNames.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">New status</label>
                    <select className="input text-sm w-full bg-white" value={form.condition.documentStatus} onChange={setCond('documentStatus')}>
                      <option value="">Any status</option>
                      {DOC_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </>
              )}

              {condType === 'destination' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Destination</label>
                  <select className="input text-sm w-full bg-white" value={form.condition.destinationName} onChange={setCond('destinationName')}>
                    <option value="">Any destination</option>
                    {destNames.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Recipient */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Who receives this?</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(RECIPIENT_LABELS).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, recipient: key }))}
                  className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${form.recipient === key ? `${cfg.color} border-current` : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vars hint */}
          {vars.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wider">available vars:</span>
              {vars.map(v => <code key={v} className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{v}</code>)}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Notification title *</label>
            <input className="input w-full text-sm" value={form.title} onChange={setF('title')} placeholder="e.g. You've reached the visa stage!" />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Message *</label>
            <textarea className="input w-full text-sm resize-none" rows={3} value={form.message} onChange={setF('message')} placeholder="e.g. Hi {studentName}, you are now at the {stageName} stage." />
          </div>
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create rule'}
          </button>
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CustomRuleRow({ rule, onToggle, onEdit, onDelete }) {
  const triggerCfg   = TRIGGER_CONFIG[rule.trigger];
  const recipientCfg = RECIPIENT_LABELS[rule.recipient] || { label: rule.recipient, color: 'bg-gray-100 text-gray-600' };
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(rule._id, !rule.enabled);
    setToggling(false);
  };

  const conditionDesc = () => {
    const c = rule.condition || {};
    const condType = TRIGGER_CONFIG[rule.trigger]?.conditionType;
    if (condType === 'stage') {
      return c.stageName ? `stage = "${c.stageName}"` : 'any stage';
    }
    if (condType === 'document') {
      const parts = [];
      if (c.documentName)   parts.push(`doc = "${c.documentName}"`);
      if (c.documentStatus) parts.push(`status = "${DOC_STATUSES.find(s => s.value === c.documentStatus)?.label || c.documentStatus}"`);
      return parts.length ? parts.join(', ') : 'any document change';
    }
    if (condType === 'destination') {
      return c.destinationName ? `dest = "${c.destinationName}"` : 'any destination';
    }
    return '';
  };

  return (
    <div className={`border rounded-xl p-4 flex items-start gap-3 transition-colors ${rule.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
      <Toggle enabled={rule.enabled} onChange={() => handleToggle()} saving={toggling} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium text-sm ${rule.enabled ? 'text-gray-900' : 'text-gray-400'}`}>{rule.label}</span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${recipientCfg.color}`}>{recipientCfg.label}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          <span className="font-medium text-gray-500">{triggerCfg?.label}</span>
          {conditionDesc() && <span> — {conditionDesc()}</span>}
        </p>
        <p className="text-xs text-gray-500 mt-1 italic truncate">"{rule.title}"</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(rule)} className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(rule._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsSettingsPage() {
  const [settings, setSettings]   = useState([]);
  const [loadingStd, setLoadingStd] = useState(true);
  const [customRules, setCustomRules] = useState([]);
  const [loadingCustom, setLoadingCustom] = useState(true);
  const [ruleModal, setRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/notification-settings');
      setSettings(data);
    } catch {
      toast.error('Failed to load notification settings');
    } finally {
      setLoadingStd(false);
    }
  };

  const fetchCustomRules = async () => {
    try {
      const { data } = await api.get('/custom-notification-rules');
      setCustomRules(data);
    } catch {
      toast.error('Failed to load custom rules');
    } finally {
      setLoadingCustom(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCustomRules();
  }, []);

  const handleCustomToggle = async (id, enabled) => {
    try {
      await api.put(`/custom-notification-rules/${id}`, { enabled });
      setCustomRules(prev => prev.map(r => r._id === id ? { ...r, enabled } : r));
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleCustomDelete = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await api.delete(`/custom-notification-rules/${id}`);
      setCustomRules(prev => prev.filter(r => r._id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openNewRule  = () => { setEditingRule(null); setRuleModal(true); };
  const openEditRule = (rule) => { setEditingRule(rule); setRuleModal(true); };

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = settings.filter(s => s.category === cat);
    return acc;
  }, {});

  const totalEnabled  = settings.filter(s => s.enabled).length;
  const totalDisabled = settings.filter(s => !s.enabled).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-sm text-gray-400 mt-1">
            Toggle and customise every automated notification. Template variables are shown on each card.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">{totalEnabled} active</span>
          {totalDisabled > 0 && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{totalDisabled} off</span>}
        </div>
      </div>

      {/* Standard notifications */}
      {loadingStd ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : (
        CATEGORY_ORDER.map(cat => {
          const items = grouped[cat];
          if (!items?.length) return null;
          const cfg = CATEGORY_CONFIG[cat] || {};
          return (
            <div key={cat} className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Bell className={`w-4 h-4 ${cfg.color || 'text-gray-400'}`} />
                <h2 className={`text-xs font-semibold uppercase tracking-wider ${cfg.color || 'text-gray-500'}`}>{cat}</h2>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] text-gray-400">{items.length} notification{items.length !== 1 ? 's' : ''}</span>
              </div>
              {items.map(notif => (
                <NotifCard key={notif.key} notif={notif} onSaved={fetchSettings} />
              ))}
            </div>
          );
        })
      )}

      {/* Custom Rules section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-600">Custom Rules</h2>
          <div className="flex-1 h-px bg-gray-100" />
          <button onClick={openNewRule} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
            <Plus className="w-3 h-3" /> New Rule
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Create your own notification rules triggered by specific events — e.g. notify a student when they reach a particular stage, or when a document changes status.
        </p>

        {loadingCustom ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
        ) : customRules.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
            <Zap className="w-6 h-6 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No custom rules yet</p>
            <p className="text-xs text-gray-300 mt-1">Create a rule to send custom notifications on specific events</p>
            <button onClick={openNewRule} className="btn-primary text-sm mt-4 flex items-center gap-1.5 mx-auto">
              <Plus className="w-4 h-4" /> Create first rule
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {customRules.map(rule => (
              <CustomRuleRow
                key={rule._id}
                rule={rule}
                onToggle={handleCustomToggle}
                onEdit={openEditRule}
                onDelete={handleCustomDelete}
              />
            ))}
          </div>
        )}
      </div>

      {ruleModal && (
        <RuleModal
          existing={editingRule}
          onClose={() => { setRuleModal(false); setEditingRule(null); }}
          onSaved={fetchCustomRules}
        />
      )}
    </div>
  );
}
