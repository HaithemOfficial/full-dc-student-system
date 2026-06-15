import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import FounderDashboard from './pages/founder/FounderDashboard';
import AgentDashboard from './pages/agent/AgentDashboard';
import StudentsPage from './pages/students/StudentsPage';
import StudentDetailPage from './pages/students/StudentDetailPage';
import NewStudentPage from './pages/students/NewStudentPage';
import DestinationsPage from './pages/founder/DestinationsPage';
import ActivityLogPage from './pages/founder/ActivityLogPage';
import UniversitiesPage from './pages/founder/UniversitiesPage';
import UsersPage from './pages/founder/UsersPage';
import GrowthPage from './pages/founder/GrowthPage';
import HandoffPage from './pages/HandoffPage';
import NotificationsPage from './pages/NotificationsPage';
import TasksPage from './pages/TasksPage';
import KnowledgeBasePage from './pages/knowledge/KnowledgeBasePage';
import KBArticlePage from './pages/knowledge/KBArticlePage';
import KBArticleEditor from './pages/knowledge/KBArticleEditor';
import HelpPage from './pages/HelpPage';
import StudentAppOverview from './pages/studentApp/StudentAppOverview';
import ContentManager from './pages/studentApp/ContentManager';
import AnnouncementsPage from './pages/studentApp/AnnouncementsPage';
import NotificationsSettingsPage from './pages/founder/NotificationsSettingsPage';
import CommunicationsPage from './pages/founder/CommunicationsPage';
import AppSettingsPage from './pages/founder/AppSettingsPage';
import ReferralPage from './pages/founder/ReferralPage';
import { NotificationProvider } from './context/NotificationContext';

function ProtectedRoute({ children, founderOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (founderOnly && user.role !== 'founder') return <Navigate to="/dashboard" replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/handoff" element={<HandoffPage />} />
      <Route path="/" element={<RootRedirect />} />
      <Route element={<ProtectedRoute><NotificationProvider><Layout /></NotificationProvider></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/new" element={<NewStudentPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/payments" element={<ProtectedRoute founderOnly><GrowthPage /></ProtectedRoute>} />
        <Route path="/growth" element={<Navigate to="/payments" replace />} />
        <Route path="/activity-log" element={<ProtectedRoute founderOnly><ActivityLogPage /></ProtectedRoute>} />
        <Route path="/destinations" element={<ProtectedRoute founderOnly><DestinationsPage /></ProtectedRoute>} />
        <Route path="/universities" element={<ProtectedRoute founderOnly><UniversitiesPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute founderOnly><UsersPage /></ProtectedRoute>} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/reminders" element={<TasksPage />} />
        <Route path="/kb" element={<ProtectedRoute founderOnly><KnowledgeBasePage /></ProtectedRoute>} />
<Route path="/student-app" element={<ProtectedRoute founderOnly><StudentAppOverview /></ProtectedRoute>} />
        <Route path="/student-app/content" element={<ProtectedRoute founderOnly><ContentManager /></ProtectedRoute>} />
        <Route path="/student-app/announcements" element={<ProtectedRoute founderOnly><AnnouncementsPage /></ProtectedRoute>} />
        <Route path="/notification-settings" element={<ProtectedRoute founderOnly><NotificationsSettingsPage /></ProtectedRoute>} />
        <Route path="/communications" element={<ProtectedRoute founderOnly><CommunicationsPage /></ProtectedRoute>} />
        <Route path="/app-settings" element={<ProtectedRoute founderOnly><AppSettingsPage /></ProtectedRoute>} />
        <Route path="/referral-program" element={<ProtectedRoute founderOnly><ReferralPage /></ProtectedRoute>} />
        <Route path="/kb/new" element={<ProtectedRoute founderOnly><KBArticleEditor /></ProtectedRoute>} />
        <Route path="/kb/:id/edit" element={<ProtectedRoute founderOnly><KBArticleEditor /></ProtectedRoute>} />
        <Route path="/kb/:id" element={<ProtectedRoute founderOnly><KBArticlePage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  return user?.role === 'founder' ? <FounderDashboard /> : <AgentDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
