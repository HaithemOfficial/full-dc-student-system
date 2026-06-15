const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['general', 'interview', 'vfs_appointment', 'document_deadline', 'follow_up', 'meeting', 'custom'],
    default: 'general',
  },
  priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },

  // Scheduling — dueDate holds date or datetime; hasTime=true means time matters
  dueDate:          { type: Date },
  hasTime:          { type: Boolean, default: false },
  notifyBefore:     { type: Number, default: 0 }, // minutes before dueDate to fire notification
  notificationSent: { type: Boolean, default: false },

  // Assignments
  assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedToName: { type: String },
  linkedStudent:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  linkedStudentName: { type: String },

  // Context (from reminders)
  stageName:          { type: String, default: '' },
  checklistItemLabel: { type: String, default: '' },
  notes: { type: String, default: '' },

  // Status
  status:       { type: String, enum: ['pending', 'done'], default: 'pending' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByName: { type: String },
  completedAt:   { type: Date },
  completionNote: { type: String, default: '' },
  lastOverdueNotification: { type: Date },

  // Migration tracking
  reminderId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

taskSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ linkedStudent: 1, createdAt: -1 });
taskSchema.index({ hasTime: 1, status: 1, notificationSent: 1 });
taskSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
