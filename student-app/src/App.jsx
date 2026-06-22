import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './utils/api';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Home from './pages/Home';
import Progress from './pages/Progress';
import Payments from './pages/Payments';
import Deadlines from './pages/Deadlines';
import Notifications from './pages/Notifications';
import Documents from './pages/Documents';
import Tools from './pages/Tools';
import Referral from './pages/Referral';
import Disclaimer from './pages/Disclaimer';
import InterviewPrepHub from './pages/tools/InterviewPrepHub';
import InterviewPrep from './pages/tools/InterviewPrep';
import VideoExamples from './pages/tools/VideoExamples';
import CommonMistakes from './pages/tools/CommonMistakes';
import GuidesHub from './pages/tools/GuidesHub';
import FAQPage from './pages/tools/FAQPage';
import Checklists from './pages/tools/Checklists';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';
import ContentGuard from './components/ContentGuard';

function MaintenanceScreen({ message }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <img src="/icon.png" alt="El Nadjah" className="w-20 h-20 object-contain mb-6" />
      <div className="text-5xl mb-5">🔧</div>
      <h1 className="text-xl font-bold text-gray-900 mb-3">App Temporarily Unavailable</h1>
      <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-8">
        {message || 'We are making improvements to the app. We\'ll be back shortly — thank you for your patience.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-2xl bg-brand-600 text-white text-sm font-semibold active:bg-brand-700 transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}

function ProtectedLayout() {
  const { student } = useAuth();
  const [maintenance, setMaintenance] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dc_maintenance')) || { enabled: false }; }
    catch { return { enabled: false }; }
  });

  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      api.get('/settings/public')
        .then(r => {
          const m = r.data.maintenanceMode || { enabled: false };
          setMaintenance(m);
          localStorage.setItem('dc_maintenance', JSON.stringify(m));
        })
        .catch(() => {});
    };

    check();
    const interval = setInterval(check, 120_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  if (!student) return <Navigate to="/login" replace />;
  if (maintenance.enabled) return <MaintenanceScreen message={maintenance.message} />;
  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      <TopBar />
      <main className="flex-1 overflow-y-auto pt-14 pb-28">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/progress" element={<ContentGuard><Progress /></ContentGuard>} />
          <Route path="/payments" element={<ContentGuard><Payments /></ContentGuard>} />
          <Route path="/deadlines" element={<Deadlines />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/documents" element={<ContentGuard><Documents /></ContentGuard>} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/tools/interview-prep" element={<InterviewPrepHub />} />
          <Route path="/tools/interview-prep/questions" element={<ContentGuard><InterviewPrep /></ContentGuard>} />
          <Route path="/tools/interview-prep/videos" element={<ContentGuard><VideoExamples /></ContentGuard>} />
          <Route path="/tools/interview-prep/mistakes" element={<ContentGuard><CommonMistakes /></ContentGuard>} />
          <Route path="/tools/guides" element={<ContentGuard><GuidesHub /></ContentGuard>} />
          <Route path="/tools/faq" element={<ContentGuard><FAQPage /></ContentGuard>} />
          <Route path="/tools/checklists" element={<ContentGuard><Checklists /></ContentGuard>} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

function PublicRoute({ children }) {
  const { student } = useAuth();
  if (student) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  );
}
