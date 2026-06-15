const mongoose = require('mongoose');

const interviewResourceSchema = new mongoose.Schema({
  destination:   { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
  interviewType: { type: String, enum: ['university', 'visa'], required: true },
  topicId:       { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewTopic', default: null },
  universityId:  { type: mongoose.Schema.Types.ObjectId, ref: 'University', default: null },
  title:         { type: String, required: true, trim: true },
  resourceType:  { type: String, enum: ['video', 'image', 'pdf', 'link'], required: true },
  url:           { type: String, required: true, trim: true },
  description:   { type: String, default: '', trim: true },
  order:         { type: Number, default: 0 },
  active:        { type: Boolean, default: true },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('InterviewResource', interviewResourceSchema);
