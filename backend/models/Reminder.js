const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['interview', 'vfs_appointment', 'document_deadline', 'follow_up', 'meeting', 'custom'],
    default: 'custom',
  },
  reminderAt: { type: Date, required: true },
  notifyBefore: { type: Number, default: 0 }, // minutes before reminderAt to fire notification
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: { type: String, default: '' },
  stageName: { type: String, default: '' },
  checklistItemLabel: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByName: { type: String },
  isDone: { type: Boolean, default: false },
  notificationSent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
