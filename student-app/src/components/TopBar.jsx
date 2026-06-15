import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const BACK_ROUTES = [
  '/tools/interview-prep',
  '/tools/guides',
  '/tools/faq',
  '/tools/checklists',
];

export default function TopBar() {
  const { student, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/student/me/notifications/unread-count')
      .then(r => setUnread(r.data.count))
      .catch(() => {});
  }, [location.pathname]);

  const isHome = location.pathname === '/';
  const isSubPage = BACK_ROUTES.some(r => location.pathname.startsWith(r));

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto gap-3">

        {/* Left: back button on sub-pages, logo on top-level */}
        {isSubPage ? (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 active:bg-gray-100 transition-colors -ml-1 shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/icon.png" alt="" className="w-7 h-7 object-contain" />
            <span className="text-sm font-bold text-gray-900">El Nadjah</span>
          </Link>
        )}

        <div className="flex-1" />

        {/* Right: bell + logout */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            to="/notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 active:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>

          <button
            onClick={logout}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 active:bg-gray-100 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
