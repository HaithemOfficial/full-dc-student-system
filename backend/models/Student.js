const mongoose = require('mongoose');

const documentStatusSchema = new mongoose.Schema({
  documentDefId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  status: { type: String, default: 'not_requested' },
  notes: { type: String, default: '' },
  phase: { type: String, enum: ['university_acceptance', 'visa_process'], default: 'university_acceptance' },
  history: [{
    status: { type: String },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: { type: String },
  }],
});

const checklistCompletionSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  label: { type: String },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedByName: { type: String },
});

const decisionSchema = new mongoose.Schema({
  type:          { type: String, enum: ['university_acceptance', 'visa'] },
  outcome:       { type: String, enum: ['positive', 'negative'] },
  notes:         { type: String, default: '' },
  decidedAt:     { type: Date, default: Date.now },
  decidedByName: { type: String },
});

const stageHistorySchema = new mongoose.Schema({
  stageId: { type: mongoose.Schema.Types.ObjectId },
  stageName: { type: String },
  enteredAt: { type: Date, default: Date.now },
  exitedAt: { type: Date },
  movedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  movedByName: { type: String },
});

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  method: { type: String, enum: ['cash', 'bank_transfer', 'ccp', 'other'], default: 'cash' },
  category: { type: String, default: '' },
  notes: { type: String, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedByName: { type: String },
}, { timestamps: true });

const communicationSchema = new mongoose.Schema({
  contactType: { type: String, enum: ['student', 'university', 'embassy', 'vfs', 'other'], required: true },
  channel: { type: String, enum: ['call', 'whatsapp', 'email', 'in_person', 'other'], required: true },
  summary: { type: String, required: true },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  loggedByName: { type: String },
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String },
  details: { type: String, default: '' },
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
  // Profile
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  whatsapp: { type: String, trim: true },
  nationality: { type: String, default: 'Algerian' },
  dateOfBirth: { type: Date },
  passportNumber: { type: String, trim: true },
  passportExpiry: { type: Date },

  // Academic background
  bacGrade: { type: String },
  bacYear: { type: Number },
  currentDegree: { type: String },
  fieldOfStudy: { type: String },
  languageLevel: { type: String },

  // Assignment
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedToName: { type: String },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
  destinationName: { type: String },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
  universityName: { type: String },
  program: { type: String },

  // Pipeline
  currentStageId: { type: mongoose.Schema.Types.ObjectId },
  currentStageName: { type: String },
  stageHistory: [stageHistorySchema],
  checklistCompletions: [checklistCompletionSchema],
  // Documents
  documents: [documentStatusSchema],

  // Finance
  serviceAmount: { type: Number, default: 0 },
  payments: [paymentSchema],

  // Key dates & tracking
  mediationCode: { type: String },
  mediationCodeExpiry: { type: Date },
  vfsAppointmentDate: { type: Date },
  visaDecisionDeadline: { type: Date },
  enrollmentConfirmationDate: { type: Date },

  // Status flags
  contractSigned: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String, default: '' },
  isArchived: { type: Boolean, default: false },

  // Communication & notes
  communications: [communicationSchema],
  notes: { type: String, default: '' },
  activityLog: [activitySchema],

  // Decisions
  decisions:          [decisionSchema],
  applicationStopped: { type: Boolean, default: false },

  // Manually opened stages by DC (max 2)
  openStages: [{
    stageId:      { type: mongoose.Schema.Types.ObjectId },
    openedAt:     { type: Date, default: Date.now },
    openedByName: { type: String },
  }],

  // Source
  source: { type: String, enum: ['handoff', 'manual'], default: 'manual' },
  salesAgent: { type: String, default: '' },

  // Referral
  referralCode: { type: String, index: { unique: true, sparse: true } },
}, { timestamps: true });

// Indexes for list queries and filters
studentSchema.index({ isArchived: 1, updatedAt: -1 });
studentSchema.index({ isArchived: 1, assignedTo: 1, updatedAt: -1 });
studentSchema.index({ isArchived: 1, destination: 1 });
studentSchema.index({ isArchived: 1, currentStageName: 1 });
studentSchema.index({ isArchived: 1, isUrgent: 1 });
studentSchema.index({ isArchived: 1, isFlagged: 1 });
studentSchema.index({ isArchived: 1, contractSigned: 1 });

studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

studentSchema.virtual('totalPaid').get(function () {
  return this.payments
    .filter(p => (p.category || '').toLowerCase().trim() === 'service fee')
    .reduce((sum, p) => sum + p.amount, 0);
});

studentSchema.virtual('remainingDebt').get(function () {
  const paid = this.payments
    .filter(p => (p.category || '').toLowerCase().trim() === 'service fee')
    .reduce((sum, p) => sum + p.amount, 0);
  return this.serviceAmount - paid;
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);
