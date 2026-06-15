import { useState, useEffect, useCallback } from 'react';
import { CheckCheck, Megaphone, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { SkeletonList } from '../components/ui/SkeletonCard';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { timeAgo, groupByTime } from '../utils/date';
import api from '../utils/api';

const ANN_BORDER = {
  info:        'border-l-blue-400 bg-blue-50',
  important:   'border-l-orange-400 bg-orange-50',
  urgent:      'border-l-red-400 bg-red-50',
  celebration: 'border-l-green-400 bg-green-50',
};

const ANN_BADGE = {
  info:        'bg-blue-100 text-blue-700',
  important:   'bg-orange-100 text-orange-700',
  urgent:      'bg-red-100 text-red-700',
  celebration: 'bg-green-100 text-green-700',
};

const ANN_LABEL = { info: 'Info', important: 'Important', urgent: 'Urgent', celebration: 'Announcement' };

function fireConfetti() {
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, zIndex: 9999 });
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [notifRes, annRes] = await Promise.all([
        api.get('/student/me/notifications'),
        api.get('/student/me/announcements').catch(() => ({ data: [] })),
      ]);
      const notifs = (notifRes.data || []).map(n => ({ ...n, _kind: 'notification', _date: n.createdAt }));
      const anns = (annRes.data || []).map(a => ({ ...a, _kind: 'announcement', _date: a.sentAt || a.createdAt }));
      const merged = [...notifs, ...anns].sort((a, b) => new Date(b._date) - new Date(a._date));
      setItems(merged);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markNotifRead = async (id) => {
    try {
      await api.put(`/student/me/notifications/${id}/read`);
      setItems(prev => prev.map(i => i._id === id ? { ...i, isRead: true } : i));
    } catch {}
  };

  const markAnnRead = async (id, type) => {
    try {
      await api.patch(`/student/me/announcements/${id}/read`);
      setItems(prev => prev.map(i => i._id === id ? { ...i, isRead: true } : i));
      if (type === 'celebration') fireConfetti();
    } catch {}
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await api.put('/student/me/notifications/read-all');
      const unreadAnns = items.filter(i => i._kind === 'announcement' && !i.isRead);
      await Promise.all(unreadAnns.map(a => api.patch(`/student/me/announcements/${a._id}/read`).catch(() => {})));
      await load();
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleTap = (item) => {
    if (item.isRead) return;
    if (item._kind === 'announcement') {
      markAnnRead(item._id, item.type);
    } else {
      markNotifRead(item._id);
    }
  };

  const unreadCount = items.filter(i => !i.isRead).length;

  // Group by time using the merged _date field
  const dateMap = {};
  items.forEach(i => { dateMap[i._id] = i._date; });
  const groups = groupByTime(items, '_date');

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Updates</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-brand-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 active:opacity-60 transition-opacity"
          >
            <CheckCheck className="w-4 h-4" />
            {markingAll ? 'Marking...' : 'Mark all read'}
          </button>
        )}
      </div>

      {loading && <SkeletonList count={4} />}
      {!loading && error && <ErrorState onRetry={load} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState icon="🔔" title="No notifications yet" subtitle="Updates from your DC agent will appear here" />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-5">
          {Object.entries(groups).map(([group, groupItems]) => {
            if (!groupItems || groupItems.length === 0) return null;
            return (
              <div key={group}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group}</p>
                <div className="space-y-2">
                  {groupItems.map(item => {
                    if (item._kind === 'announcement') {
                      const borderCls = ANN_BORDER[item.type] || ANN_BORDER.info;
                      const badgeCls = ANN_BADGE[item.type] || ANN_BADGE.info;
                      const badgeLabel = ANN_LABEL[item.type] || 'Announcement';
                      return (
                        <button
                          key={item._id}
                          onClick={() => handleTap(item)}
                          className={`w-full text-start rounded-2xl border border-l-4 px-4 py-4 flex gap-3 active:opacity-70 transition-opacity ${borderCls} ${item.isRead ? 'opacity-70' : ''}`}
                        >
                          <Megaphone className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeCls}`}>{badgeLabel}</span>
                              {!item.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                            </div>
                            <p className={`text-sm font-semibold leading-snug ${item.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{item.title}</p>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.message}</p>
                            <p className="text-xs text-gray-400 mt-1.5">{timeAgo(item._date)}</p>
                          </div>
                        </button>
                      );
                    }

                    // Regular notification
                    return (
                      <button
                        key={item._id}
                        onClick={() => handleTap(item)}
                        className={`w-full text-start rounded-2xl border px-4 py-4 flex gap-3 active:opacity-70 transition-opacity ${item.isRead ? 'bg-white border-gray-100' : 'bg-brand-50 border-brand-100'}`}
                      >
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.isRead ? 'bg-transparent' : 'bg-brand-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold leading-snug ${item.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {item.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.message}</p>
                          <p className="text-xs text-gray-400 mt-1.5">{timeAgo(item.createdAt)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
