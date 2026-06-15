import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { formatCurrency, formatDate } from '../../utils/helpers';

const PAGE_SIZE = 25;

export default function GrowthPage() {
  const { students, loading } = useStudents();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);

  const allPayments = useMemo(() => {
    const list = [];
    students.forEach(s => {
      (s.payments || []).forEach(p => {
        list.push({ ...p, studentName: `${s.firstName} ${s.lastName}`, studentId: s._id });
      });
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [students]);

  const categories = useMemo(() => {
    const seen = new Set();
    allPayments.forEach(p => { if (p.category) seen.add(p.category.trim()); });
    return [...seen].sort();
  }, [allPayments]);

  const filtered = useMemo(() => {
    if (selectedCategory === 'all') return allPayments;
    return allPayments.filter(p => (p.category || '').trim() === selectedCategory);
  }, [allPayments, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const setCategory = (cat) => { setSelectedCategory(cat); setPage(1); };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Payments</h2>
        <p className="text-sm text-gray-500 mt-0.5">Full payment history across all students</p>
      </div>

      <div className="card p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-brand-600" />
          <h3 className="font-semibold text-gray-900 text-sm">All Payments</h3>
          <span className="badge bg-gray-100 text-gray-500">{filtered.length} {selectedCategory !== 'all' ? `of ${allPayments.length}` : 'total'}</span>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  selectedCategory === cat ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-dashed border-gray-200">
            <CreditCard className="w-4 h-4 text-gray-300 shrink-0" />
            <p className="text-sm text-gray-400">No payments found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Method</th>
                    <th className="pb-3 pr-4">Recorded by</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageItems.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <Link to={`/students/${p.studentId}`} className="font-medium text-gray-900 hover:text-brand-600">
                          {p.studentName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                      <td className="py-3 pr-4">
                        <span className="badge bg-gray-100 text-gray-600 capitalize">{p.category || '—'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="badge bg-gray-100 text-gray-600 capitalize">
                          {(p.method || 'other').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{p.recordedByName || '—'}</td>
                      <td className="py-3 text-gray-400">{formatDate(p.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-xs text-gray-600 px-2 font-medium">{safePage} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
