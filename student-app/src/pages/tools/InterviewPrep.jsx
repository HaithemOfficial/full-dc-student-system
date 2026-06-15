import { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Lock, GraduationCap, FileCheck, Video, Image, FileText, Link, ExternalLink, Bookmark, Check, Timer, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFetch } from '../../hooks/useFetch';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';

const SECTION_META = {
  university: { label: 'University Interview', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  visa:       { label: 'Visa Interview',        icon: FileCheck,       color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-100'   },
};

const ROW_STYLE = {
  video: { wrap: 'bg-red-50 border border-red-100',       ext: 'text-red-400'    },
  image: { wrap: 'bg-sky-50 border border-sky-100',       ext: 'text-sky-400'    },
  pdf:   { wrap: 'bg-orange-50 border border-orange-100', ext: 'text-orange-400' },
  link:  { wrap: 'bg-violet-50 border border-violet-100', ext: 'text-violet-400' },
};

function ResourceIcon({ type }) {
  if (type === 'video') return <Video    className="w-4 h-4 text-red-500 shrink-0" />;
  if (type === 'image') return <Image    className="w-4 h-4 text-blue-500 shrink-0" />;
  if (type === 'pdf')   return <FileText className="w-4 h-4 text-orange-500 shrink-0" />;
  return <Link className="w-4 h-4 text-purple-500 shrink-0" />;
}

function ResourceRow({ resource }) {
  const s = ROW_STYLE[resource.resourceType] || ROW_STYLE.link;
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl active:opacity-80 transition-opacity ${s.wrap}`}
    >
      <ResourceIcon type={resource.resourceType} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-tight">{resource.title}</p>
        {resource.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{resource.description}</p>}
      </div>
      <ExternalLink className={`w-3.5 h-3.5 shrink-0 ${s.ext}`} />
    </a>
  );
}

const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// mode: 'select' | 'practice' | 'results'
export default function InterviewPrep() {
  const { data: content, loading, error, refetch } = useFetch('/student/me/content');

  const [section, setSection]               = useState(null);
  const [mode, setMode]                     = useState('select');
  const [selectedTopics, setSelectedTopics] = useState(new Set()); // empty = all
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [practiceIdx, setPracticeIdx]       = useState(0);
  const [showTip, setShowTip]               = useState(false);
  const [elapsed, setElapsed]               = useState(0);
  const [finalTime, setFinalTime]           = useState(0);
  const [sessionMarks, setSessionMarks]     = useState({}); // qId → 'confident'|'needs_work'
  const [storedConfidence, setStoredConfidence] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dc_interview_confidence') || '{}'); }
    catch { return {}; }
  });
  const timerRef    = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startTimer = () => {
    clearInterval(timerRef.current);
    const t = Date.now();
    startTimeRef.current = t;
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - t) / 1000)), 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setFinalTime(startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : elapsed);
  };

  const interviewUniversity = content?.interviewUniversity ?? false;
  const interviewVisa       = content?.interviewVisa ?? false;
  const allTopics           = content?.interviewTopics || [];
  const allSectionResources = content?.sectionResources || [];

  const availableSections = useMemo(() => {
    const out = [];
    if (interviewUniversity) out.push('university');
    if (interviewVisa)       out.push('visa');
    return out;
  }, [interviewUniversity, interviewVisa]);

  // Default to first available section — no full-screen chooser
  const activeSection = section || availableSections[0] || null;

  const sectionTopics = useMemo(
    () => allTopics.filter(t => t.interviewType === activeSection),
    [allTopics, activeSection]
  );

  const sectionResources = useMemo(
    () => allSectionResources.filter(r => r.interviewType === activeSection),
    [allSectionResources, activeSection]
  );

  const unlockedTopics = sectionTopics.filter(t => !t.locked && (t.questions || []).length > 0);
  const totalUnlockedQs = unlockedTopics.reduce((n, t) => n + (t.questions || []).length, 0);

  const selectedQs = useMemo(() => {
    const source = selectedTopics.size === 0
      ? unlockedTopics
      : unlockedTopics.filter(t => selectedTopics.has(String(t._id)));
    return source.flatMap(t => (t.questions || []).map(q => ({ ...q, topicName: t.name })));
  }, [unlockedTopics, selectedTopics]);

  const topicResults = useMemo(() =>
    practiceQuestions.reduce((acc, q) => {
      const t = q.topicName;
      if (!acc[t]) acc[t] = { confident: 0, needsWork: 0 };
      const mark = sessionMarks[q._id];
      if (mark === 'confident')   acc[t].confident++;
      if (mark === 'needs_work')  acc[t].needsWork++;
      return acc;
    }, {}),
  [practiceQuestions, sessionMarks]);

  const topicConfStr = (t) => {
    const qs = t.questions || [];
    if (qs.length === 0) return null;
    const n = qs.filter(q => storedConfidence[q._id] === 'confident').length;
    return n > 0 ? `${n}/${qs.length}` : null;
  };

  const switchSection = (s) => { setSection(s); setSelectedTopics(new Set()); };

  const toggleTopic = (id) => {
    setSelectedTopics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const startPractice = () => {
    if (selectedQs.length === 0) return;
    setPracticeQuestions([...selectedQs].sort(() => Math.random() - 0.5));
    setPracticeIdx(0);
    setShowTip(false);
    setSessionMarks({});
    startTimer();
    setMode('practice');
  };

  const markAndAdvance = (mark) => {
    const qId = currentQ?._id;
    const newMarks = qId ? { ...sessionMarks, [qId]: mark } : { ...sessionMarks };
    setSessionMarks(newMarks);
    setShowTip(false);
    if (practiceIdx < practiceQuestions.length - 1) {
      setPracticeIdx(i => i + 1);
    } else {
      stopTimer();
      const stored = JSON.parse(localStorage.getItem('dc_interview_confidence') || '{}');
      const merged = { ...stored, ...newMarks };
      localStorage.setItem('dc_interview_confidence', JSON.stringify(merged));
      setStoredConfidence(merged);
      setMode('results');
    }
  };

  const goBack = () => {
    if (mode === 'practice') { stopTimer(); setMode('select'); return; }
    if (mode === 'results')  { setMode('select'); return; }
  };

  const currentQ = practiceQuestions[practiceIdx];
  const meta = activeSection ? SECTION_META[activeSection] : null;

  // ── Loading / error ──────────────────────────────────────────────────────
  const shell = (children) => (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Mock Questions</h1>
      {children}
    </div>
  );

  if (loading) return shell(<SkeletonList count={3} />);
  if (error)   return shell(<ErrorState onRetry={refetch} />);
  if (!loading && availableSections.length === 0 && allTopics.length === 0)
    return shell(<EmptyState icon="🎤" title="No interview prep yet" subtitle="Your agent will set this up for your destination soon." />);

  const hasResources = sectionResources.length > 0 || sectionTopics.some(t => (t.resources || []).length > 0);

  return (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        {mode !== 'select' && (
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Interview Prep</h1>
          {mode === 'practice' && (
            <span className="text-xs font-mono font-semibold text-brand-600 mt-0.5 flex items-center gap-1">
              <Timer className="w-3 h-3" />{formatTime(elapsed)}
            </span>
          )}
          {mode === 'results' && <p className="text-xs font-medium text-green-600 mt-0.5">Session complete</p>}
          {mode === 'select' && meta && availableSections.length === 1 && (
            <p className={`text-xs font-medium ${meta.color} mt-0.5`}>{meta.label}</p>
          )}
        </div>
      </div>

      {/* ── Select screen ── */}
      {mode === 'select' && (
        <>
          {/* Section switcher — only when both are available */}
          {availableSections.length > 1 && (
            <div className="flex gap-3 mb-6">
              {availableSections.map(s => {
                const m = SECTION_META[s];
                const Icon = m.icon;
                const active = activeSection === s;
                return (
                  <button
                    key={s}
                    onClick={() => switchSection(s)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 transition-colors ${
                      active
                        ? `${m.bg} ${m.border}`
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? m.color : 'text-gray-300'}`} />
                    <span className={`text-xs font-semibold leading-tight text-center ${active ? m.color : 'text-gray-400'}`}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {sectionTopics.length === 0 ? (
            <EmptyState icon="🎤" title="No questions yet" subtitle="Check back soon — your agent is setting this up." />
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">Select topics to practice, or leave all selected for a full session.</p>

              {/* All Topics */}
              <button
                onClick={() => setSelectedTopics(new Set())}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 mb-3 transition-colors ${
                  selectedTopics.size === 0 ? 'border-brand-400 bg-brand-50' : 'border-gray-100 bg-white'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selectedTopics.size === 0 ? 'border-brand-500 bg-brand-500' : 'border-gray-300 bg-white'
                }`}>
                  {selectedTopics.size === 0 && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-800 text-start">All Topics</span>
                <span className="text-xs text-gray-400 shrink-0">{totalUnlockedQs} Q</span>
              </button>

              {/* Individual topics */}
              <div className="space-y-2 mb-5">
                {sectionTopics.map(t => {
                  if (t.locked) return (
                    <button
                      key={t._id}
                      onClick={() => toast(t.lockedReason || 'Not available at your current stage.', { icon: '🔒' })}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 opacity-60"
                    >
                      <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                      <span className="flex-1 text-sm font-medium text-gray-400 text-start">{t.name}</span>
                      <span className="text-xs text-gray-300 shrink-0">{t.questionCount || 0} Q</span>
                    </button>
                  );
                  const id = String(t._id);
                  const isSelected = selectedTopics.has(id);
                  const qCount = (t.questions || []).length;
                  return (
                    <button
                      key={id}
                      onClick={() => toggleTopic(id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-colors ${
                        isSelected ? 'border-brand-300 bg-brand-50' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-800 text-start">{t.name}</span>
                      {topicConfStr(t) && (
                        <span className="text-xs text-green-600 font-medium shrink-0">{topicConfStr(t)} ✓</span>
                      )}
                      <span className="text-xs text-gray-400 shrink-0">{qCount} Q</span>
                    </button>
                  );
                })}
              </div>

              {/* Start button */}
              <button
                onClick={startPractice}
                disabled={selectedQs.length === 0}
                className="w-full py-3.5 rounded-2xl bg-brand-600 text-white font-semibold text-sm active:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                Start Practice · {selectedQs.length} question{selectedQs.length !== 1 ? 's' : ''}
              </button>

              {/* Resources */}
              {hasResources && (
                <div className="mt-16 pt-6 border-t border-gray-100">
                <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Bookmark className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-sm font-semibold text-amber-700">Resources</p>
                  </div>
                  <div className="space-y-4">
                    {sectionResources.length > 0 && (
                      <div className="space-y-2">
                        {sectionResources.map(r => <ResourceRow key={r._id} resource={r} />)}
                      </div>
                    )}
                    {sectionTopics.filter(t => (t.resources || []).length > 0).map(t => (
                      <div key={t._id}>
                        <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-2">{t.name}</p>
                        <div className="space-y-2">
                          {(t.resources || []).map(r => <ResourceRow key={r._id} resource={r} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Practice screen ── */}
      {mode === 'practice' && (
        <div className="flex flex-col min-h-[65vh]">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-300"
                style={{ width: `${((practiceIdx + 1) / practiceQuestions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 shrink-0">{practiceIdx + 1} / {practiceQuestions.length}</span>
          </div>

          {currentQ && (
            <>
              <div className="bg-white rounded-3xl border border-gray-100 p-6 flex-1 flex flex-col justify-between shadow-sm">
                <div>
                  <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-3">{currentQ.topicName}</p>
                  <p className="text-lg font-semibold text-gray-900 leading-snug">{currentQ.question}</p>
                </div>
                {currentQ.answerTip && (
                  <div className="mt-6">
                    {showTip ? (
                      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-brand-600 mb-1.5">💡 Answer tip</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{currentQ.answerTip}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowTip(true)}
                        className="w-full border-2 border-dashed border-brand-200 rounded-2xl py-3 text-sm font-medium text-brand-500 active:bg-brand-50 transition-colors"
                      >
                        Show answer tip
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => markAndAdvance('needs_work')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 font-medium text-sm active:bg-orange-100 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Needs work
                </button>
                <button
                  onClick={() => markAndAdvance('confident')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 text-white font-medium text-sm active:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4" /> Got it
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Results screen ── */}
      {mode === 'results' && (
        <div className="flex flex-col items-center text-center pt-6">
          <div className="text-6xl mb-5">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Session Complete!</h2>
          <p className="text-sm text-gray-400 mb-8">Great work going through all your questions</p>

          <div className="flex items-center gap-8 mb-5 bg-white rounded-2xl border border-gray-100 px-8 py-5 w-full justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{practiceQuestions.length}</p>
              <p className="text-xs text-gray-400 mt-1">Questions</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{Object.values(sessionMarks).filter(m => m === 'confident').length}</p>
              <p className="text-xs text-gray-400 mt-1">Got it</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 font-mono">{formatTime(finalTime)}</p>
              <p className="text-xs text-gray-400 mt-1">Time</p>
            </div>
          </div>

          {Object.keys(topicResults).length > 1 && (
            <div className="w-full space-y-2 mb-8">
              {Object.entries(topicResults).map(([topic, stats]) => (
                <div key={topic} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-left">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">{topic}</p>
                  <div className="flex gap-4">
                    <span className="text-xs text-green-600 font-medium">✓ {stats.confident} confident</span>
                    <span className="text-xs text-orange-500 font-medium">↺ {stats.needsWork} needs work</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="w-full space-y-3">
            <button
              onClick={startPractice}
              className="w-full py-3.5 rounded-2xl bg-brand-600 text-white font-semibold text-sm active:bg-brand-700 transition-colors"
            >
              Practice Again
            </button>
            <button
              onClick={() => setMode('select')}
              className="w-full py-3.5 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm active:bg-gray-50 transition-colors"
            >
              Change Topics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
