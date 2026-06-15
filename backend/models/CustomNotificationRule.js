const mongoose = require('mongoose');

const customNotificationRuleSchema = new mongoose.Schema({
  label:     { type: String, required: true },
  trigger: {
    type: String,
    enum: [
      'stage_reached',
      'document_status_changed',
      'student_assigned',
      'visa_phase_started',
      'student_created',
      'payment_recorded',
    ],
    required: true,
  },
  condition: {
    stageName:       { type: String, default: '' }, // empty = any stage
    documentName:    { type: String, default: '' }, // empty = any document
    documentStatus:  { type: String, default: '' }, // empty = any status
    destinationName: { type: String, default: '' }, // empty = any destination
  },
  recipient: { type: String, enum: ['student', 'assigned_agent', 'all_founders'], required: true },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  enabled:   { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CustomNotificationRule', customNotificationRuleSchema);
