const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['info', 'important', 'urgent', 'celebration'],
    default: 'info',
  },
  target: {
    type: String,
    enum: ['all_students', 'by_destination', 'specific_students'],
    default: 'all_students',
  },
  destinations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }],
  specificStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentByName: { type: String, default: '' },
  sentAt: { type: Date },
  scheduledFor: { type: Date },
  status: { type: String, enum: ['draft', 'sent', 'scheduled'], default: 'draft' },
  sentToStudents: [{ type: mongoose.Schema.Types.ObjectId }],
  recipientCount: { type: Number, default: 0 },
  readBy: [{ type: mongoose.Schema.Types.ObjectId }],
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
