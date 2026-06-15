/**
 * Evaluate whether content should be locked for a student at their current stage.
 * stages: sorted pipelineStage array
 * currentIndex: index of student's current stage in that array
 */
function evaluateVisibility(rule, stages, currentIndex) {
  if (!rule || !rule.ruleType || rule.ruleType === 'always') return { locked: false };

  const fromIdx = rule.fromStage
    ? stages.findIndex(s => s.name === rule.fromStage)
    : -1;
  const toIdx = rule.toStage
    ? stages.findIndex(s => s.name === rule.toStage)
    : -1;

  if (rule.ruleType === 'from_stage') {
    if (fromIdx === -1) return { locked: false };
    if (currentIndex >= fromIdx) return { locked: false };
    return { locked: true, lockedReason: `Available at stage: ${rule.fromStage}` };
  }

  if (rule.ruleType === 'until_stage') {
    if (toIdx === -1) return { locked: false };
    if (currentIndex <= toIdx) return { locked: false };
    return { locked: true, lockedReason: `No longer available after stage: ${rule.toStage}` };
  }

  if (rule.ruleType === 'between_stages') {
    if (fromIdx === -1 || toIdx === -1) return { locked: false };
    if (currentIndex >= fromIdx && currentIndex <= toIdx) return { locked: false };
    if (currentIndex < fromIdx) return { locked: true, lockedReason: `Available at stage: ${rule.fromStage}` };
    return { locked: true, lockedReason: `No longer available after stage: ${rule.toStage}` };
  }

  return { locked: false };
}

module.exports = { evaluateVisibility };
