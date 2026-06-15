import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, ClipboardList, Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const ITEMS = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Home',    end: true },
  { to: '/students',      icon: GraduationCap,   label: 'Students' },
  { to: '/tasks',         icon: ClipboardList,   label: 'Tasks' },
  { to: '/notifications', icon: Bell,            label: 'Inbox' },
];

export default function BottomNav() {
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex lg:hidden">
      {ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-3 transition-colors ${
              isActive ? 'text-brand-600' : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <div className={`w-8 h-7 flex items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-brand-50' : ''}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                {label === 'Inbox' && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
