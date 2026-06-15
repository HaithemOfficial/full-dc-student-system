import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { SkeletonList } from '../components/ui/SkeletonCard';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';

const COLOR_THEMES = {
  gray:    { color: 'text-gray-500',    bg: 'bg-gray-100'   },
  blue:    { color: 'text-blue-600',    bg: 'bg-blue-50'    },
  indigo:  { color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
  yellow:  { color: 'text-yellow-700',  bg: 'bg-yellow-50'  },
  green:   { color: 'text-green-700',   bg: 'bg-green-100'  },
  purple:  { color: 'text-purple-700',  bg: 'bg-purple-50'  },
  orange:  { color: 'text-orange-700',  bg: 'bg-orange-50'  },
  lime:    { color: 'text-lime-700',    bg: 'bg-lime-50'    },
  emerald: { color: 'text-emerald-700', bg: 'bg-emerald-100'},
};

const PHASE_META = {
  university_acceptance: { icon: '🎓', bar: 'bg-brand-500' },
  visa_process:          { icon: '🛂', bar: 'bg-orange-500' },
};

function getStatusMeta(key, statuses) {
  const found = statuses.find(s => s.key === key);
  if (!found) return { label: key, color: 'text-gray-500', bg: 'bg-gray-100' };
  return { label: found.studentLabel, ...(COLOR_THEMES[found.color] || COLOR_THEMES.gray) };
}

function DocItem({ doc, statuses }) {
  const [open, setOpen] = useState(false);
  const meta = getStatusMeta(doc.status, statuses);
  const hasDetail = doc.defNotes || (doc.steps || []).length > 0 || (doc.requirements || []).length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div
        className={`px-4 py-3.5 flex items-center gap-3 ${hasDetail ? 'cursor-pointer active:bg-gray-50' : ''}`}
        onClick={() => hasDetail && setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
          {doc.agentNotes && <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.agentNotes}</p>}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${meta.color} ${meta.bg}`}>
          {meta.label}
        </span>
        {hasDetail && (
          open
            ? <ChevronUp className="w-4 h-4 text-gray-300 shrink-0" />
            : <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />
        )}
      </div>
      {open && hasDetail && (
        <div className="border-t border-gray-50 px-4 py-3 bg-gray-50 space-y-3">
          {doc.defNotes && (
            <p className="text-xs text-gray-600 leading-relaxed">{doc.defNotes}</p>
          )}
          {(doc.steps || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Steps</p>
              <ol className="space-y-1.5">
                {doc.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {(doc.requirements || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Requirements</p>
              <ul className="space-y-1.5">
                {doc.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 mt-1" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Documents() {
  const { data, loading, error, refetch } = useFetch('/student/me/documents');

  if (loading) return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">My Documents</h1>
      <SkeletonList count={4} />
    </div>
  );

  if (!loading && error) return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">My Documents</h1>
      <ErrorState onRetry={refetch} />
    </div>
  );

  const documents      = data?.documents      || [];
  const phaseLabel     = data?.phaseLabel     || 'University Acceptance';
  const activePhase    = data?.activePhase    || 'university_acceptance';
  const progress       = data?.progress       || { ready: 0, total: 0 };
  const statuses       = data?.documentStatuses || [];
  const pct = progress.total > 0 ? Math.round((progress.ready / progress.total) * 100) : 0;
  const phaseMeta = PHASE_META[activePhase] || PHASE_META.university_acceptance;

  if (!loading && documents.length === 0) return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">My Documents</h1>
      <EmptyState icon="📁" title="No documents yet" subtitle="Your DC agent will add required documents as your application progresses" />
    </div>
  );

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">My Documents</h1>
      <p className="text-sm text-gray-400 mb-5">{phaseMeta.icon} {phaseLabel}</p>

      <div className="mb-5 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{progress.ready} of {progress.total} ready</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${phaseMeta.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {documents.map(doc => (
          <DocItem key={doc._id || doc.documentDefId} doc={doc} statuses={statuses} />
        ))}
      </div>
    </div>
  );
}
