import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/helpers';

const PHASE_META = {
  university_acceptance: { label: 'University Acceptance', color: 'text-brand-600', badgeColor: 'bg-brand-100 text-brand-600' },
  visa_process:          { label: 'Visa Process',          color: 'text-orange-500', badgeColor: 'bg-orange-100 text-orange-600' },
};

const COLOR_CLASS = {
  gray:    'bg-gray-100 text-gray-600',
  blue:    'bg-blue-100 text-blue-700',
  indigo:  'bg-indigo-100 text-indigo-700',
  yellow:  'bg-yellow-100 text-yellow-700',
  green:   'bg-green-100 text-green-700',
  purple:  'bg-purple-100 text-purple-700',
  orange:  'bg-orange-100 text-orange-700',
  lime:    'bg-lime-100 text-lime-700',
  emerald: 'bg-emerald-100 text-emerald-700',
};

function getStatusMeta(key, statuses) {
  const found = statuses.find(s => s.key === key);
  if (!found) return { label: key, color: COLOR_CLASS.gray };
  return { label: found.dcLabel, color: COLOR_CLASS[found.color] || COLOR_CLASS.gray };
}

function DocumentRow({ def, statusEntry, studentId, onUpdate, badgeColor, statuses }) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const status = statusEntry?.status || 'not_requested';
  const agentNotes = statusEntry?.notes || '';
  const history = statusEntry?.history || [];
  const statusMeta = getStatusMeta(status, statuses);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.put(`/students/${studentId}/documents/${def._id}`, { status: newStatus });
      toast.success('Document status updated');
      onUpdate();
    } catch {
      toast.error('Failed to update document status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${badgeColor}`}>
          {def._phaseIdx + 1}
        </span>
        <span className="flex-1 font-medium text-gray-800 text-sm">{def.name}</span>
        {agentNotes && <span className="hidden sm:inline text-xs text-gray-400 truncate max-w-[120px]">{agentNotes}</span>}
        <span className={`badge ${statusMeta.color} shrink-0`}>{statusMeta.label}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        }
      </div>

      {open && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
          {def.notes && (
            <p className="text-xs text-gray-600 leading-relaxed">{def.notes}</p>
          )}
          {(def.steps || []).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Steps</p>
              <ol className="space-y-1">
                {def.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-[10px]">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {(def.requirements || []).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Requirements</p>
              <ul className="space-y-1">
                {def.requirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map(s => (
                <button
                  key={s.key}
                  disabled={updating || status === s.key}
                  onClick={() => handleStatusChange(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    COLOR_CLASS[s.color] || COLOR_CLASS.gray
                  } ${status === s.key ? 'ring-2 ring-offset-1 ring-brand-400' : 'opacity-60 hover:opacity-100'}`}
                >
                  {s.dcLabel}
                </button>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">History</p>
              <div className="space-y-1.5">
                {[...history].reverse().slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      <span className={`badge ${getStatusMeta(h.status, statuses).color}`}>{getStatusMeta(h.status, statuses).label}</span>
                      {h.changedByName && <span>by {h.changedByName}</span>}
                    </div>
                    <span className="text-gray-400">{formatDateTime(h.changedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DocumentTracker({ student, onUpdate }) {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    api.get('/settings/public')
      .then(r => setStatuses(r.data.documentStatuses || []))
      .catch(() => {});
  }, []);

  const allDefs = [...(student.destination?.documentDefinitions || [])]
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const statusMap = {};
  for (const doc of (student.documents || [])) {
    statusMap[String(doc.documentDefId)] = doc;
  }

  if (allDefs.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-400 text-sm">No documents configured for this destination</p>
      </div>
    );
  }

  const p1Defs = allDefs.filter(d => !d.phase || d.phase === 'university_acceptance')
    .map((d, i) => ({ ...d, _phaseIdx: i }));
  const p2Defs = allDefs.filter(d => d.phase === 'visa_process')
    .map((d, i) => ({ ...d, _phaseIdx: i }));

  const readyKeys = statuses.filter(s => s.isReady).map(s => s.key);
  const isReadyStatus = (st) => readyKeys.length
    ? readyKeys.includes(st)
    : st === 'ready' || st === 'approved';

  const countReady = (defs) => defs.filter(d => isReadyStatus(statusMap[String(d._id)]?.status)).length;

  const renderPhase = (phaseKey, defs) => {
    const meta    = PHASE_META[phaseKey];
    const isVisa  = phaseKey === 'visa_process';
    const ready   = countReady(defs);
    const borderCls = isVisa ? 'border-orange-200' : 'border-brand-200';
    const headerCls = isVisa ? 'bg-orange-50'      : 'bg-brand-50';

    return (
      <div className={`rounded-xl border-2 ${borderCls} overflow-hidden`}>
        <div className={`${headerCls} px-4 py-3 flex items-center justify-between`}>
          <span className={`text-xs font-bold uppercase tracking-wide ${meta.color}`}>{meta.label}</span>
          <span className="text-xs text-gray-400">{ready} of {defs.length} ready</span>
        </div>
        {defs.length === 0 ? (
          <p className="text-xs text-gray-400 px-4 py-3">No documents in this phase yet</p>
        ) : (
          <div className="p-3 space-y-2">
            {defs.map(def => (
              <DocumentRow
                key={def._id}
                def={def}
                statusEntry={statusMap[String(def._id)]}
                studentId={student._id}
                onUpdate={onUpdate}
                badgeColor={meta.badgeColor}
                statuses={statuses}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderPhase('university_acceptance', p1Defs)}
      {renderPhase('visa_process', p2Defs)}
    </div>
  );
}
