import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Splash() {
  const navigate = useNavigate();
  const { student } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => {
      navigate(student ? '/' : '/login', { replace: true });
    }, 1500);
    return () => clearTimeout(t);
  }, [navigate, student]);

  return (
    <div className="min-h-dvh bg-brand-600 flex flex-col items-center justify-center gap-5">
      <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center">
        <img src="/icon.png" alt="El Nadjah" className="w-16 h-16 object-contain" />
      </div>
      <div className="text-center">
        <h1 className="text-white text-2xl font-bold tracking-tight">El Nadjah</h1>
        <p className="text-brand-200 text-sm mt-1">Your study-abroad journey</p>
      </div>
      <div className="absolute bottom-12 flex gap-1.5">
        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
        <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse delay-150" />
        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-300" />
      </div>
    </div>
  );
}
