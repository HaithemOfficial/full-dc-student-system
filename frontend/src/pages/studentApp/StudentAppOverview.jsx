import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, BookOpen, Mic, Megaphone, Plus, ChevronRight, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function StudentAppOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student-app/stats')
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-brand-500" /> Student App
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Overview of your student PWA across all destinations</p>
        </div>
        <div className="flex gap-2">
          <Link to="/student-app/announcements" className="btn-primary flex items-center gap-2 text-sm">
            <Megaphone className="w-4 h-4" /> Send Announcement
          </Link>
          <Link to="/kb/new" className="btn-secondary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Guide
          </Link>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Students with PWA access" value={stats?.totalPwaStudents} color="bg-brand-600" />
          <StatCard icon={BookOpen} label="Guides published" value={stats?.totalGuides} color="bg-green-500" />
          <StatCard icon={Mic} label="Interview questions active" value={stats?.totalQuestions} color="bg-purple-500" />
          <StatCard icon={Megaphone} label="Announcements this month" value={stats?.totalAnnouncementsThisMonth} color="bg-orange-500" />
        </div>
      )}

      {/* Per-destination cards */}
      <h2 className="text-base font-semibold text-gray-800 mb-3">By Destination</h2>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(stats?.perDestination || []).map(dest => (
            <div key={dest._id} className="card p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl shrink-0">{dest.flag || '🌍'}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{dest.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">🎤 {dest.interviewTopics} topics · {dest.interviewVideos} videos · {dest.interviewMistakes} mistakes</span>
                      <span className="text-xs text-gray-500">📚 {dest.guides} guides</span>
                      <span className="text-xs text-gray-500">❓ {dest.faqCount} FAQs</span>
                    </div>
                  </div>
                </div>
                <Link
                  to={`/student-app/content?dest=${dest._id}`}
                  className="btn-secondary text-xs flex items-center gap-1.5 shrink-0"
                >
                  Manage Content <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
          {stats?.perDestination?.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-gray-400 text-sm">No active destinations configured yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
