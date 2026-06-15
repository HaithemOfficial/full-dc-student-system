import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, Flag, FileText, DollarSign, MessageSquare,
  Clock, ClipboardList, Pencil, X, FileSignature, ChevronDown,
  CheckSquare, Smartphone, Send, KeyRound, Copy, Check,
  Phone, Mail, GraduationCap, Plus, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useStudent } from '../../hooks/useStudents';
import { useAuth } from '../../context/AuthContext';
import { useActionItems } from '../../hooks/useActionItems';
import PipelineTracker from '../../components/students/PipelineTracker';
import DocumentTracker from '../../components/students/DocumentTracker';
import FinanceTracker from '../../components/students/FinanceTracker';
import CommunicationLog from '../../components/students/CommunicationLog';
import ActivityLog from '../../components/students/ActivityLog';
import StudentProfileEditor from '../../components/students/StudentProfileEditor';
import { TaskItem } from '../../components/tasks/TaskList';
import ActionItemForm from '../../components/tasks/ActionItemForm';

const TABS = [
  { id: 'pipeline',       label: 'Progress',         icon: CheckSquare },
  { id: 'documents',      label: 'Documents',        icon: FileText },
  { id: 'finance',        label: 'Payments',         icon: DollarSign },
  { id: 'communications', label: 'Communication Log', icon: MessageSquare },
  { id: 'activity',       label: 'History',          icon: Clock },
];

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { student, loading, error, refetch } = useStudent(id);
  const { isFounder } = useAuth();
  const { items, refetch: refetchItems } = useActionItems({ linkedStudent: id });

  const [activeTab,        setActiveTab]        = useState('pipeline');
  const [editingProfile,   setEditingProfile]   = useState(false);
  const [editingNotes,     setEditingNotes]      = useState(false);
  const [notesValue,       setNotesValue]       = useState('');
  const [savingNotes,      setSavingNotes]      = useState(false);
  const [togglingContract, setTogglingContract] = useState(false);
  const [flagPrompt,       setFlagPrompt]       = useState(false);
  const [flagReason,       setFlagReason]       = useState('');
  const [showItemForm,     setShowItemForm]     = useState(false);
  const [editingItem,      setEditingItem]      = useState(null);
  const [showDone,         setShowDone]         = useState(false);
  const [notifyOpen,       setNotifyOpen]       = useState(false);
  const [notifyForm,       setNotifyForm]       = useState({ title: '', message: '' });
  const [sendingNotify,    setSendingNotify]    = useState(false);
  const [resetPassResult,  setResetPassResult]  = useState(null);
  const [resettingPass,    setResettingPass]    = useState(false);
  const [copied,           setCopied]           = useState(false);
  const [archiveConfirm,   setArchiveConfirm]   = useState(false);
  const [archiving,        setArchiving]        = useState(false);

  const toggleContract = async () => {
    setTogglingContract(true);
    try {
      await api.put(`/students/${student._id}`, { contractSigned: !student.contractSigned });
      await refetch();
      toast.success(student.contractSigned ? 'Contract marked as unsigned' : 'Contract marked as signed');
    } catch {
      toast.error('Failed to update contract status');
    } finally {
      setTogglingContract(false);
    }
  };

  const toggleUrgent = async () => {
    try {
      await api.put(`/students/${student._id}`, { isUrgent: !student.isUrgent });
      await refetch();
      toast.success(student.isUrgent ? 'Urgent removed' : 'Marked as urgent');
    } catch {
      toast.error('Failed to update');
    }
  };

  const submitFlag = async (e) => {
    e?.preventDefault();
    try {
      await api.put(`/students/${student._id}`, { isFlagged: true, flagReason: flagReason.trim() });
      await refetch();
      setFlagPrompt(false);
      setFlagReason('');
      toast.success('Student flagged');
    } catch {
      toast.error('Failed to flag student');
    }
  };

  const removeFlag = async () => {
    try {
      await api.put(`/students/${student._id}`, { isFlagged: false, flagReason: '' });
      await refetch();
      toast.success('Flag removed');
    } catch {
      toast.error('Failed to remove flag');
    }
  };

  const startEditNotes = () => { setNotesValue(student.notes || ''); setEditingNotes(true); };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.put(`/students/${student._id}`, { notes: notesValue });
      await refetch();
      setEditingNotes(false);
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const sendNotification = async () => {
    if (!notifyForm.title || !notifyForm.message) return toast.error('Title and message are required');
    setSendingNotify(true);
    try {
      await api.post(`/students/${student._id}/notify`, notifyForm);
      toast.success('Notification sent to student');
      setNotifyOpen(false);
      setNotifyForm({ title: '', message: '' });
    } catch {
      toast.error('Failed to send notification');
    } finally {
      setSendingNotify(false);
    }
  };

  const resetAppPassword = async () => {
    setResettingPass(true);
    try {
      const { data } = await api.post(`/student-auth/reset-password/${student._id}`);
      setResetPassResult(data.generatedPassword);
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setResettingPass(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(resetPassResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const archiveStudent = async () => {
    setArchiving(true);
    try {
      await api.delete(`/students/${student._id}`);
      toast.success('Student archived');
      setArchiveConfirm(false);
      navigate(-1);
    } catch {
      toast.error('Failed to archive student');
      setArchiving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="card p-8 text-center">
      <p className="text-red-500">{error}</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go Back</button>
    </div>
  );

  if (!student) return null;

  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Profile card ── */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <button onClick={() => navigate(-1)} className="btn-secondary p-2 shrink-0 mt-1">
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0 text-sm sm:text-base font-bold text-brand-700 select-none">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">{student.firstName} {student.lastName}</h2>
                  <button
                    onClick={toggleUrgent}
                    title={student.isUrgent ? 'Remove urgent' : 'Mark as urgent'}
                    className={`badge flex items-center gap-1 cursor-pointer transition-colors ${
                      student.isUrgent
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {student.isUrgent ? 'Urgent' : 'Urgent?'}
                  </button>
                  {student.isFlagged ? (
                    <button
                      onClick={removeFlag}
                      title="Remove flag"
                      className="badge bg-yellow-100 text-yellow-700 hover:bg-yellow-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Flag className="w-3 h-3" /> {student.flagReason || 'Flagged'} ×
                    </button>
                  ) : (
                    <button
                      onClick={() => { setFlagPrompt(true); setFlagReason(''); }}
                      title="Flag this student"
                      className="badge bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Flag className="w-3 h-3" /> Flag
                    </button>
                  )}
                  <button
                    onClick={toggleContract}
                    disabled={togglingContract}
                    className={`badge flex items-center gap-1 cursor-pointer transition-colors ${
                      student.contractSigned
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    <FileSignature className="w-3 h-3" />
                    {student.contractSigned ? 'Contract Signed' : 'No Contract'}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 leading-snug">
                  {student.destinationName} · {student.currentStageName} · {student.assignedTo?.name}
                  {student.salesAgent && ` · Via ${student.salesAgent}`}
                </p>
              </div>

              {/* Action buttons — desktop inline */}
              <div className="hidden sm:flex gap-2 shrink-0">
                <button onClick={() => setEditingProfile(true)} className="btn-secondary text-sm">
                  Edit Profile
                </button>
                {isFounder && (
                  <button onClick={() => setArchiveConfirm(true)} className="btn-secondary text-sm text-red-600 hover:bg-red-50 border-red-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Action buttons — mobile below name */}
            <div className="flex sm:hidden gap-2 mt-2">
              <button onClick={() => setEditingProfile(true)} className="btn-secondary text-xs">
                Edit Profile
              </button>
              {isFounder && (
                <button onClick={() => setArchiveConfirm(true)} className="btn-secondary text-xs text-red-600 hover:bg-red-50 border-red-100 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Archive
                </button>
              )}
            </div>

            {/* Contact info */}
            {(student.phone || student.email || student.whatsapp) && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3">
                {student.phone && (
                  <a href={`tel:${student.phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />{student.phone}
                  </a>
                )}
                {student.whatsapp && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />{student.whatsapp}
                  </span>
                )}
                {student.email && (
                  <a href={`mailto:${student.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />{student.email}
                  </a>
                )}
              </div>
            )}

            {/* Referral code */}
            {student.referralCode && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">Referral:</span>
                <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">{student.referralCode}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(student.referralCode); toast.success('Copied'); }}
                  className="p-0.5 text-gray-400 hover:text-brand-600 transition-colors"
                  title="Copy referral code"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Academic info */}
            {(student.universityName || student.university?.name || student.program || student.bacGrade || student.languageLevel || student.passportNumber) && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2">
                {(student.universityName || student.university?.name) && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                    {student.universityName || student.university?.name}
                  </span>
                )}
                {student.program      && <span className="text-xs text-gray-400">{student.program}</span>}
                {student.bacGrade     && <span className="text-xs text-gray-400">BAC {student.bacGrade}</span>}
                {student.languageLevel && <span className="text-xs text-gray-400">{student.languageLevel}</span>}
                {student.passportNumber && <span className="text-xs text-gray-400">PP: {student.passportNumber}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div>
        <div className="overflow-x-auto mb-5">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'pipeline'       && <PipelineTracker student={student} onUpdate={refetch} />}
        {activeTab === 'documents'      && <DocumentTracker student={student} onUpdate={refetch} />}
        {activeTab === 'finance'        && <FinanceTracker student={student} onUpdate={refetch} />}
        {activeTab === 'communications' && <CommunicationLog student={student} onUpdate={refetch} />}
        {activeTab === 'activity'       && <ActivityLog student={student} />}
      </div>

      {/* ── Action Items ── */}
      {(() => {
        const now = new Date();
        const sorted = [...items].sort((a, b) => {
          if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
          const aOver = a.dueDate && new Date(a.dueDate) < now && a.status !== 'done';
          const bOver = b.dueDate && new Date(b.dueDate) < now && b.status !== 'done';
          if (aOver !== bOver) return aOver ? -1 : 1;
          if (a.priority !== b.priority) return a.priority === 'urgent' ? -1 : 1;
          if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return 0;
        });
        const pending      = sorted.filter(i => i.status === 'pending');
        const done         = sorted.filter(i => i.status === 'done');
        const pendingCount = pending.length;

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Action Items</h3>
                {pendingCount > 0 && (
                  <span className="text-xs font-medium bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              <button
                onClick={() => { setEditingItem(null); setShowItemForm(true); }}
                className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {pending.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-dashed border-gray-200">
                <CheckSquare className="w-4 h-4 text-gray-300 shrink-0" />
                <p className="text-sm text-gray-400">No pending actions for this student</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.map(item => (
                  <TaskItem
                    key={item._id}
                    task={item}
                    onUpdate={refetchItems}
                    onEdit={(i) => { setEditingItem(i); setShowItemForm(true); }}
                    showAssignee
                  />
                ))}
              </div>
            )}

            {done.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowDone(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 font-medium uppercase tracking-wider pt-1 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${showDone ? 'rotate-180' : ''}`} />
                  Completed ({done.length})
                </button>
                {showDone && done.map(item => (
                  <TaskItem
                    key={item._id}
                    task={item}
                    onUpdate={refetchItems}
                    onEdit={(i) => { setEditingItem(i); setShowItemForm(true); }}
                    showAssignee
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Notes ── */}
      <div className="card p-4 bg-yellow-50 border-yellow-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Notes</p>
          {!editingNotes && (
            <button onClick={startEditNotes} className="p-1 text-yellow-400 hover:text-yellow-600 transition-colors rounded">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              className="input text-sm min-h-[80px] resize-none bg-white"
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              placeholder="Add notes about this student..."
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={saveNotes} disabled={savingNotes} className="btn-primary text-xs px-3 py-1.5">
                {savingNotes ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditingNotes(false)} className="btn-secondary text-xs px-3 py-1.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {student.notes || <span className="text-yellow-400 italic text-xs">No notes yet — click the pencil to add one</span>}
          </p>
        )}
      </div>

      {/* ── Student App ── */}
      <div className="card p-4 space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-gray-700">Student App</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setNotifyOpen(true)}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Notify Student
          </button>
          <button onClick={resetAppPassword} disabled={resettingPass} className="btn-secondary text-sm flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" /> {resettingPass ? 'Resetting...' : 'Reset App Password'}
          </button>
        </div>
        {resetPassResult && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400">New password — share with student:</p>
              <p className="font-mono font-bold text-brand-700 text-base tracking-widest">{resetPassResult}</p>
            </div>
            <button onClick={copyPassword} className="btn-secondary text-xs flex items-center gap-1">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* ── Notify Student Modal ── */}
      {notifyOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notify Student</h3>
              <button onClick={() => setNotifyOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Title</label>
                <input
                  className="input"
                  value={notifyForm.title}
                  onChange={e => setNotifyForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Your VFS appointment is confirmed"
                />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea
                  className="input min-h-[90px] resize-none"
                  value={notifyForm.message}
                  onChange={e => setNotifyForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Write the message for the student..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={sendNotification} disabled={sendingNotify} className="btn-primary flex-1">
                {sendingNotify ? 'Sending...' : 'Send'}
              </button>
              <button onClick={() => setNotifyOpen(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editingProfile && (
        <StudentProfileEditor
          student={student}
          onClose={() => setEditingProfile(false)}
          onSave={() => { refetch(); setEditingProfile(false); }}
        />
      )}

      {flagPrompt && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Flag className="w-4 h-4 text-yellow-500" /> Flag Student
            </h3>
            <form onSubmit={submitFlag} className="space-y-3">
              <div>
                <label className="label">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  className="input"
                  value={flagReason}
                  onChange={e => setFlagReason(e.target.value)}
                  placeholder="e.g. Missing documents, unresponsive…"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary flex-1 justify-center">Flag</button>
                <button type="button" onClick={() => setFlagPrompt(false)} className="btn-secondary px-5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveConfirm && isFounder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" /> Archive Student
            </h3>
            <p className="text-sm text-gray-600 leading-6">
              This will archive the student record and remove it from the active dashboard. This action can only be performed by founders.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={archiveStudent}
                disabled={archiving}
                className="btn-primary flex-1 justify-center bg-red-600 hover:bg-red-700 border-red-600 disabled:opacity-60"
              >
                {archiving ? 'Archiving...' : 'Archive'}
              </button>
              <button
                type="button"
                onClick={() => setArchiveConfirm(false)}
                disabled={archiving}
                className="btn-secondary px-5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemForm && (
        <ActionItemForm
          initial={editingItem}
          defaultStudent={editingItem ? null : { _id: student._id, firstName: student.firstName, lastName: student.lastName }}
          onClose={() => { setShowItemForm(false); setEditingItem(null); }}
          onSaved={() => { setShowItemForm(false); setEditingItem(null); refetchItems(); }}
        />
      )}
    </div>
  );
}
