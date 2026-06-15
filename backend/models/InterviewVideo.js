const mongoose = require('mongoose');

const interviewVideoSchema = new mongoose.Schema({
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  url:         { type: String, required: true, trim: true },
  platform:    { type: String, enum: ['youtube', 'tiktok'], required: true },
  order:       { type: Number, default: 0 },
  active:      { type: Boolean, default: true },
  visibilityRule: {
    ruleType:  { type: String, enum: ['always', 'from_stage', 'until_stage', 'between_stages'], default: 'always' },
    fromStage: { type: String, default: '' },
    toStage:   { type: String, default: '' },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('InterviewVideo', interviewVideoSchema);
