import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

const PAGE_SIZE = 10;

export default function ActivityLog({ student }) {
  const [page, setPage] = useState(0);
  const logs = [...(student.activityLog || [])].reverse();

  if (!logs.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-gray-400">No activity recorded yet</p>
      </div>
    );
  }

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const pageLogs   = logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">Activity History</h3>
        <span className="text-xs text-gray-400">{logs.length} entries</span>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-100" />
        <div className="space-y-4">
          {pageLogs.map((log, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full bg-brand-200 border-2 border-white" />
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">{log.action}</p>
                  {log.details && <p className="text-xs text-gray-500 mt-0.5">{log.details}</p>}
                  {log.performedByName && (
                    <p className="text-xs text-gray-400 mt-0.5">by {log.performedByName}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap shrink-0">{formatDateTime(log.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Newer
          </button>
          <span className="text-xs text-gray-400">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Older <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
