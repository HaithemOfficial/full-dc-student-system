const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema({
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
  topic: { type: String, required: true, trim: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewTopic', default: null },
  question: { type: String, required: true, trim: true },
  answerTip: { type: String, default: '', trim: true },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('InterviewQuestion', interviewQuestionSchema);
