import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, AlertTriangle, Flag, TrendingUp, ArrowRight,
  ClipboardList, AlarmClock, CheckCircle, XCircle,
  AlertCircle, Users, DollarSign, Trophy, ThumbsDown, BarChart2,
} from 'lucide-react';
import api from '../../utils/api';
import { useActionItems } from '../../hooks/useActionItems';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatCurrency } from '../../utils/helpers';
import ActionItemForm from '../../components/tasks/ActionItemForm';

// ── Tiny helpers ─────────────────────────────────────────────────
function SkeletonBlock({ className }) {
  return <div className={`rounded-xl bg-gray-100 animate-pulse ${className}`} />;
}

function KPICard({ icon: Icon, label, value, sub, color, href }) {
  const inner = (
    <div className={`card p-5 flex items-center gap-4 ${href ? 'hover:shadow-md transition-shadow' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

function Chip({ student, colorClass }) {
  return (
    <Link
      to={`/students/${student._id}`}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-opacity hover:opacity-75 ${colorClass}`}
      title={`${student.stage || ''} · ${student.destination || ''}`}
    >
      {student.name}
    </Link>
  );
}

function AlertRow({ icon: Icon, label, iconColor, students, chipColor, moreHref }) {
  if (!students?.length) return null;
  const shown = students.slice(0, 8);
  const extra = students.length - shown.length;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-semibold ${iconColor}`}>{label} ({students.length})</span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {shown.map(s => <Chip key={String(s._id)} student={s} colorClass={chipColor} />)}
          {extra > 0 && (
            <Link to={moreHref || '/students'} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
              +{extra} more
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Win rate badge: green ≥70%, yellow ≥50%, red <50%, gray = no data
function WinRate({ rate }) {
  if (rate === null || rate === undefined) return <span className="text-gray-300 text-xs">—</span>;
  const color = rate >= 70 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-500';
  return <span className={`text-sm font-bold ${color}`}>{rate}%</span>;
}

const PERIOD_OPTIONS = [
  { value: 'all',     label: 'All time' },
  { value: 'year',    label: 'This year' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'month',   label: 'This month' },
];

export default function FounderDashboard() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState('all');
  const [showForm, setShowForm] = useState(false);
  const { items: allItems, refetch: refetchTasks } = useActionItems({ status: 'pending' });

  const myTasks = allItems.filter(i => String(i.assignedTo) === String(user._id));

  const sortedTasks = useMemo(() => {
    const now = new Date();
    return [...myTasks].sort((a, b) => {
      const aOver = a.dueDate && new Date(a.dueDate) < now;
      const bOver = b.dueDate && new Date(b.dueDate) < now;
      if (aOver !== bOver) return aOver ? -1 : 1;
      if (a.priority !== b.priority) return a.priority === 'urgent' ? -1 : 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      return a.dueDate ? -1 : b.dueDate ? 1 : 0;
    });
  }, [myTasks]);

  useEffect(() => {
    setLoading(true);
    const query = period !== 'all' ? `?period=${period}` : '';
    api.get(`/students/dashboard${query}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [period]);

  const dashboardData = data || {};
  const {
    total = 0,
    newThisMonth = 0,
    newLastMonth = 0,
    urgent = [],
    flagged = [],
    stopped = [],
    noContract = [],
    finance = {},
    byStage = [],
    agents = [],
    upcomingDeadlines = [],
    decisions = {},
    positiveUnpaid = [],
    pipelineByDestination = [],
    destinationPerf = [],
    studentsByMonth = [],
  } = dashboardData;

  const monthlyData = useMemo(() => {
    const now2 = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now2.getFullYear(), now2.getMonth() - (11 - i), 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const entry = studentsByMonth.find(x => x.year === y && x.month === m);
      return {
        label: d.toLocaleDateString('en-GB', { month: 'short' }),
        count: entry?.count || 0,
        isCurrent: i === 11,
      };
    });
  }, [studentsByMonth]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-10 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonBlock key={i} className="h-24" />)}
        </div>
        {[1,2,3,4].map(i => <SkeletonBlock key={i} className="h-40" />)}
      </div>
    );
  }

  const now      = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);

  const totalAlerts   = urgent.length + flagged.length + stopped.length + noContract.length + upcomingDeadlines.length;
  const growth        = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : null;
  const maxStage      = Math.max(...byStage.map(s => s.count), 1);
  const monthGrowth   = finance.collectedLastMonth > 0
    ? Math.round(((finance.collectedThisMonth - finance.collectedLastMonth) / finance.collectedLastMonth) * 100)
    : null;

  const urgentTaskCount  = myTasks.filter(i => i.priority === 'urgent').length;
  const overdueTaskCount = myTasks.filter(i => i.dueDate && new Date(i.dueDate) < now).length;
  const totalPositiveUnpaidDebt = positiveUnpaid.reduce((s, x) => s + x.remaining, 0);

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{greeting}, {user.name.split(' ')[0]}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-secondary text-sm shrink-0">+ New Item</button>
      </div>

      {/* ── Period Filter ───────────────────────────────────────── */}
      <div className="flex gap-1.5 flex-wrap">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              period === opt.value
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── New Students per Month ─────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <h3 className="font-semibold text-gray-900 text-sm">New Students — Last 12 Months</h3>
          </div>
          <span className="text-xs text-gray-400">{total} total active</span>
        </div>
        <div className="flex items-end gap-1" style={{ height: 96 }}>
          {monthlyData.map((m, i) => {
            const pct = maxMonthly > 0 ? (m.count / maxMonthly) * 100 : 0;
            const barH = m.count > 0 ? Math.max(pct, 4) : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full">
                {m.count > 0 && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-1 rounded shadow-sm z-10">
                    {m.count}
                  </span>
                )}
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t transition-all ${m.isCurrent ? 'bg-brand-600' : 'bg-brand-200 group-hover:bg-brand-400'}`}
                    style={{ height: `${barH}%` }}
                  />
                </div>
                <span className={`text-[10px] leading-none ${m.isCurrent ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={GraduationCap}
          label="Active Students"
          value={total}
          sub={newThisMonth > 0 ? `+${newThisMonth} this month` : 'None added this month'}
          color="bg-brand-100 text-brand-600"
          href="/students"
        />
        <KPICard
          icon={TrendingUp}
          label="New This Month"
          value={`+${newThisMonth}`}
          sub={growth !== null ? `${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth)}% vs last month` : undefined}
          color={newThisMonth >= newLastMonth ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}
        />
        <KPICard
          icon={DollarSign}
          label="Collected This Month"
          value={formatCurrency(finance.collectedThisMonth)}
          sub={monthGrowth !== null
            ? `${monthGrowth >= 0 ? '↑' : '↓'} ${Math.abs(monthGrowth)}% vs last month`
            : `Last month: ${formatCurrency(finance.collectedLastMonth)}`}
          color={finance.collectedThisMonth > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}
        />
        <KPICard
          icon={totalAlerts > 0 ? AlertTriangle : CheckCircle}
          label={totalAlerts > 0 ? 'Issues' : 'All Clear'}
          value={totalAlerts}
          sub={totalAlerts === 0
            ? 'No problems detected'
            : [
                urgent.length > 0       && `${urgent.length} urgent`,
                upcomingDeadlines.length > 0 && `${upcomingDeadlines.length} deadline${upcomingDeadlines.length !== 1 ? 's' : ''}`,
                positiveUnpaid.length > 0   && `${positiveUnpaid.length} unpaid after accept`,
              ].filter(Boolean).join(' · ')
          }
          color={totalAlerts === 0 ? 'bg-green-100 text-green-600' : urgent.length > 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}
        />
      </div>

      {/* ── Hormozi-style metrics row ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Avg Contract</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(finance.avgContractValue)}</p>
          <p className="text-xs text-gray-400 mt-0.5">per student</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Uni Win Rate</p>
          <p className="text-xl font-bold text-gray-900">
            {(decisions.university.positive + decisions.university.negative) > 0
              ? `${Math.round((decisions.university.positive / (decisions.university.positive + decisions.university.negative)) * 100)}%`
              : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{decisions.university.positive} accepted · {decisions.university.negative} rejected</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Visa Win Rate</p>
          <p className="text-xl font-bold text-gray-900">
            {(decisions.visa.positive + decisions.visa.negative) > 0
              ? `${Math.round((decisions.visa.positive / (decisions.visa.positive + decisions.visa.negative)) * 100)}%`
              : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{decisions.visa.positive} approved · {decisions.visa.negative} refused</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Post-Accept Rate</p>
          <p className={`text-xl font-bold ${
            finance.accCollectionRate === null ? 'text-gray-400' :
            finance.accCollectionRate >= 80 ? 'text-green-600' :
            finance.accCollectionRate >= 50 ? 'text-yellow-600' : 'text-red-500'
          }`}>
            {finance.accCollectionRate !== null ? `${finance.accCollectionRate}%` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {finance.accStudents > 0
              ? `${formatCurrency(finance.accOutstanding)} still due`
              : 'No accepted students yet'}
          </p>
        </div>
      </div>

      {/* ── Alerts ─────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          {totalAlerts > 0
            ? <AlertTriangle className="w-4 h-4 text-red-500" />
            : <CheckCircle className="w-4 h-4 text-green-500" />}
          <h3 className="font-semibold text-gray-900 text-sm">
            {totalAlerts > 0 ? 'Needs Attention' : 'All Clear'}
          </h3>
          {totalAlerts > 0 && (
            <span className="badge bg-red-100 text-red-700">{totalAlerts} issue{totalAlerts !== 1 ? 's' : ''}</span>
          )}
        </div>
        {totalAlerts === 0 ? (
          <p className="text-sm text-gray-400 pt-1">No urgent cases, flagged students, or upcoming deadlines. Everything looks good.</p>
        ) : (
          <div className="mt-1">
            <AlertRow icon={AlertTriangle} label="Urgent"                 iconColor="text-red-500"    students={urgent}     chipColor="bg-red-50 text-red-700 border-red-100"       moreHref="/students?urgent=true" />
            {upcomingDeadlines.length > 0 && (
              <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                <AlarmClock className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-orange-500">Upcoming Deadlines ({upcomingDeadlines.length})</span>
                  <div className="space-y-1.5 mt-2">
                    {upcomingDeadlines.slice(0, 8).map((d, i) => (
                      <Link key={i} to={`/students/${d.studentId}`} className="flex items-center gap-2 text-xs group">
                        <span className="font-medium text-gray-700 group-hover:text-brand-600 transition-colors">{d.name}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-500">{d.label}</span>
                        <span className="text-gray-300">·</span>
                        <span className={`font-semibold ${d.daysLeft <= 3 ? 'text-red-600' : d.daysLeft <= 7 ? 'text-orange-500' : 'text-yellow-600'}`}>
                          {d.daysLeft === 0 ? 'Today' : d.daysLeft === 1 ? 'Tomorrow' : `${d.daysLeft} days`}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <AlertRow icon={Flag}         label="Flagged"                 iconColor="text-yellow-500" students={flagged}    chipColor="bg-yellow-50 text-yellow-700 border-yellow-100" moreHref="/students?flagged=true" />
            <AlertRow icon={XCircle}      label="Application Stopped"     iconColor="text-orange-500" students={stopped}    chipColor="bg-orange-50 text-orange-700 border-orange-100" />
            <AlertRow icon={AlertCircle}  label="No Contract Signed"      iconColor="text-gray-400"   students={noContract} chipColor="bg-gray-100 text-gray-600 border-gray-200" />
          </div>
        )}
      </div>

      {/* ── Revenue Opportunity (Accepted but unpaid) ──────────── */}
      {positiveUnpaid.length > 0 && (
        <div className="card p-5 border border-amber-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Revenue Opportunity</h3>
              <span className="badge bg-amber-100 text-amber-700">{positiveUnpaid.length} student{positiveUnpaid.length !== 1 ? 's' : ''}</span>
            </div>
            <span className="text-sm font-bold text-amber-600">{formatCurrency(totalPositiveUnpaidDebt)} collectible</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Positive university decision received — service fee not yet paid in full.</p>
          <div className="space-y-2">
            {positiveUnpaid.slice(0, 8).map(s => (
              <Link key={String(s._id)} to={`/students/${s._id}`}
                className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.destination} · {s.stage}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-amber-600">{formatCurrency(s.remaining)}</p>
                  <p className="text-xs text-gray-400">of {formatCurrency(s.contract)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Pipeline by Destination ─────────────────────────────── */}
      {pipelineByDestination.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Pipeline by Destination</h3>
            </div>
            <Link to="/students" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              All students <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-5">
            {pipelineByDestination.map(dest => {
              const destMax = Math.max(...dest.stages.map(s => s.count), 1);
              return (
                <div key={dest.destination}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">{dest.destination}</span>
                    <span className="text-xs text-gray-400">{dest.total} student{dest.total !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-1.5">
                    {dest.stages.map(s => (
                      <div key={s.stage || 'none'} className="flex items-center gap-2">
                        <span className="w-36 text-xs text-gray-500 truncate text-right shrink-0" title={s.stage || 'No stage'}>
                          {s.stage || 'No stage'}
                        </span>
                        <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-brand-400 rounded transition-all"
                            style={{ width: `${(s.count / destMax) * 100}%` }}
                          />
                        </div>
                        <span className="w-6 text-xs font-bold text-gray-700 text-right shrink-0">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Decisions Overview ──────────────────────────────────── */}
      {(decisions.university.positive + decisions.university.negative + decisions.visa.positive + decisions.visa.negative) > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* University */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900 text-sm">University Decisions</h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{decisions.university.positive}</p>
                <p className="text-xs text-gray-400 mt-1">Accepted</p>
              </div>
              <div className="flex-1">
                {(decisions.university.positive + decisions.university.negative) > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Win rate</span>
                      <span className="font-semibold text-gray-700">
                        {Math.round((decisions.university.positive / (decisions.university.positive + decisions.university.negative)) * 100)}%
                      </span>
                    </div>
                    <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(decisions.university.positive / (decisions.university.positive + decisions.university.negative)) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{decisions.university.negative}</p>
                <p className="text-xs text-gray-400 mt-1">Rejected</p>
              </div>
            </div>
          </div>

          {/* Visa */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Visa Decisions</h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{decisions.visa.positive}</p>
                <p className="text-xs text-gray-400 mt-1">Approved</p>
              </div>
              <div className="flex-1">
                {(decisions.visa.positive + decisions.visa.negative) > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Win rate</span>
                      <span className="font-semibold text-gray-700">
                        {Math.round((decisions.visa.positive / (decisions.visa.positive + decisions.visa.negative)) * 100)}%
                      </span>
                    </div>
                    <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(decisions.visa.positive / (decisions.visa.positive + decisions.visa.negative)) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{decisions.visa.negative}</p>
                <p className="text-xs text-gray-400 mt-1">Refused</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Destination Performance ─────────────────────────────── */}
      {destinationPerf.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-brand-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Destination Performance</h3>
          </div>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 pr-4">Destination</th>
                  <th className="pb-3 pr-4 text-center">Students</th>
                  <th className="pb-3 pr-4 text-center">Avg Contract</th>
                  <th className="pb-3 pr-4 text-center">Collected</th>
                  <th className="pb-3 pr-4 text-center">Coll. Rate</th>
                  <th className="pb-3 pr-4 text-center">Uni Win</th>
                  <th className="pb-3 text-center">Visa Win</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {destinationPerf.map(d => (
                  <tr key={d.name} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{d.name}</p>
                      {(d.urgent > 0 || d.stopped > 0) && (
                        <div className="flex gap-1.5 mt-0.5">
                          {d.urgent  > 0 && <span className="badge bg-red-100 text-red-700 text-[10px]">{d.urgent} urgent</span>}
                          {d.stopped > 0 && <span className="badge bg-orange-100 text-orange-700 text-[10px]">{d.stopped} stopped</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-center font-semibold text-gray-700">{d.total}</td>
                    <td className="py-3 pr-4 text-center text-gray-600">{d.avgContract > 0 ? formatCurrency(d.avgContract) : '—'}</td>
                    <td className="py-3 pr-4 text-center text-gray-600">{formatCurrency(d.collected)}</td>
                    <td className="py-3 pr-4 text-center">
                      <WinRate rate={d.contract > 0 ? d.rate : null} />
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <WinRate rate={d.uniWinRate} />
                      {d.uniWinRate !== null && (
                        <p className="text-[10px] text-gray-400">{d.uniPositive}+{d.uniNegative}</p>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <WinRate rate={d.visaWinRate} />
                      {d.visaWinRate !== null && (
                        <p className="text-[10px] text-gray-400">{d.visaPositive}+{d.visaNegative}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Finance + Team ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Finance</h3>
            </div>
            <Link to="/payments" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              All payments <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {/* After-acceptance: where full payment is actually due */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span className="font-medium text-gray-700">
                After acceptance
                <span className="ml-1 text-gray-400 font-normal">({finance.accStudents} students)</span>
              </span>
              <span className="font-bold text-gray-800">
                {finance.accCollectionRate !== null ? `${finance.accCollectionRate}%` : '—'}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  finance.accCollectionRate === null ? 'bg-gray-200' :
                  finance.accCollectionRate >= 80 ? 'bg-green-500' :
                  finance.accCollectionRate >= 50 ? 'bg-yellow-400' : 'bg-red-500'
                }`}
                style={{ width: `${finance.accCollectionRate ?? 0}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-3">
              <div>
                <p className="text-[11px] text-gray-400 mb-0.5 uppercase tracking-wide">Due</p>
                <p className="text-sm font-bold text-gray-800">{formatCurrency(finance.accContract)}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 mb-0.5 uppercase tracking-wide">Collected</p>
                <p className="text-sm font-bold text-green-600">{formatCurrency(finance.accCollected)}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 mb-0.5 uppercase tracking-wide">Outstanding</p>
                <p className="text-sm font-bold text-red-500">{formatCurrency(finance.accOutstanding)}</p>
              </div>
            </div>
          </div>

          {/* Pre-acceptance context */}
          <div className="border-t border-gray-50 pt-3 mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Pre-acceptance
                <span className="ml-1 text-gray-400">({finance.pendStudents} students · inst. 1 only)</span>
              </span>
              <span className="font-semibold text-gray-700">{formatCurrency(finance.pendCollected)} collected</span>
            </div>
            {finance.noPaymentAtAll > 0 && (
              <p className="text-xs text-orange-500 mt-1">
                {finance.noPaymentAtAll} student{finance.noPaymentAtAll !== 1 ? 's' : ''} haven't paid anything yet
              </p>
            )}
          </div>

          {/* Monthly cash */}
          <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">This month</p>
              <p className="text-sm font-bold text-gray-800">{formatCurrency(finance.collectedThisMonth)}</p>
            </div>
            {monthGrowth !== null && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${monthGrowth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {monthGrowth >= 0 ? '↑' : '↓'} {Math.abs(monthGrowth)}% vs last month
              </span>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Team</h3>
            </div>
            <Link to="/users" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {agents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No agents yet</p>
          ) : (
            <div className="space-y-1.5">
              {agents.map(agent => (
                <div key={String(agent.id || 'unassigned')} className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold shrink-0">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                    <p className="text-xs text-gray-400">{agent.count} student{agent.count !== 1 ? 's' : ''}</p>
                  </div>
                  {agent.urgent > 0 && (
                    <span className="badge bg-red-100 text-red-700 shrink-0">{agent.urgent} urgent</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── My Tasks ───────────────────────────────────────────── */}
      {sortedTasks.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand-600" />
              <h3 className="font-semibold text-gray-900 text-sm">My Tasks</h3>
              {urgentTaskCount  > 0 && <span className="badge bg-red-100 text-red-700">{urgentTaskCount} urgent</span>}
              {overdueTaskCount > 0 && <span className="badge bg-orange-100 text-orange-700">{overdueTaskCount} overdue</span>}
            </div>
            <Link to="/tasks" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {sortedTasks.slice(0, 7).map(item => {
              const isOverdue = item.dueDate && new Date(item.dueDate) < now;
              const isUrgent  = item.priority === 'urgent';
              return (
                <div
                  key={item._id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isUrgent  ? 'bg-red-50 border-red-100' :
                    isOverdue ? 'bg-orange-50 border-orange-100' :
                                'bg-gray-50 border-gray-100'
                  }`}
                >
                  {item.hasTime
                    ? <AlarmClock className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                    : <ClipboardList className={`w-3.5 h-3.5 shrink-0 ${isUrgent ? 'text-red-500' : 'text-gray-400'}`} />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{isUrgent && '🔴 '}{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                      {isOverdue && <span className="text-orange-600">Overdue</span>}
                      {item.dueDate && !isOverdue && (
                        <span>{item.hasTime
                          ? new Date(item.dueDate).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : formatDate(item.dueDate)
                        }</span>
                      )}
                      {item.linkedStudentName && (
                        <Link to={`/students/${item.linkedStudent}`} className="text-brand-600 hover:underline">{item.linkedStudentName}</Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <ActionItemForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refetchTasks(); }}
        />
      )}
    </div>
  );
}
