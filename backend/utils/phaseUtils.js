/**
 * Returns true if Phase 2 (Visa Process) is active for the given student.
 * Phase 2 activates automatically when the student's current stage has category 'visa'.
 */
function isPhase2Active(student, destination) {
  const stages = destination?.pipelineStages || [];
  const currentStage = stages.find(s => String(s._id) === String(student.currentStageId));
  return currentStage?.category === 'visa';
}

/**
 * Returns true if a specific document's triggerStage (within its phase) has been reached.
 * If no triggerStage is set, the doc is always active within its phase.
 */
function isDocTriggerReached(docDefTriggerStageId, student, destination) {
  if (!docDefTriggerStageId) return true;
  const stages = (destination?.pipelineStages || []).sort((a, b) => a.order - b.order);
  const currentIdx = stages.findIndex(s => String(s._id) === String(student.currentStageId));
  const triggerIdx = stages.findIndex(s => String(s._id) === String(docDefTriggerStageId));
  if (triggerIdx < 0) return true;
  return currentIdx >= triggerIdx;
}

module.exports = { isPhase2Active, isDocTriggerReached };
