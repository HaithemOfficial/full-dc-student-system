import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Circle, CheckSquare, Square, Clock, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFetch } from '../hooks/useFetch';
import { SkeletonList } from '../components/ui/SkeletonCard';
import ErrorState from '../components/ui/ErrorState';
import { formatDate } from '../utils/date';

function estimatedWeeks(days) {
  if (!days) return null;
  if (days <= 7) return `~${days} day${days !== 1 ? 's' : ''}`;
  const weeks = Math.round(days / 7);
  return `~${weeks} week${weeks !== 1 ? 's' : ''}`;
}

export default function Progress() {
  const { data, loading, error, refetch } = useFetch('/student/me/progress');
  const [expanded, setExpanded] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [decisionPopup, setDecisionPopup] = useState(null);
  const celebrationFired = useRef(false);
  const decisionChecked = useRef(false);

  const toggle = (id) => setExpanded(v => ({ ...v, [id]: !v[id] }));

  useEffect(() => {
    if (data?.decisions?.length && !decisionChecked.current) {
      decisionChecked.current = true;
      for (const d of data.decisions) {
        const seen = localStorage.getItem(`decision_seen_${d._id}`);
        if (!seen) {
          const msgKey = `${d.type === 'university_acceptance' ? 'uni' : 'visa'}_${d.outcome}`;
          const msg = data.decisionMessages?.[msgKey];
          if (msg?.message) {
            setDecisionPopup({
              id:      d._id,
              title:   msg.title || (d.outcome === 'positive' ? 'Good news!' : 'Application update'),
              message: msg.message,
              outcome: d.outcome,
            });
          } else {
            localStorage.setItem(`decision_seen_${d._id}`, '1');
          }
          break;
        }
      }
    }
  }, [data]);

  useEffect(() => {
    if (data?.celebration && !celebrationFired.current) {
      celebrationFired.current = true;
      setShowCelebration(true);
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#4f46e5', '#818cf8', '#a5b4fc', '#10b981', '#fbbf24'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#4f46e5', '#818cf8', '#a5b4fc', '#10b981', '#fbbf24'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      setTimeout(() => setShowCelebration(false), 3500);
    }
  }, [data]);

  return (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto">
      {/* Decision popup */}
      {decisionPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className={`bg-white rounded-3xl p-6 shadow-xl text-center max-w-xs w-full border-2 ${
            decisionPopup.outcome === 'positive' ? 'border-green-200' : 'border-red-200'
          }`}>
            <p className="text-4xl mb-3">{decisionPopup.outcome === 'positive' ? '🎉' : '📋'}</p>
            <p className="text-lg font-bold text-gray-900 mb-2">{decisionPopup.title}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{decisionPopup.message}</p>
            <button
              onClick={() => {
                localStorage.setItem(`decision_seen_${decisionPopup.id}`, '1');
                setDecisionPopup(null);
              }}
              className={`mt-5 w-full py-3 rounded-2xl font-semibold text-sm text-white ${
                decisionPopup.outcome === 'positive' ? 'bg-green-600' : 'bg-gray-700'
              }`}
            >
              OK, got it
            </button>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur rounded-3xl px-8 py-6 shadow-xl text-center mx-4">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-lg font-bold text-gray-900">Stage Complete!</p>
            <p className="text-sm text-gray-500 mt-1">You've advanced to the next stage</p>
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold text-gray-900 mb-4">My Progress</h1>

      {loading && <SkeletonList count={4} />}
      {!loading && error && <ErrorState onRetry={refetch} />}

      {!loading && !error && data && (
        <div className="space-y-4">
          {/* Journey summary card */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl p-5 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-brand-200 text-xs font-medium uppercase tracking-wider">Your journey</p>
                <p className="font-bold text-lg mt-0.5 leading-tight">{data.destinationName || 'Study Abroad'}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{data.progressPercent}%</p>
                <p className="text-brand-200 text-xs">complete</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${data.progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-brand-200 text-[10px] font-medium uppercase tracking-wide">Stage</p>
                <p className="font-bold text-sm mt-0.5">{(data.currentIndex ?? 0) + 1} / {data.totalStages}</p>
              </div>
              <div>
                <p className="text-brand-200 text-[10px] font-medium uppercase tracking-wide">Started</p>
                <p className="font-bold text-sm mt-0.5">{data.startedAt ? formatDate(data.startedAt) : '—'}</p>
              </div>
              <div>
                <p className="text-brand-200 text-[10px] font-medium uppercase tracking-wide">Est. remaining</p>
                <p className="font-bold text-sm mt-0.5">{data.estimatedRemaining ? estimatedWeeks(data.estimatedRemaining) : '—'}</p>
              </div>
            </div>
          </div>

          {/* Decision banners */}
          {(data.decisions || []).length > 0 && (
            <div className="space-y-2">
              {(data.decisions || []).map(d => {
                const msgKey = `${d.type === 'university_acceptance' ? 'uni' : 'visa'}_${d.outcome}`;
                const msg = data.decisionMessages?.[msgKey] || {};
                const title   = msg.title   || (d.outcome === 'positive' ? 'Good news!' : 'Application update');
                const message = msg.message || '';
                return (
                  <div key={d._id} className={`rounded-2xl px-4 py-3.5 flex items-start gap-3 border ${
                    d.outcome === 'positive' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <span className="text-xl mt-0.5 shrink-0">{d.outcome === 'positive' ? '✅' : '❌'}</span>
                    <div>
                      <p className={`text-sm font-bold ${d.outcome === 'positive' ? 'text-green-800' : 'text-red-800'}`}>
                        {title}
                      </p>
                      {message && <p className={`text-xs mt-0.5 leading-relaxed ${d.outcome === 'positive' ? 'text-green-700' : 'text-red-600'}`}>{message}</p>}
                      {d.notes && <p className="text-xs text-gray-500 mt-1 leading-relaxed italic">"{d.notes}"</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stage cards */}
          <div className="relative">
            <div className="absolute start-5 top-5 bottom-5 w-0.5 bg-gray-200" style={{ left: '20px' }} />
            <div className="space-y-3">
              {(data.stages || []).filter(s => s.status !== 'upcoming').map(stage => {
                const isStopped = data.applicationStopped && stage.status !== 'completed';
                const isCompleted = stage.status === 'completed';
                const isCurrent = !isStopped && stage.status === 'current';
                const isUpcoming = isStopped || stage.status === 'upcoming';
                const isParallel = !isStopped && stage.status === 'parallel';
                const isOpen = isCurrent || isParallel || expanded[stage._id];

                const checklist = isCurrent
                  ? (data.studentChecklist || [])
                  : isParallel
                  ? (stage.stageChecklist || [])
                  : [];

                return (
                  <div key={stage._id} className="relative flex gap-4">
                    {/* Node */}
                    <div className="relative z-10 shrink-0 mt-3">
                      {isCompleted && (
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                      )}
                      {isCurrent && (
                        <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center ring-4 ring-brand-100">
                          <span className="w-3 h-3 bg-white rounded-full" />
                        </div>
                      )}
                      {isParallel && (
                        <div className="w-10 h-10 rounded-full bg-violet-100 border-2 border-violet-300 flex items-center justify-center ring-2 ring-violet-100">
                          <span className="w-3 h-3 rounded-full bg-violet-400" />
                        </div>
                      )}
                      {isUpcoming && (
                        <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                          <Circle className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Card */}
                    <div className={`flex-1 rounded-2xl overflow-hidden border transition-all ${
                      isCurrent ? 'border-brand-200 bg-brand-50' :
                      isCompleted ? 'border-green-100 bg-white' :
                      isParallel ? 'border-violet-200 bg-violet-50/40' :
                      'border-gray-100 bg-gray-50'
                    }`}>
                      {/* Header */}
                      <button
                        onClick={() => !isUpcoming && !isCurrent && !isParallel && toggle(stage._id)}
                        disabled={isUpcoming}
                        className={`w-full px-4 py-3.5 text-start flex items-start justify-between gap-3 ${isUpcoming || isCurrent || isParallel ? 'cursor-default' : 'active:opacity-70 transition-opacity'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold text-sm ${isCurrent ? 'text-brand-800' : isCompleted ? 'text-gray-900' : isParallel ? 'text-violet-800' : 'text-gray-400'}`}>
                              {stage.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold bg-brand-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Current</span>
                            )}
                            {isCompleted && (
                              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Done</span>
                            )}
                            {isParallel && (
                              <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Available</span>
                            )}
                          </div>

                          {isCompleted && stage.exitedAt && (
                            <p className="text-xs text-gray-400 mt-0.5">Completed {formatDate(stage.exitedAt)}</p>
                          )}
                          {isCurrent && stage.enteredAt && (
                            <p className="text-xs text-brand-400 mt-0.5">Started {formatDate(stage.enteredAt)}</p>
                          )}
                          {(isUpcoming || isParallel) && stage.estimatedDays && (
                            <p className={`text-xs mt-0.5 ${isParallel ? 'text-violet-400' : 'text-gray-400'}`}>⏱ {estimatedWeeks(stage.estimatedDays)}</p>
                          )}

                        </div>
                        {!isUpcoming && !isCurrent && !isParallel && (
                          isOpen
                            ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                            : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        )}
                      </button>

                      {/* Expanded content */}
                      {isOpen && (
                        <div className="px-4 pb-4 pt-0 space-y-4">
                          <div className="h-px bg-gray-100" />

                          {/* 1. What we're doing */}
                          {(isCurrent || isCompleted || isParallel) && stage.studentDescription && (
                            <div>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isParallel ? 'text-violet-600' : 'text-brand-600'}`}>What we're doing</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{stage.studentDescription}</p>
                            </div>
                          )}

                          {/* 2. Currently waiting for */}
                          {(isCurrent || isParallel) && stage.studentWaitingFor && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Currently waiting for</p>
                              <p className="text-sm text-amber-800">{stage.studentWaitingFor}</p>
                            </div>
                          )}

                          {/* 3. Action required / Stage progress */}
                          {(isCurrent || isParallel) && (stage.studentActionRequired || checklist.length > 0) && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Stage progress</p>
                              {stage.studentActionRequired && (
                                <p className="text-sm text-gray-700 mb-2 leading-relaxed">{stage.studentActionRequired}</p>
                              )}
                              {checklist.length > 0 && (
                                <div className="space-y-1.5">
                                  {checklist.map(item => (
                                    <div key={item._id} className="flex items-start gap-2.5">
                                      {item.completed
                                        ? <CheckSquare className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        : <Square className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />}
                                      <p className={`text-sm leading-snug ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {item.label}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 4. Timeline */}
                          {(isCurrent || isParallel) && stage.estimatedDays && (
                            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-gray-700">Estimated timeline</p>
                                <p className="text-xs text-gray-400">{estimatedWeeks(stage.estimatedDays)} for this stage</p>
                              </div>
                            </div>
                          )}

                          {/* 5. Tips */}
                          {(isCurrent || isParallel) && stage.studentTips && stage.studentTips.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-yellow-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Lightbulb className="w-3 h-3" /> Tips
                              </p>
                              <div className="space-y-1.5">
                                {stage.studentTips.map((tip, i) => (
                                  <div key={i} className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5">
                                    <p className="text-xs text-gray-700 leading-relaxed">💡 {tip}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Empty state for completed stage */}
                          {isCompleted && !stage.studentDescription && (
                            <p className="text-sm text-gray-400">No details for this stage.</p>
                          )}
                          {isParallel && !stage.studentDescription && checklist.length === 0 && (
                            <p className="text-sm text-gray-400">Your agent will share more details soon.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* "More ahead" hint — shown when journey isn't complete */}
              {data.progressPercent < 100 && (
                <div className="relative flex gap-4 pt-1">
                  <div className="relative z-10 shrink-0 mt-1 w-10 flex flex-col items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-100" />
                  </div>
                  <div className="flex-1 pb-2 pt-1">
                    <p className="text-xs text-gray-400 font-medium">Visa process & next steps</p>
                    <p className="text-[11px] text-gray-300 mt-0.5">More stages will unlock as you progress</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
