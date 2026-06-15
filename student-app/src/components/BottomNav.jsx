import { NavLink, useLocation } from 'react-router-dom';
import { Home, ListChecks, FileText, Wrench } from 'lucide-react';

const TABS = [
  { to: '/',           icon: Home,       label: 'Home'     },
  { to: '/progress',   icon: ListChecks, label: 'Progress' },
  { to: '/documents',  icon: FileText,   label: 'Docs'     },
  { to: '/tools',      icon: Wrench,     label: 'Resources' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-2 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-gray-100 flex items-center px-2 py-1.5">
        {TABS.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex-1 flex flex-col items-center py-0.5"
            >
              {/* Icon with pill background when active */}
              <div className={`flex items-center justify-center w-10 h-9 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-brand-600' : 'bg-transparent'
              }`}>
                <Icon
                  className={`w-[18px] h-[18px] transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>

              {/* Label */}
              <span className={`text-[10px] mt-0.5 font-medium tracking-wide transition-colors duration-200 ${
                isActive ? 'text-brand-600' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
