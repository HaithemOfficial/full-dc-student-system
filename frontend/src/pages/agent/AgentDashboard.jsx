import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import ActionItemForm from '../../components/tasks/ActionItemForm';
import {
  AlertTriangle, GraduationCap, ArrowRight,
  ChevronRight, ClipboardList, AlarmClock, Bell, ExternalLink,
} from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useActionItems } from '../../hooks/useActionItems';
import { formatDate, isExpiringSoon, timeAgo } from '../../utils/helpers';

const NOTIF_TYPE_COLORS = {
  new_case: 'bg-green-100 text-green-700',
  handoff: 'bg-blue-100 text-blue-700',
  stage_blocked: 'bg-red-100 text-red-700',
  document_overdue: 'bg-orange-100 text-orange-700',
  mediation_code_expiry: 'bg-yellow-100 text-yellow-700',
  vfs_appointment: 'bg-purple-100 text-purple-700',
  custom: 'bg-gray-100 text-gray-700',
  default: 'bg-brand-100 text-brand-700',
};

function StudentCard({ student }) {
  const totalMandatory = student.destination?.pipelineStages
    ?.find(s => String(s._id) === String(student.currentStageId))
    ?.checklist?.filter(i => i.isMandatory)?.length || 0;
  const completed = student.checklistCompletions?.filter(c => c.completed).length || 0;

  return (
    <Link to={`/students/${student._id}`}
      className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-brand-300 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 truncate">{student.firstName} {student.lastName}</p>
            {student.isUrgent  && <span className="badge bg-red-100 text-red-700 shrink-0">Urgent</span>}
            {student.isFlagged && <span className="badge bg-yellow-100 text-yellow-700 shrink-0">Flagged</span>}
          </div>
          <p className="text-xs text-gray-400 mb-3">{student.destinationName} · {student.currentStageName}</p>
          {totalMandatory > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Stage checklist</span>
                <span>{completed}/{totalMandatory}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${completed === totalMandatory ? 'bg-green-500' : 'bg-brand-500'}`}
                  style={{ width: `${totalMandatory > 0 ? (completed / totalMandatory) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 mt-1 shrink-0 transition-colors" />
      </div>
    </Link>
  );
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { students } = useStudents();
  const { notifications, unreadCount, markRead } = useNotifications();
  const { items, refetch } = useActionItems({ status: 'pending' });
  const [showItemForm, setShowItemForm] = useState(false);

  const urgent       = students.filter(s => s.isUrgent);
  const expiringSoon = students.filter(s =>
    (s.mediationCode && isExpiringSoon(s.mediationCodeExpiry, 14)) ||
    isExpiringSoon(s.vfsAppointmentDate, 7)
  );

  const workItems = useMemo(() => {
    const now = new Date();
    return [...items].sort((a, b) => {
      const aOver = a.dueDate && new Date(a.dueDate) < now;
      const bOver = b.dueDate && new Date(b.dueDate) < now;
      if (aOver !== bOver) return aOver ? -1 : 1;
      if (a.priority !== b.priority) return a.priority === 'urgent' ? -1 : 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [items]);

  const urgentCount  = items.filter(i => i.priority === 'urgent').length;
  const overdueCount = items.filter(i => i.dueDate && new Date(i.dueDate) < new Date()).length;

  const topNotifications = [...notifications]
    .sort((a, b) => (a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Good {getGreeting()}, {user?.name?.split(' ')[0]}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Here's what needs your attention today</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowItemForm(true)} className="btn-secondary text-sm flex-1 sm:flex-none justify-center">+ New Item</button>
          <Link to="/students/new" className="btn-primary text-sm flex-1 sm:flex-none justify-center text-center">+ Add Student</Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/students" className="card p-4 text-center hover:shadow-md transition-shadow">
          <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <GraduationCap className="w-5 h-5 text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">My Students</p>
        </Link>

        <Link to="/tasks" className={`card p-4 text-center hover:shadow-md transition-shadow ${urgentCount > 0 || overdueCount > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${urgentCount > 0 || overdueCount > 0 ? 'bg-red-100' : 'bg-brand-100'}`}>
            <ClipboardList className={`w-5 h-5 ${urgentCount > 0 || overdueCount > 0 ? 'text-red-600' : 'text-brand-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${urgentCount > 0 || overdueCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {workItems.length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Tasks & Reminders</p>
        </Link>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="w-4 h-4 text-brand-600 shrink-0" />
              <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && <span className="badge bg-red-100 text-red-700 shrink-0">{unreadCount} unread</span>}
            </div>
            <Link to="/notifications" className="text-xs text-brand-600 hover:underline flex items-center gap-1 shrink-0">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {topNotifications.map(n => (
              <div key={n._id} onClick={() => !n.isRead && markRead(n._id)}
                className={`card p-4 flex items-start gap-3 cursor-pointer transition-all hover:shadow-sm ${!n.isRead ? 'border-brand-200 bg-brand-50/50' : ''}`}>
                <div className="mt-1.5 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${n.isRead ? 'bg-gray-200' : 'bg-brand-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${NOTIF_TYPE_COLORS[n.type] || NOTIF_TYPE_COLORS.default}`}>
                      {n.type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                </div>
                {n.student && (
                  <Link to={`/students/${n.student}`} onClick={e => e.stopPropagation()}
                    className="p-1.5 hover:bg-brand-100 rounded-lg transition-colors shrink-0" title="View student">
                    <ExternalLink className="w-4 h-4 text-brand-500" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks & Reminders */}
      {workItems.length > 0 && (
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <ClipboardList className="w-4 h-4 text-brand-600 shrink-0" />
              <h3 className="font-semibold text-gray-900 text-sm">Tasks & Reminders</h3>
              {urgentCount  > 0 && <span className="badge bg-red-100 text-red-700 shrink-0">{urgentCount} urgent</span>}
              {overdueCount > 0 && <span className="badge bg-orange-100 text-orange-700 shrink-0">{overdueCount} overdue</span>}
            </div>
            <Link to="/tasks" className="text-xs text-brand-600 hover:underline flex items-center gap-1 shrink-0">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {workItems.slice(0, 7).map(item => {
              const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();
              const isUrgent  = item.priority === 'urgent';
              return (
                <div
                  key={item._id}
                  onClick={() => item.linkedStudent && navigate(`/students/${item.linkedStudent}`)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isUrgent  ? 'bg-red-50 border-red-100' :
                    isOverdue ? 'bg-orange-50 border-orange-100 cursor-pointer hover:bg-orange-100' :
                    item.linkedStudent ? 'bg-gray-50 border-gray-100 cursor-pointer hover:bg-gray-100' :
                                        'bg-gray-50 border-gray-100'
                  }`}
                >
                  {item.hasTime
                    ? <AlarmClock className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                    : <ClipboardList className={`w-3.5 h-3.5 shrink-0 ${isUrgent ? 'text-red-500' : 'text-gray-400'}`} />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {isUrgent && '🔴 '}{item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                      {isOverdue && <span className="text-red-500">Overdue</span>}
                      {item.dueDate && (
                        <span>{item.hasTime
                          ? new Date(item.dueDate).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : formatDate(item.dueDate)
                        }</span>
                      )}
                      {item.linkedStudentName && <span>{item.linkedStudentName}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Urgent cases */}
      {urgent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Urgent Cases</h3>
          </div>
          <div className="space-y-2">
            {urgent.map(s => <StudentCard key={s._id} student={s} />)}
          </div>
        </div>
      )}

      {/* Expiring soon */}
      {expiringSoon.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Expiring Soon</h3>
          </div>
          <div className="space-y-2">
            {expiringSoon.map(s => (
              <Link key={s._id} to={`/students/${s._id}`}
                className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl hover:border-orange-300 transition-all">
                <div>
                  <p className="font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    {s.mediationCodeExpiry && isExpiringSoon(s.mediationCodeExpiry, 14) && `Mediation code expires ${formatDate(s.mediationCodeExpiry)}`}
                    {s.vfsAppointmentDate && isExpiringSoon(s.vfsAppointmentDate, 7) && `VFS appointment ${formatDate(s.vfsAppointmentDate)}`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
      {showItemForm && (
        <ActionItemForm
          onClose={() => setShowItemForm(false)}
          onSaved={() => { setShowItemForm(false); refetch(); }}
        />
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
