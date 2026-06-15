const NotificationSetting = require('../models/NotificationSetting');

// Single source of truth for every automated notification in the system.
// category must be one of: 'Student' | 'DC Agent' | 'Founders'
const CATALOG = [
  // ── Student notifications (sent to student PWA) ──────────────────────────
  {
    key: 'stage_advanced',
    label: 'Stage Advanced',
    category: 'Student',
    description: 'Sent to the student when their pipeline stage is moved forward or changed',
    recipientNote: 'Student PWA',
    vars: ['{stageName}', '{studentDescription}'],
    defaultTitle: 'Your application has advanced',
    defaultMessage: "You've been moved to: {stageName}. {studentDescription}",
  },
  {
    key: 'document_updated',
    label: 'Document Ready',
    category: 'Student',
    description: "Sent to the student when one of their documents reaches 'ready' or 'approved' status",
    recipientNote: 'Student PWA',
    vars: ['{documentName}', '{status}'],
    defaultTitle: 'Document update',
    defaultMessage: 'Your document "{documentName}" is now {status}.',
  },
  {
    key: 'phase2_student',
    label: 'Visa Phase Unlocked',
    category: 'Student',
    description: 'Sent to the student when their visa process phase begins',
    recipientNote: 'Student PWA',
    vars: [],
    defaultTitle: 'Visa documents are now required',
    defaultMessage: "Your visa process documents are now active. Check your Documents section to see what's needed.",
  },

  // ── DC Agent notifications ────────────────────────────────────────────────
  {
    key: 'new_case',
    label: 'New Case Assigned',
    category: 'DC Agent',
    description: 'Sent to the DC agent when a student is directly assigned to them',
    recipientNote: 'Assigned DC Agent',
    vars: ['{firstName}', '{lastName}', '{destinationName}'],
    defaultTitle: 'New student case assigned',
    defaultMessage: '{firstName} {lastName} has been assigned to you for {destinationName}.',
  },
  {
    key: 'handoff',
    label: 'Case Handoff',
    category: 'DC Agent',
    description: 'Sent to the DC agent when a case arrives via the handoff form',
    recipientNote: 'Assigned DC Agent',
    vars: ['{firstName}', '{lastName}', '{destinationName}'],
    defaultTitle: 'New case handed off to you',
    defaultMessage: 'Sales team handed off {firstName} {lastName} ({destinationName}) to you.',
  },
  {
    key: 'phase2_agent',
    label: 'Visa Phase Unlocked',
    category: 'DC Agent',
    description: 'Sent to the DC agent when a student enters the visa pipeline stage',
    recipientNote: 'Assigned DC Agent',
    vars: ['{studentName}'],
    defaultTitle: 'Visa documents now active — {studentName}',
    defaultMessage: 'Phase 2 (Visa Process) documents are now unlocked. Start collecting visa documents for {studentName}.',
  },
  {
    key: 'task_assigned',
    label: 'Task Assigned',
    category: 'DC Agent',
    description: 'Sent to the assignee when a normal-priority task is created for them',
    recipientNote: 'Task Assignee',
    vars: ['{createdByName}', '{taskTitle}', '{studentLink}'],
    defaultTitle: 'New task assigned to you',
    defaultMessage: '{createdByName}: "{taskTitle}"{studentLink}',
  },
  {
    key: 'task_urgent',
    label: 'Urgent Task Assigned',
    category: 'DC Agent',
    description: 'Sent to the assignee when an urgent-priority task is created for them',
    recipientNote: 'Task Assignee',
    vars: ['{createdByName}', '{taskTitle}', '{studentLink}'],
    defaultTitle: '🔴 Urgent task assigned to you',
    defaultMessage: '{createdByName}: "{taskTitle}"{studentLink}',
  },
  {
    key: 'task_completed',
    label: 'Task Completed',
    category: 'DC Agent',
    description: 'Sent to the task creator when their task is marked as done',
    recipientNote: 'Task Creator',
    vars: ['{userName}', '{taskTitle}', '{completionNote}'],
    defaultTitle: 'Task completed',
    defaultMessage: '{userName} marked "{taskTitle}" as done{completionNote}',
  },
  {
    key: 'task_overdue',
    label: 'Task Overdue',
    category: 'DC Agent',
    description: 'Sent to the assignee when a task is past its due date',
    recipientNote: 'Task Assignee',
    vars: ['{taskTitle}'],
    defaultTitle: 'Overdue task',
    defaultMessage: '"{taskTitle}" is past its due date',
  },

  // ── Founder notifications ─────────────────────────────────────────────────
  {
    key: 'new_student_created',
    label: 'New Student Enrolled',
    category: 'Founders',
    description: 'Sent to all founders when any new student is added to the system',
    recipientNote: 'All Founders',
    vars: ['{firstName}', '{lastName}', '{destinationName}', '{agentName}'],
    defaultTitle: 'New student enrolled',
    defaultMessage: '{firstName} {lastName} ({destinationName}) has been added by {agentName}.',
  },
  {
    key: 'reminder',
    label: 'Reminder Fired',
    category: 'Founders',
    description: 'Sent to the reminder creator and all founders when a reminder is due',
    recipientNote: 'Creator + All Founders',
    vars: ['{reminderTitle}', '{reminderDetails}'],
    defaultTitle: 'Reminder: {reminderTitle}',
    defaultMessage: '{reminderDetails}',
  },
];

function applyTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? '').toString());
}

// Returns { title, message } with templates applied, or null if the notification is disabled
async function buildNotification(key, vars) {
  const setting = await NotificationSetting.findOne({ key }).lean();
  if (setting && setting.enabled === false) return null;

  const def = CATALOG.find(c => c.key === key);
  if (!def) return null;

  return {
    title:   applyTemplate(setting?.titleTemplate   || def.defaultTitle,   vars),
    message: applyTemplate(setting?.messageTemplate || def.defaultMessage, vars),
  };
}

module.exports = { buildNotification, CATALOG, applyTemplate };
