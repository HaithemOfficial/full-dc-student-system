import { useState, useEffect } from 'react';
import { Check, Lock, ArrowRight, CornerDownRight, GraduationCap, FileCheck, Unlock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import ChecklistPanel from './ChecklistPanel';
import { formatDate } from '../../utils/helpers';

export default function PipelineTracker({ student, onUpdate }) {
  const destination = student.destination;
  const allStages = [...(destination?.pipelineStages || [])].sort((a, b) => a.order - b.order);
  const uniStages  = allStages.filter(s => (s.category || 'uni_acceptance') === 'uni_acceptance');
  const visaStages = allStages.filter(s => s.category === 'visa');

  const getPhase = (stageId) => {
    const s = allStages.find(st => String(st._id) === String(stageId));
    return s?.category === 'visa' ? 'visa' : 'uni_acceptance';
  };

  const [advancing, setAdvancing]           = useState(false);
  const [settingStage, setSettingStage]     = useState(false);
  const [togglingOpen, setTogglingOpen]     = useState(false);
  const [decisionForm, setDecisionForm]     = useState(null); // 'positive' | 'negative' | null
  const [decisionNotes, setDecisionNotes]   = useState('');
  const [settingDecision, setSettingDecision] = useState(false);
  const [openStages, setOpenStages]         = useState(student.openStages || []);
  const [viewingPhase, setViewingPhase]     = useState(() => getPhase(student.currentStageId));
  const [selectedStageId, setSelectedStageId] = useState(String(student.currentStageId));

  // Reset view only when navigating to a different student or when the stage actually advances
  useEffect(() => {
    setViewingPhase(getPhase(student.currentStageId));
    setSelectedStageId(String(student.currentStageId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [String(student._id), String(student.currentStageId)]);

  // Keep open-stages list in sync without disturbing the selected stage
  useEffect(() => {
    setOpenStages(student.openStages || []);
  }, [student.openStages]);

  if (!destination?.pipelineStages?.length) {
    return <p className="text-gray-400 text-sm">No pipeline stages configured for this destination.</p>;
  }

  const currentIdx     = allStages.findIndex(s => String(s._id) === String(student.currentStageId));
  const selectedIdx    = allStages.findIndex(s => String(s._id) === selectedStageId);
  const selectedStage  = allStages[selectedIdx] ?? allStages[currentIdx];
  const isCurrentSelected = String(selectedStageId) === String(student.currentStageId);
  const isLastStage    = currentIdx === allStages.length - 1;
  const studentPhase   = getPhase(student.currentStageId);
  const displayStages  = viewingPhase === 'uni_acceptance' ? uniStages : visaStages;

  const currentStage       = allStages[currentIdx];
  const mandatoryItems     = currentStage?.checklist?.filter(i => i.isMandatory) || [];
  const completedMandatory = mandatoryItems.filter(item =>
    student.checklistCompletions?.find(c => String(c.itemId) === String(item._id) && c.completed)
  );
  const canAdvance = completedMandatory.length === mandatoryItems.length;

  const isStageDone = (stage, globalIdx) => {
    const mandatory = stage.checklist?.filter(i => i.isMandatory) || [];
    if (mandatory.length === 0) return globalIdx < currentIdx;
    return mandatory.every(item =>
      student.checklistCompletions?.find(c => String(c.itemId) === String(item._id) && c.completed)
    );
  };

  const isUniPhaseDone = studentPhase === 'visa';

  const switchPhase = (phase) => {
    setViewingPhase(phase);
    const phaseStages = phase === 'uni_acceptance' ? uniStages : visaStages;
    if (!phaseStages.length) return;
    const inPhase = phaseStages.find(s => String(s._id) === String(student.currentStageId));
    setSelectedStageId(String(inPhase ? student.currentStageId : phaseStages[0]._id));
  };

  const doAdvance = async () => {
    await api.post(`/students/${student._id}/advance-stage`);
    toast.success('Stage complete! Advanced to next stage');
    onUpdate();
  };

  const handleAdvance = async () => {
    if (!canAdvance) return toast.error('Complete all mandatory checklist items before advancing');
    setAdvancing(true);
    try { await doAdvance(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to advance stage'); }
    finally { setAdvancing(false); }
  };

  const handleAutoAdvance = async () => {
    try { await doAdvance(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to advance stage'); onUpdate(); }
  };

  const handleToggleOpen = async (stageId) => {
    setTogglingOpen(true);
    try {
      const res = await api.post(`/students/${student._id}/open-stages/${stageId}/toggle`);
      setOpenStages(res.data.openStages);
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stage access');
    } finally {
      setTogglingOpen(false);
    }
  };

  const handleSetStage = async () => {
    setSettingStage(true);
    try {
      await api.post(`/students/${student._id}/set-stage`, { stageId: selectedStageId });
      toast.success(`Moved to: ${selectedStage.name}`);
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set stage');
    } finally {
      setSettingStage(false);
    }
  };

  const isVisa = viewingPhase === 'visa';
  const isStageManuallyOpen = (stageId) => openStages.some(s => String(s.stageId) === String(stageId));
  const isStageOpen = (stage) => stage?.alwaysOpen || isStageManuallyOpen(stage?._id);
  const isLastInPhase = displayStages.length > 0 && selectedStage &&
    String(displayStages[displayStages.length - 1]._id) === String(selectedStage._id);
  const decisionType    = isVisa ? 'visa' : 'university_acceptance';
  const currentDecision = (student.decisions || []).find(d => d.type === decisionType) || null;

  const handleSetDecision = async () => {
    setSettingDecision(true);
    try {
      await api.post(`/students/${student._id}/decision`, { type: decisionType, outcome: decisionForm, notes: decisionNotes });
      toast.success('Decision recorded');
      setDecisionForm(null);
      setDecisionNotes('');
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record decision');
    } finally {
      setSettingDecision(false);
    }
  };
  const openCount = openStages.length;

  return (
    <div className="card overflow-hidden">

      {/* ── Tab bar ── */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => switchPhase('uni_acceptance')}
          className={`flex-1 flex items-center gap-2.5 px-4 py-3 transition-all border-b-2 ${
            !isVisa
              ? 'bg-brand-50 border-brand-500 text-brand-700'
              : 'bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            isUniPhaseDone ? 'bg-green-500' : studentPhase === 'uni_acceptance' ? 'bg-brand-600' : 'bg-gray-200'
          }`}>
            {isUniPhaseDone
              ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
              : <GraduationCap className={`w-3 h-3 ${studentPhase === 'uni_acceptance' ? 'text-white' : 'text-gray-400'}`} />
            }
          </div>
          <span className="text-xs font-bold"><span className="sm:hidden">University</span><span className="hidden sm:inline">University Acceptance</span></span>
          <div className="ml-auto">
            {isUniPhaseDone
              ? <span className="badge bg-green-100 text-green-700 text-xs">Done</span>
              : studentPhase === 'uni_acceptance'
              ? <span className="badge bg-brand-100 text-brand-700 text-xs">Active</span>
              : null
            }
          </div>
        </button>

        <div className="w-px bg-gray-100 shrink-0" />

        <button
          onClick={() => switchPhase('visa')}
          className={`flex-1 flex items-center gap-2.5 px-4 py-3 transition-all border-b-2 ${
            isVisa
              ? 'bg-orange-50 border-orange-500 text-orange-700'
              : 'bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            studentPhase === 'visa' ? 'bg-orange-500' : isUniPhaseDone ? 'bg-gray-300' : 'bg-gray-100'
          }`}>
            <FileCheck className={`w-3 h-3 ${studentPhase === 'visa' ? 'text-white' : 'text-gray-400'}`} />
          </div>
          <span className="text-xs font-bold"><span className="sm:hidden">Visa</span><span className="hidden sm:inline">Visa Process</span></span>
          {studentPhase === 'visa' && (
            <span className="ml-auto badge bg-orange-100 text-orange-700 text-xs">Active</span>
          )}
        </button>
      </div>

      {/* ── Stage stepper ── */}
      {displayStages.length > 0 ? (
        <>
          <div className="px-4 pt-4 pb-3 overflow-x-auto">
            <div className="flex items-start min-w-max pb-1">
              {displayStages.map((stage, displayIdx) => {
                const globalIdx   = allStages.findIndex(s => String(s._id) === String(stage._id));
                const isCurrent   = String(stage._id) === String(student.currentStageId);
                const isCompleted = isStageDone(stage, globalIdx);
                const isSelected  = String(stage._id) === selectedStageId;

                return (
                  <div key={stage._id} className="flex items-start">
                    <button
                      onClick={() => setSelectedStageId(String(stage._id))}
                      className="flex flex-col items-center gap-2 group w-20"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        isCompleted
                          ? isSelected ? 'bg-green-500 ring-2 ring-offset-2 ring-green-400' : 'bg-green-500 group-hover:bg-green-600'
                          : isCurrent
                          ? isSelected ? 'bg-brand-600 ring-2 ring-offset-2 ring-brand-400' : 'bg-brand-600 group-hover:bg-brand-700'
                          : isSelected
                          ? 'bg-white border-2 border-gray-400 ring-2 ring-offset-2 ring-gray-300'
                          : 'bg-white border-2 border-gray-200 group-hover:border-gray-300'
                      }`}>
                        {isCompleted
                          ? <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          : <span className={`text-xs font-bold ${
                              isCurrent ? 'text-white' : isSelected ? 'text-gray-600' : 'text-gray-300 group-hover:text-gray-500'
                            }`}>{displayIdx + 1}</span>
                        }
                      </div>
                      <span className={`text-xs font-medium text-center leading-tight break-words w-full ${
                        isCurrent ? 'text-brand-700' : isCompleted ? 'text-green-700' : 'text-gray-400 group-hover:text-gray-600'
                      }`}>
                        {stage.name}
                      </span>
                    </button>
                    {displayIdx < displayStages.length - 1 && (
                      <div className={`h-0.5 w-8 mt-4 shrink-0 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Selected stage detail + checklist ── */}
          {selectedStage && (
            <div className={`border-t ${isVisa ? 'border-orange-100' : 'border-brand-100'} px-4 py-4 space-y-3`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{selectedStage.name}</h3>
                  {isCurrentSelected
                    ? <span className="badge bg-brand-100 text-brand-700 text-xs">Current</span>
                    : selectedIdx < currentIdx
                    ? <span className="badge bg-green-100 text-green-700 text-xs">Done</span>
                    : selectedStage.alwaysOpen
                    ? <span className="badge bg-violet-100 text-violet-700 text-xs">Always available</span>
                    : isStageManuallyOpen(selectedStage._id)
                    ? <span className="badge bg-violet-100 text-violet-700 text-xs">Open for student</span>
                    : <span className="badge bg-gray-100 text-gray-500 text-xs">Upcoming</span>
                  }
                  {openCount > 0 && !isCurrentSelected && selectedIdx > currentIdx && !selectedStage.alwaysOpen && (
                    <span className="text-[10px] text-gray-400">{openCount}/2 open</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {!isCurrentSelected && selectedIdx > currentIdx && (
                    (() => {
                      if (selectedStage.alwaysOpen) {
                        return (
                          <span className="text-[10px] text-violet-500 font-medium px-2 py-1 bg-violet-50 rounded-lg border border-violet-200">
                            Always open (set globally)
                          </span>
                        );
                      }
                      const alreadyOpen = isStageManuallyOpen(selectedStage._id);
                      const canOpen = alreadyOpen || openCount < 2;
                      return (
                        <button
                          onClick={() => handleToggleOpen(String(selectedStage._id))}
                          disabled={togglingOpen || (!canOpen)}
                          title={!canOpen ? 'Max 2 stages can be open at the same time' : ''}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            alreadyOpen
                              ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                              : canOpen
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {alreadyOpen
                            ? <><X className="w-3.5 h-3.5" /> Close access</>
                            : <><Unlock className="w-3.5 h-3.5" /> Open for student</>
                          }
                        </button>
                      );
                    })()
                  )}
                  {!isCurrentSelected && (
                    <button
                      onClick={handleSetStage}
                      disabled={settingStage}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      {settingStage ? 'Moving...' : 'Set as Current'}
                    </button>
                  )}
                  {isCurrentSelected && !isLastStage && (
                    <button
                      onClick={handleAdvance}
                      disabled={!canAdvance || advancing}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        canAdvance ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {advancing ? 'Moving...' : canAdvance
                        ? <><ArrowRight className="w-3.5 h-3.5" /> Advance</>
                        : <><Lock className="w-3.5 h-3.5" /> Advance</>
                      }
                    </button>
                  )}
                  {isCurrentSelected && isLastStage && (
                    <span className="badge bg-green-100 text-green-700 text-xs px-2.5 py-1">Final Stage</span>
                  )}
                </div>
              </div>

              <ChecklistPanel
                student={student}
                currentStage={selectedStage}
                onUpdate={onUpdate}
                onAllMandatoryComplete={isCurrentSelected && !isLastStage ? handleAutoAdvance : undefined}
              />

              {/* Decision — shown at the end of the last stage in each phase */}
              {isLastInPhase && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {isVisa ? 'Visa' : 'University'} Decision
                  </p>

                  {currentDecision && (
                    <div className={`rounded-lg px-3 py-2.5 flex items-start gap-2.5 border ${
                      currentDecision.outcome === 'positive'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <span className="text-base shrink-0">{currentDecision.outcome === 'positive' ? '✅' : '❌'}</span>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold ${currentDecision.outcome === 'positive' ? 'text-green-800' : 'text-red-800'}`}>
                          {currentDecision.outcome === 'positive' ? 'Positive decision' : 'Negative decision'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {currentDecision.decidedByName}
                          {currentDecision.decidedAt ? ` · ${formatDate(currentDecision.decidedAt)}` : ''}
                        </p>
                        {currentDecision.notes && (
                          <p className="text-xs text-gray-500 mt-0.5 italic">"{currentDecision.notes}"</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setDecisionForm(decisionForm === 'positive' ? null : 'positive')}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all ${
                        decisionForm === 'positive'
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                      }`}
                    >
                      ✓ Positive
                    </button>
                    <button
                      onClick={() => setDecisionForm(decisionForm === 'negative' ? null : 'negative')}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all ${
                        decisionForm === 'negative'
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                      }`}
                    >
                      ✕ Negative
                    </button>
                  </div>

                  {decisionForm && (
                    <div className="space-y-2">
                      <textarea
                        className="input text-xs resize-none"
                        rows={2}
                        value={decisionNotes}
                        onChange={e => setDecisionNotes(e.target.value)}
                        placeholder="Notes for student (optional)..."
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setDecisionForm(null); setDecisionNotes(''); }}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSetDecision}
                          disabled={settingDecision}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-colors ${
                            decisionForm === 'positive' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {settingDecision ? 'Saving...' : `Record ${decisionForm} decision`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400 px-4 py-5">No stages configured for this phase yet.</p>
      )}

    </div>
  );
}
