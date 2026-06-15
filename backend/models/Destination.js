const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  type: { type: String, enum: ['action', 'verification', 'student_notification'], default: 'action' },
  isMandatory: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  studentFacing: { type: Boolean, default: false },
  studentLabel:  { type: String, default: '' },
  notes:         { type: String, default: '' },
});

const pipelineStageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  order: { type: Number, required: true },
  color: { type: String, default: '#3B82F6' },
  description: { type: String, default: '' },
  category: { type: String, enum: ['uni_acceptance', 'visa'], default: 'uni_acceptance' },
  estimatedDays: { type: Number, default: null },
  // Student-facing rich content
  studentDescription: { type: String, default: '' },
  studentWaitingFor: { type: String, default: '' },
  studentActionRequired: { type: String, default: '' },
  studentTips: [{ type: String }],
  checklist: [checklistItemSchema],
  alwaysOpen: { type: Boolean, default: false },
});

const documentDefinitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  isRequired: { type: Boolean, default: true },
  statusFlow: [{
    type: String,
    enum: [
      'not_requested', 'requested', 'received', 'under_review', 'approved',
      'sent_for_translation', 'translated', 'sent_for_legalization', 'legalized', 'ready'
    ]
  }],
  order: { type: Number, default: 0 },
  phase: { type: String, enum: ['university_acceptance', 'visa_process'], default: 'university_acceptance' },
  triggerStage: { type: mongoose.Schema.Types.ObjectId, default: null },
  requirements: { type: [String], default: [] },
  steps:        { type: [String], default: [] },
  notes:        { type: String,   default: '' },
});

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  flag: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  pipelineStages: [pipelineStageSchema],
  documentDefinitions: [documentDefinitionSchema],
  interviewUniversity: { type: Boolean, default: false },
  interviewVisa: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Destination', destinationSchema);
