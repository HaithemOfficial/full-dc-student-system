import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut, Library, HelpCircle, CreditCard,
  ScrollText, Globe, Building2, Users, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TITLES = {
  '/dashboard':    'Dashboard',
  '/students':     'Students',
  '/tasks':        'Tasks',
  '/notifications':'Notifications',
  '/destinations': 'Destinations',
  '/universities': 'Universities',
  '/users':        'Team',
  '/payments':     'Payments',
  '/reminders':    'Reminders',
  '/kb':           'Knowledge Base',
  '/help':         'Agent Guide',
  '/activity-log': 'Activity Log',
};

const menuItem = 'flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left';
const menuItemActive = 'flex items-center gap-3 px-4 py-2.5 text-sm text-brand-600 bg-brand-50 font-medium w-full text-left';

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, isFounder } = useAuth();
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  const title = Object.entries(TITLES).find(([path]) => pathname.startsWith(path))?.[1] || 'El Nadjah';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const close = () => setOpen(false);
  const handleLogout = () => { close(); logout(); navigate('/login'); };

  const isActive = (path) => pathname.startsWith(path);

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>

      {/* Profile dropdown — mobile only */}
      <div className="relative lg:hidden" ref={dropRef}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-xs shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
            {/* User info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>

            <div className="py-1">
              {/* Founder-only items */}
              {isFounder && (
                <Link to="/payments" onClick={close} className={isActive('/payments') ? menuItemActive : menuItem}>
                  <CreditCard className="w-4 h-4 shrink-0" /> Payments
                </Link>
              )}

              <Link to="/kb" onClick={close} className={isActive('/kb') ? menuItemActive : menuItem}>
                <Library className="w-4 h-4 shrink-0" /> Knowledge Base
              </Link>

              <Link to="/help" onClick={close} className={isActive('/help') ? menuItemActive : menuItem}>
                <HelpCircle className="w-4 h-4 shrink-0" /> Agent Guide
              </Link>
            </div>

            {/* Founder config section */}
            {isFounder && (
              <>
                <div className="px-4 pt-2 pb-1 border-t border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Configuration</p>
                </div>
                <div className="py-1">
                  <Link to="/activity-log" onClick={close} className={isActive('/activity-log') ? menuItemActive : menuItem}>
                    <ScrollText className="w-4 h-4 shrink-0" /> Activity Log
                  </Link>
                  <Link to="/destinations" onClick={close} className={isActive('/destinations') ? menuItemActive : menuItem}>
                    <Globe className="w-4 h-4 shrink-0" /> Destinations
                  </Link>
                  <Link to="/universities" onClick={close} className={isActive('/universities') ? menuItemActive : menuItem}>
                    <Building2 className="w-4 h-4 shrink-0" /> Universities
                  </Link>
                  <Link to="/users" onClick={close} className={isActive('/users') ? menuItemActive : menuItem}>
                    <Users className="w-4 h-4 shrink-0" /> Team
                  </Link>
                </div>
              </>
            )}

            {/* Sign out */}
            <div className="border-t border-gray-100 py-1">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                <LogOut className="w-4 h-4 shrink-0" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
