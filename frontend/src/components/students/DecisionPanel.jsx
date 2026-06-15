import { useState } from 'react';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import api from '../../utils/api';

const TYPES = [
  { key: 'university_acceptance', label: 'University Acceptance' },
  { key: 'visa',                  label: 'Visa Process' },
];

function DecisionCard({ type, label, decision, studentId, applicationStopped, onUpdate }) {
  const [form, setForm]   = useState(null); // 'positive' | 'negative' | null
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.post(`/students/${studentId}/decision`, { type, outcome: form, notes });
      toast.success('Decision recorded');
      onUpdate();
      setForm(null);
      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record decision');
    } finally {
      setSaving(false);
    }
  };

  const isNegUni = type === 'university_acceptance' && decision?.outcome === 'negative';

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${
      decision?.outcome === 'positive' ? 'border-green-200 bg-green-50/40' :
      decision?.outcome === 'negative' ? 'border-red-200 bg-red-50/40' :
      'border-gray-100 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          {decision ? (
            <p className="text-xs text-gray-500 mt-0.5">
              <span className={`font-medium ${decision.outcome === 'positive' ? 'text-green-700' : 'text-red-700'}`}>
                {decision.outcome === 'positive' ? 'Positive' : 'Negative'}
              </span>
              {' '}· {decision.decidedByName}{decision.decidedAt ? ` · ${formatDate(decision.decidedAt)}` : ''}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">No decision recorded yet</p>
          )}
          {isNegUni && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full mt-1">
              ⛔ Application stopped
            </span>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => setForm(form === 'positive' ? null : 'positive')}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all ${
              form === 'positive'
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
            }`}
          >
            ✓ Positive
          </button>
          <button
            onClick={() => setForm(form === 'negative' ? null : 'negative')}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all ${
              form === 'negative'
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
            }`}
          >
            ✕ Negative
          </button>
        </div>
      </div>

      {form && (
        <div className="space-y-2 pt-1 border-t border-gray-100">
          <textarea
            className="input text-xs resize-none"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes for student (optional — included in their notification)..."
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setForm(null); setNotes(''); }}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-colors ${
                form === 'positive' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {saving ? 'Saving...' : `Record ${form} decision`}
            </button>
          </div>
        </div>
      )}

      {decision?.notes && !form && (
        <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">"{decision.notes}"</p>
      )}
    </div>
  );
}

export default function DecisionPanel({ student, onUpdate }) {
  const getDecision = (type) =>
    (student.decisions || []).find(d => d.type === type) || null;

  return (
    <div className="card p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Decisions</p>
      {TYPES.map(({ key, label }) => (
        <DecisionCard
          key={key}
          type={key}
          label={label}
          decision={getDecision(key)}
          studentId={student._id}
          applicationStopped={student.applicationStopped}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
