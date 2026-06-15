import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, DollarSign, BarChart2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
import { useStudents } from '../../hooks/useStudents';
import { formatCurrency, formatDate } from '../../utils/helpers';
import PaymentCategoriesManager, { CATEGORY_COLORS } from '../../components/payments/PaymentCategoriesManager';

function KPICard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function BarRow({ label, sub, value, max, color = 'bg-brand-500' }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-medium truncate">{label} {sub && <span className="text-gray-400 font-normal">{sub}</span>}</span>
        <span className="shrink-0 ml-2">{formatCurrency(value)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusRow({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-medium">{label}</span>
        <span>{count} student{count !== 1 ? 's' : ''} · {pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function shortAmount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return Math.round(n / 1000) + 'K';
  return String(n);
}


export default function FinancePage() {
  const { students, loading } = useStudents();

  const allPayments = useMemo(() => {
    const list = [];
    students.forEach(s => {
      (s.payments || []).forEach(p => {
        list.push({ ...p, studentName: `${s.firstName} ${s.lastName}`, studentId: s._id });
      });
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [students]);

  // Only "Service Fee" payments count as agency revenue
  const revenuePays = useMemo(() =>
    allPayments.filter(p => (p.category || '').toLowerCase().trim() === 'service fee'),
    [allPayments]
  );

  // Per-student service fee totals (used for status and breakdowns)
  const sfPaidByStudent = useMemo(() => {
    const map = {};
    revenuePays.forEach(p => {
      const id = String(p.studentId);
      map[id] = (map[id] || 0) + p.amount;
    });
    return map;
  }, [revenuePays]);

  const totalContract  = students.reduce((sum, s) => sum + (s.serviceAmount || 0), 0);
  const totalCollected = revenuePays.reduce((sum, p) => sum + p.amount, 0);
  const outstanding    = totalContract - totalCollected;
  const collectionRate = totalContract > 0 ? Math.round((totalCollected / totalContract) * 100) : 0;

  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const amount = revenuePays
        .filter(p => isWithinInterval(new Date(p.date), { start, end }))
        .reduce((sum, p) => sum + p.amount, 0);
      months.push({ label: format(d, 'MMM'), year: format(d, 'yyyy'), amount });
    }
    return months;
  }, [revenuePays]);

  const maxMonthly = Math.max(...monthlyData.map(m => m.amount), 1);

  const fullyPaid     = students.filter(s => s.serviceAmount > 0 && (sfPaidByStudent[String(s._id)] || 0) >= s.serviceAmount);
  const partiallyPaid = students.filter(s => (sfPaidByStudent[String(s._id)] || 0) > 0 && (sfPaidByStudent[String(s._id)] || 0) < s.serviceAmount);
  const notPaid       = students.filter(s => !(sfPaidByStudent[String(s._id)] || 0) && s.serviceAmount > 0);
  const noContract    = students.filter(s => !s.serviceAmount);

  const byDestination = useMemo(() => {
    const map = {};
    students.forEach(s => {
      const key = s.destinationName || 'Unknown';
      if (!map[key]) map[key] = { name: key, collected: 0, contract: 0 };
      map[key].contract  += s.serviceAmount || 0;
      map[key].collected += sfPaidByStudent[String(s._id)] || 0;
    });
    return Object.values(map).sort((a, b) => b.collected - a.collected);
  }, [students, sfPaidByStudent]);

  const byAgent = useMemo(() => {
    const map = {};
    students.forEach(s => {
      const key = s.assignedTo?.name || s.assignedToName || 'Unknown';
      if (!map[key]) map[key] = { name: key, collected: 0, contract: 0, count: 0 };
      map[key].contract  += s.serviceAmount || 0;
      map[key].collected += sfPaidByStudent[String(s._id)] || 0;
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.collected - a.collected);
  }, [students, sfPaidByStudent]);

  const byMethod = useMemo(() => {
    const map = {};
    revenuePays.forEach(p => { map[p.method] = (map[p.method] || 0) + p.amount; });
    return [
      { label: 'Cash',          value: map.cash          || 0 },
      { label: 'Bank Transfer', value: map.bank_transfer  || 0 },
      { label: 'CCP',           value: map.ccp           || 0 },
      { label: 'Other',         value: map.other         || 0 },
    ].filter(m => m.value > 0);
  }, [revenuePays]);

  const maxDest   = Math.max(...byDestination.map(d => d.collected), 1);
  const maxAgent  = Math.max(...byAgent.map(a => a.collected), 1);
  const maxMethod = Math.max(...byMethod.map(m => m.value), 1);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Finance</h2>
        <p className="text-sm text-gray-500 mt-0.5">Service fee revenue across all students</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Contract Value"   value={formatCurrency(totalContract)}  icon={DollarSign}   color="bg-brand-100 text-brand-600" />
        <KPICard label="Collected"        value={formatCurrency(totalCollected)} icon={CheckCircle}  color="bg-green-100 text-green-600" />
        <KPICard label="Outstanding"      value={formatCurrency(outstanding)}    icon={AlertCircle}  color={outstanding > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'} />
        <KPICard label="Collection Rate"  value={`${collectionRate}%`}           icon={TrendingUp}   color={collectionRate >= 80 ? 'bg-green-100 text-green-600' : collectionRate >= 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'} />
      </div>

      {/* Collection progress bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">Overall Collection Progress</h3>
          <span className="text-sm font-bold text-gray-700">{collectionRate}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${collectionRate >= 80 ? 'bg-green-500' : collectionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${collectionRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{formatCurrency(totalCollected)} collected</span>
          <span>{formatCurrency(outstanding)} remaining</span>
        </div>
      </div>

      {/* Monthly collections chart */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-4 h-4 text-brand-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Monthly Collections — last 12 months</h3>
        </div>
        <div className="flex items-end gap-1 h-40">
          {monthlyData.map((m, i) => {
            const barH = maxMonthly > 0 ? Math.max((m.amount / maxMonthly) * 100, m.amount > 0 ? 3 : 0) : 0;
            const isCurrentMonth = i === 11;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                {m.amount > 0 && (
                  <span className="text-[9px] text-gray-400 absolute -top-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {shortAmount(m.amount)}
                  </span>
                )}
                <div className="w-full flex items-end justify-center" style={{ height: 120 }}>
                  <div
                    className={`w-full rounded-t-sm transition-all ${isCurrentMonth ? 'bg-brand-600' : 'bg-brand-300 group-hover:bg-brand-400'}`}
                    style={{ height: `${barH}%` }}
                    title={formatCurrency(m.amount)}
                  />
                </div>
                <span className={`text-[10px] ${isCurrentMonth ? 'text-brand-600 font-semibold' : 'text-gray-400'}`}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment status */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Student Payment Status</h3>
          <div className="space-y-3">
            <StatusRow label="Fully Paid"      count={fullyPaid.length}     total={students.length} color="bg-green-500" />
            <StatusRow label="Partially Paid"  count={partiallyPaid.length} total={students.length} color="bg-yellow-400" />
            <StatusRow label="Not Paid"        count={notPaid.length}       total={students.length} color="bg-red-400" />
            {noContract.length > 0 && (
              <StatusRow label="No Contract Set" count={noContract.length}  total={students.length} color="bg-gray-300" />
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-green-600">{fullyPaid.length}</p>
              <p className="text-xs text-gray-400">Fully paid</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-500">{partiallyPaid.length}</p>
              <p className="text-xs text-gray-400">Partial</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-500">{notPaid.length}</p>
              <p className="text-xs text-gray-400">Unpaid</p>
            </div>
          </div>
        </div>

        {/* Revenue by destination */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Revenue by Destination</h3>
          {byDestination.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {byDestination.map(d => (
                <BarRow key={d.name} label={d.name} value={d.collected} max={maxDest} color="bg-brand-500" />
              ))}
            </div>
          )}
        </div>

        {/* Revenue by agent */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Revenue by Agent</h3>
          {byAgent.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {byAgent.map(a => (
                <BarRow
                  key={a.name}
                  label={a.name}
                  sub={`(${a.count} student${a.count !== 1 ? 's' : ''})`}
                  value={a.collected}
                  max={maxAgent}
                  color="bg-indigo-400"
                />
              ))}
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Payment Methods</h3>
          {byMethod.length === 0 ? (
            <p className="text-sm text-gray-400">No payments recorded yet</p>
          ) : (
            <div className="space-y-3">
              {byMethod.map(m => (
                <BarRow key={m.label} label={m.label} value={m.value} max={maxMethod} color="bg-teal-400" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Categories */}
      <div className="card p-5">
        <PaymentCategoriesManager />
      </div>

      {/* Recent payments table */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-brand-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Recent Payments</h3>
          <span className="badge bg-gray-100 text-gray-500">{allPayments.length} total</span>
        </div>
        {allPayments.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-dashed border-gray-200">
            <CreditCard className="w-4 h-4 text-gray-300 shrink-0" />
            <p className="text-sm text-gray-400">No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Method</th>
                  <th className="pb-3 pr-4">Recorded by</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allPayments.slice(0, 25).map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <Link to={`/students/${p.studentId}`} className="font-medium text-gray-900 hover:text-brand-600">
                        {p.studentName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-green-600">{formatCurrency(p.amount)}</td>
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
        )}
      </div>
    </div>
  );
}
