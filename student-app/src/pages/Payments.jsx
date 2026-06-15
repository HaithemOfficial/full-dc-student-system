import { useFetch } from '../hooks/useFetch';
import { SkeletonList } from '../components/ui/SkeletonCard';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { formatDate } from '../utils/date';

const METHOD_LABELS = { cash: 'Cash', bank_transfer: 'Bank Transfer', ccp: 'CCP', other: 'Other' };

export default function Payments() {
  const { data, loading, error, refetch } = useFetch('/student/me/payments');

  const remaining = data ? data.remaining : null;

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">My Payments</h1>

      {loading && <SkeletonList count={3} />}
      {!loading && error && <ErrorState onRetry={refetch} />}

      {!loading && !error && data && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Service fee</p>
                <p className="font-bold text-gray-900">{data.serviceAmount?.toLocaleString() || 0}</p>
                <p className="text-[10px] text-gray-400">DZD</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Total paid</p>
                <p className="font-bold text-green-600">{data.totalPaid?.toLocaleString() || 0}</p>
                <p className="text-[10px] text-green-400">DZD</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Remaining</p>
                <p className={`font-bold ${remaining > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {remaining?.toLocaleString() ?? 0}
                </p>
                <p className="text-[10px] text-gray-400">DZD</p>
              </div>
            </div>

            {/* Progress bar */}
            {data.serviceAmount > 0 && (
              <div className="px-5 pb-5">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (data.totalPaid / data.serviceAmount) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 text-right">
                  {Math.round((data.totalPaid / data.serviceAmount) * 100)}% paid
                </p>
              </div>
            )}
          </div>

          {/* Payment list */}
          {data.payments.length === 0 ? (
            <EmptyState icon="💳" title="No payments yet" subtitle="Your payments will appear here once recorded" />
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment history</p>
              {data.payments.map((p, i) => (
                <div key={p._id || i} className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <span className="text-green-600 text-base">↓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{p.amount?.toLocaleString()} DZD</p>
                      {p.category && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                          {p.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(p.date)} · {METHOD_LABELS[p.method] || p.method}
                    </p>
                    {p.notes && <p className="text-xs text-gray-400 truncate mt-0.5">{p.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
