const mongoose = require('mongoose');

const kbArticleSchema = new mongoose.Schema({
  type: { type: String, enum: ['destination', 'university'], required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  title: { type: String, required: true, trim: true },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastUpdatedByName: { type: String },

  // ── Shared ──
  destinationRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },
  destinationName: { type: String },

  // ── Destination ──
  countryCode: { type: String },
  flag: { type: String },
  overview: { type: String, default: '' },
  faqs: [{ question: String, answer: String }],
  steps: [{
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
  }],
  deadlines: [{
    label: { type: String, required: true, trim: true },
    date: { type: String, default: '' },
    notes: { type: String, default: '', trim: true },
  }],
  requiredDocuments: [{ name: String, notes: String }],
  financialRequirements: { type: String, default: '' },
  commonMistakes: [String],
  agentTips: { type: String, default: '' },

  // ── University ──
  universityName: { type: String },
  city: { type: String },
  programs: [{ name: String, tuitionFee: Number, language: String }],
  intakes: [{
    semester: { type: String, trim: true },
    applicationDeadline: { type: String },
    startDate: { type: String },
    notes: { type: String, default: '', trim: true },
  }],
  applicationRequirements: { type: String, default: '' },
  admissionProfile: { type: String, default: '' },
  processingTime: { type: String, default: '' },
  isPartner: { type: Boolean, default: false },
  contactEmail: { type: String, default: '' },
  contactPerson: { type: String, default: '' },
  internalNotes: { type: String, default: '' },

  // ── Student-facing ──
  articleType: {
    type: String,
    enum: ['destination_overview', 'university_info', 'visa_checklist', 'after_arrival', 'student_tip', 'guide'],
    default: null,
  },
  guideCategory: {
    type: String,
    enum: ['travel', 'arrival', 'documents', 'accommodation', 'finance', 'general', ''],
    default: '',
  },
  studentFacing: { type: Boolean, default: false },
  linkedStage: { type: String, default: '' },
  visibilityRule: {
    ruleType: { type: String, enum: ['always', 'from_stage', 'until_stage', 'between_stages'], default: 'always' },
    fromStage: { type: String, default: '' },
    toStage: { type: String, default: '' },
  },
}, { timestamps: true });

kbArticleSchema.index({ title: 'text', destinationName: 'text', universityName: 'text' });

module.exports = mongoose.model('KBArticle', kbArticleSchema);
