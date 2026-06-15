const mongoose = require('mongoose');

const studentNotificationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentByName: { type: String },
}, { timestamps: true });

studentNotificationSchema.index({ student: 1, createdAt: -1 });
studentNotificationSchema.index({ student: 1, isRead: 1 });

module.exports = mongoose.model('StudentNotification', studentNotificationSchema);
