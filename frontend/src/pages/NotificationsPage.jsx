import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { timeAgo } from '../utils/helpers';

const TYPE_COLORS = {
  new_case: 'bg-green-100 text-green-700',
  handoff: 'bg-blue-100 text-blue-700',
  stage_blocked: 'bg-red-100 text-red-700',
  document_overdue: 'bg-orange-100 text-orange-700',
  mediation_code_expiry: 'bg-yellow-100 text-yellow-700',
  vfs_appointment: 'bg-purple-100 text-purple-700',
  custom: 'bg-gray-100 text-gray-700',
  default: 'bg-brand-100 text-brand-700',
};

function NotifCard({ n, markRead }) {
  return (
    <div
      className={`card p-4 flex items-start gap-3 cursor-pointer transition-all hover:shadow-sm ${
        !n.isRead ? 'border-brand-200 bg-brand-50/50' : ''
      }`}
      onClick={() => !n.isRead && markRead(n._id)}
    >
      <div className="mt-1.5 shrink-0">
        <div className={`w-2 h-2 rounded-full ${n.isRead ? 'bg-gray-200' : 'bg-brand-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`badge ${TYPE_COLORS[n.type] || TYPE_COLORS.default}`}>
            {n.type?.replace(/_/g, ' ')}
          </span>
          <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
        </div>
        <p className="text-sm font-semibold text-gray-900">{n.title}</p>
        <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
      </div>
      {n.student && (
        <Link
          to={`/students/${n.student}`}
          onClick={e => e.stopPropagation()}
          className="p-1.5 hover:bg-brand-100 rounded-lg transition-colors shrink-0"
          title="View student"
        >
          <ExternalLink className="w-4 h-4 text-brand-500" />
        </Link>
      )}
    </div>
  );
}

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications();
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(notifications.length / PAGE_SIZE);
  const paginated  = notifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const grouped = useMemo(() => {
    const now = new Date();
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo   = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);

    const groups = [
      { key: 'today',     label: 'Today',     items: [] },
      { key: 'yesterday', label: 'Yesterday',  items: [] },
      { key: 'week',      label: 'This Week',  items: [] },
      { key: 'earlier',   label: 'Earlier',    items: [] },
    ];

    for (const n of paginated) {
      const d = new Date(n.createdAt);
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (day >= today)     groups[0].items.push(n);
      else if (day >= yesterday) groups[1].items.push(n);
      else if (day >= weekAgo)   groups[2].items.push(n);
      else                       groups[3].items.push(n);
    }

    return groups.filter(g => g.items.length > 0);
  }, [paginated]);

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
          {unreadCount > 0 && <p className="text-sm text-gray-400 mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm flex items-center gap-2">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.key} className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                {group.label}
              </p>
              {group.items.map(n => (
                <NotifCard key={n._id} n={n} markRead={markRead} />
              ))}
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={notifications.length} pageSize={PAGE_SIZE} onChange={p => { setPage(p); window.scrollTo(0, 0); }} />
    </div>
  );
}
