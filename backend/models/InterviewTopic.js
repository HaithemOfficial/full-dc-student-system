const mongoose = require('mongoose');

const interviewTopicSchema = new mongoose.Schema({
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  visibilityRule: {
    ruleType: { type: String, enum: ['always', 'from_stage', 'until_stage', 'between_stages'], default: 'always' },
    fromStage: { type: String, default: '' },
    toStage: { type: String, default: '' },
  },
  interviewType: { type: String, enum: ['university', 'visa'], default: 'university' },
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('InterviewTopic', interviewTopicSchema);
