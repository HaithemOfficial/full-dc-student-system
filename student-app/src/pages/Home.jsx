import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, RefreshCw, MessageCircle, CheckSquare, Square, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Onboarding from '../components/Onboarding';
import ReferralPopup, { shouldShowReferralPopup, markReferralPopupSeen } from '../components/ReferralPopup';
import api from '../utils/api';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import ErrorState from '../components/ui/ErrorState';
import { timeAgo } from '../utils/date';

function estimatedWeeks(days) {
  if (!days) return null;
  if (days <= 7) return `~${days} day${days !== 1 ? 's' : ''}`;
  const weeks = Math.round(days / 7);
  return `~${weeks} week${weeks !== 1 ? 's' : ''}`;
}

export default function Home() {
  const { student, refreshStudent, markOnboardingComplete } = useAuth();
  const [progress, setProgress] = useState(null);
  const [payments, setPayments] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [referral, setReferral] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [reportingEmail, setReportingEmail] = useState('');
  const [disclaimerTitle, setDisclaimerTitle] = useState('');

  const load = async () => {
    setError(false);
    try {
      const [p, pay, notifs, me, ref, sett] = await Promise.all([
        api.get('/student/me/progress'),
        api.get('/student/me/payments'),
        api.get('/student/me/notifications'),
        api.get('/student/me'),
        api.get('/student/me/referral').catch(() => null),
        api.get('/settings/public').catch(() => null),
      ]);
      setProgress(p.data);
      setPayments(pay.data);
      setNotifications(notifs.data);
      setAgent(me.data.assignedTo || null);
      setReportingEmail(sett?.data?.reportingEmail || '');
      setDisclaimerTitle(sett?.data?.disclaimer?.title || '');
      if (ref?.data?.active !== false) {
        setReferral(ref?.data || null);
        if (ref?.data?.referralCode && shouldShowReferralPopup()) {
          setShowPopup(true);
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshStudent()]);
    setRefreshing(false);
  };

  const recentNotifs = notifications?.slice(0, 3) || [];
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  const studentChecklist = progress?.studentChecklist || [];

  const mailSubject = `El Nadjah — Student Report ${student?.firstName || ''} ${student?._id || ''}`;
  const mailBody = `Hello El Nadjah Team,\n\nI would like to report the following issue or inquiry:\n\n[Student writes their message here]\n\nMy details:\nName: ${student?.firstName || ''} ${student?.lastName || ''}\nPhone: ${student?.phone || ''}\nDestination: ${student?.destinationName || ''}\nCurrent Stage: ${student?.currentStageName || ''}`;
  const mailtoHref = reportingEmail
    ? `mailto:${reportingEmail}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`
    : '#';

  const handleClosePopup = () => {
    markReferralPopupSeen();
    setShowPopup(false);
  };

  return (
    <>
    {student?.onboardingCompleted === false && (
      <Onboarding student={student} onComplete={markOnboardingComplete} />
    )}
    {showPopup && referral && (
      <ReferralPopup data={referral} onClose={handleClosePopup} />
    )}
    <div className="px-4 pt-6 pb-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">Hello 👋</p>
          <h1 className="text-2xl font-bold text-gray-900">{student?.firstName}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{student?.destinationName}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && error && <ErrorState onRetry={load} />}

      {!loading && !error && (
        <>
          {/* Current Stage Card */}
          <Link to="/progress" className="block bg-brand-600 rounded-2xl p-5 text-white active:opacity-90 transition-opacity">
            <div className="flex items-center justify-between mb-1">
              <p className="text-brand-200 text-xs font-medium uppercase tracking-wider">Current Stage</p>
              <ChevronRight className="w-4 h-4 text-brand-300" />
            </div>
            <h2 className="text-xl font-bold mb-1">{progress?.currentStageName || '—'}</h2>
            {progress?.currentStageDescription ? (
              <p className="text-brand-200 text-xs mb-3 leading-relaxed line-clamp-2">{progress.currentStageDescription}</p>
            ) : null}
            {progress?.estimatedDays ? (
              <p className="text-brand-300 text-xs mb-3">
                ⏱ Estimated: {estimatedWeeks(progress.estimatedDays)}
              </p>
            ) : null}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-brand-200">Stage {(progress?.currentIndex ?? 0) + 1} of {progress?.totalStages || '—'}</span>
                <span className="font-semibold">{progress?.progressPercent || 0}%</span>
              </div>
              <div className="h-2 bg-brand-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${progress?.progressPercent || 0}%` }}
                />
              </div>
            </div>
          </Link>

          {/* Student checklist for current stage */}
          {studentChecklist.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Stage progress</p>
              <div className="space-y-2.5">
                {studentChecklist.map(item => (
                  <div key={item._id} className="flex items-start gap-3">
                    {item.completed
                      ? <CheckSquare className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      : <Square className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />}
                    <p className={`text-sm leading-snug ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-300 mt-3">Your DC agent updates these as you progress</p>
            </div>
          )}

          {/* Payments Summary */}
          <Link to="/payments" className="block bg-white rounded-2xl p-5 border border-gray-100 active:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Payments</p>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Service fee</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {payments?.serviceAmount ? payments.serviceAmount.toLocaleString() : '—'} <span className="text-xs text-gray-400">DZD</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Paid</p>
                <p className="font-semibold text-green-600 text-sm">
                  {payments?.totalPaid ? payments.totalPaid.toLocaleString() : '0'} <span className="text-xs text-green-400">DZD</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
                <p className={`font-semibold text-sm ${payments?.remaining > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {payments?.remaining != null ? payments.remaining.toLocaleString() : '—'} <span className="text-xs opacity-60">DZD</span>
                </p>
              </div>
            </div>
          </Link>

          {/* DC Agent Card */}
          {agent && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">My Agent</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
                  {agent.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{agent.name}</p>
                  {agent.phone && <p className="text-xs text-gray-400 mt-0.5">{agent.phone}</p>}
                </div>
                {agent.phone && (
                  <a
                    href={`https://wa.me/${agent.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 active:bg-green-200 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Recent Notifications */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recent Updates</p>
                {unreadCount > 0 && (
                  <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <Link to="/notifications" className="flex items-center gap-1 text-xs text-brand-600 font-medium">
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {recentNotifs.length === 0 ? (
              <p className="text-sm text-gray-400">No notifications yet</p>
            ) : (
              <div className="space-y-3">
                {recentNotifs.map(n => (
                  <div key={n._id} className="flex items-start gap-3">
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />}
                    {n.isRead && <span className="w-2 h-2 shrink-0 mt-1.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referral Card */}
          {referral?.settings?.active && referral?.referralCode && (
            <Link
              to="/referral"
              className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 active:bg-gray-50 transition-colors"
            >
              <span className="text-2xl shrink-0">🎁</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Refer a Friend</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  You both get {(referral.settings.referrerDiscount || 5000).toLocaleString()} DA off
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </Link>
          )}
        </>
      )}

      {/* Need Help */}
      <div className="flex items-center justify-between px-1 pt-2">
        <p className="text-xs text-gray-400">Need help or want to report something?</p>
        <a
          href={mailtoHref}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            reportingEmail ? 'text-brand-600 active:opacity-70' : 'text-gray-300 pointer-events-none'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Email us
        </a>
      </div>

      {disclaimerTitle && (
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-xs text-gray-400">Our terms and policies</p>
          <Link to="/disclaimer" className="flex items-center gap-1.5 text-xs font-medium text-brand-600 active:opacity-70 transition-colors">
            {disclaimerTitle}
          </Link>
        </div>
      )}
    </div>
    </>
  );
}
