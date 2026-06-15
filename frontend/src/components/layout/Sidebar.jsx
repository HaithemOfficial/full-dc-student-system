import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard, Users, GraduationCap, Globe,
  Bell, LogOut, BookOpen, ClipboardList, ScrollText, Library, HelpCircle, CreditCard,
  Smartphone, LayoutGrid, Megaphone, Settings2, Gift, Lock
} from 'lucide-react';

const navItem = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors';
const active = 'bg-brand-600 text-white';
const inactive = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

export default function Sidebar() {
  const { user, logout, isFounder } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-60 h-full bg-white border-r border-gray-100 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <img src="/icon.png" alt="" className="w-8 h-8 object-contain" />
          <div>
            <p className="text-sm font-bold text-gray-900">El Nadjah</p>
            <p className="text-xs text-gray-400">DC System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink to="/dashboard" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          Dashboard
        </NavLink>

        <NavLink to="/notifications" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
          <Bell className="w-4 h-4 shrink-0" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/students" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
          <GraduationCap className="w-4 h-4 shrink-0" />
          Students
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
          <ClipboardList className="w-4 h-4 shrink-0" />
          Tasks & Reminders
        </NavLink>

        {isFounder && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3 h-3" /> Student App
              </p>
            </div>
            <NavLink to="/student-app" end className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
              <LayoutGrid className="w-4 h-4 shrink-0" />
              Overview
            </NavLink>
            <NavLink to="/student-app/content" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
              <BookOpen className="w-4 h-4 shrink-0" />
              Content Manager
            </NavLink>
            <NavLink to="/communications" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
              <Megaphone className="w-4 h-4 shrink-0" />
              Communications
            </NavLink>
          </>
        )}

        {isFounder && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuration</p>
            </div>
            <NavLink to="/destinations" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
              <Globe className="w-4 h-4 shrink-0" />
              Destinations
            </NavLink>
            <NavLink to="/referral-program" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
              <Gift className="w-4 h-4 shrink-0" />
              Referral Program
            </NavLink>
            <NavLink to="/app-settings" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
              <Settings2 className="w-4 h-4 shrink-0" />
              App Settings
            </NavLink>
          </>
        )}
      </nav>

      <div className="px-3 pb-2 space-y-1">
        {isFounder && (
          <>
            <NavLink to="/users" className={({ isActive }) => `${navItem} ${isActive ? active : inactive} text-xs`}>
              <Users className="w-4 h-4 shrink-0" />
              Team
            </NavLink>
            <NavLink to="/activity-log" className={({ isActive }) => `${navItem} ${isActive ? active : inactive} text-xs`}>
              <ScrollText className="w-4 h-4 shrink-0" />
              Activity Log
            </NavLink>
            <NavLink to="/payments" className={({ isActive }) => `${navItem} ${isActive ? active : inactive} text-xs`}>
              <CreditCard className="w-4 h-4 shrink-0" />
              Payments
            </NavLink>
          </>
        )}
        {isFounder ? (
          <NavLink to="/kb" className={({ isActive }) => `${navItem} ${isActive ? active : inactive} text-xs`}>
            <Library className="w-4 h-4 shrink-0" />
            Knowledge Base
          </NavLink>
        ) : (
          <div className={`${navItem} text-xs text-gray-300 cursor-not-allowed select-none`}>
            <Library className="w-4 h-4 shrink-0" />
            Knowledge Base
            <Lock className="w-3 h-3 ml-auto shrink-0" />
          </div>
        )}
        <NavLink to="/help" className={({ isActive }) => `${navItem} ${isActive ? active : inactive} text-xs`}>
          <HelpCircle className="w-4 h-4 shrink-0" />
          Agent Guide
        </NavLink>
      </div>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={handleLogout} className={`${navItem} ${inactive} w-full`}>
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
