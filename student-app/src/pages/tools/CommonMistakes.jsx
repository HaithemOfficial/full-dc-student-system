import { useState } from 'react';
import { ChevronDown, ChevronUp, Lock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFetch } from '../../hooks/useFetch';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';

export default function CommonMistakes() {
  const { data: content, loading, error, refetch } = useFetch('/student/me/content');
  const [expanded, setExpanded] = useState(null);

  const shell = (children) => (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Common Mistakes</h1>
        <p className="text-xs text-gray-400 mt-0.5">Tap a mistake to learn more</p>
      </div>
      {children}
    </div>
  );

  if (loading) return shell(<SkeletonList count={5} />);
  if (error)   return shell(<ErrorState onRetry={refetch} />);

  const mistakes = content?.interviewMistakes || [];

  if (mistakes.length === 0) return shell(
    <EmptyState icon="⚠️" title="Common mistakes guide coming soon" subtitle="Your agent will add common interview mistakes here." />
  );

  return shell(
    <div className="space-y-2">
      {mistakes.map((m, i) => {
        if (m.locked) return (
          <button
            key={m._id}
            onClick={() => toast(m.lockedReason || 'Not available at your current stage.', { icon: '🔒' })}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 opacity-60 text-left"
          >
            <Lock className="w-4 h-4 text-gray-300 shrink-0" />
            <span className="text-sm font-medium text-gray-400 flex-1">{m.title}</span>
          </button>
        );

        const isOpen = expanded === i;
        return (
          <div key={m._id} className={`rounded-2xl border-2 overflow-hidden transition-colors ${isOpen ? 'border-red-200 bg-red-50/40' : 'border-gray-100 bg-white'}`}>
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors"
            >
              <AlertTriangle className={`w-4 h-4 shrink-0 ${isOpen ? 'text-red-500' : 'text-amber-400'}`} />
              <span className={`flex-1 text-sm font-semibold leading-snug ${isOpen ? 'text-red-800' : 'text-gray-900'}`}>{m.title}</span>
              {isOpen
                ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              }
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-0 space-y-3 border-t border-red-100">
                <p className="text-sm text-gray-700 leading-relaxed pt-3">{m.explanation}</p>
                {m.tip && (
                  <div className="flex items-start gap-2 bg-white border border-green-200 rounded-xl p-3">
                    <span className="text-base shrink-0">💡</span>
                    <p className="text-sm text-green-800 leading-relaxed">{m.tip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
