import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { SkeletonList } from '../components/ui/SkeletonCard';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { deadlineLabel, formatDate } from '../utils/date';

export default function Deadlines() {
  const { data, loading, error, refetch } = useFetch('/student/me/deadlines');
  const [pastOpen, setPastOpen] = useState(false);

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">My Deadlines</h1>

      {loading && <SkeletonList count={2} />}
      {!loading && error && <ErrorState onRetry={refetch} />}

      {!loading && !error && data && (
        <div className="space-y-4">
          {data.upcoming.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No upcoming deadlines"
              subtitle="Your DC agent will add them here as your application progresses"
            />
          ) : (
            <div className="space-y-3">
              {data.upcoming.map(d => (
                <DeadlineCard key={d.id} deadline={d} />
              ))}
            </div>
          )}

          {data.past.length > 0 && (
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setPastOpen(v => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-full"
              >
                {pastOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Past ({data.past.length})
              </button>
              {pastOpen && (
                <div className="space-y-3">
                  {data.past.map(d => <DeadlineCard key={d.id} deadline={d} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeadlineCard({ deadline }) {
  const label = deadlineLabel(deadline.date);
  return (
    <div className={`bg-white rounded-2xl border px-4 py-4 ${label.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{deadline.title}</p>
          <p className="text-sm text-gray-400 mt-0.5">{formatDate(deadline.date)}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${label.color} ${label.bg}`}>
          {label.text}
        </span>
      </div>
    </div>
  );
}
