const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: { type: String },
  type: {
    type: String,
    enum: [
      'new_case', 'stage_blocked', 'document_overdue', 'checklist_overdue',
      'vfs_appointment', 'mediation_code_expiry', 'visa_decision_deadline',
      'custom', 'handoff', 'document_update', 'stage_update'
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  dueDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
