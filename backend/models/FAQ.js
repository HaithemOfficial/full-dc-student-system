const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', default: null },
  topic:       { type: String, required: true, trim: true },
  question:    { type: String, required: true, trim: true },
  answer:      { type: String, required: true },
  order:       { type: Number, default: 0 },
  active:      { type: Boolean, default: true },
  visibilityRule: {
    ruleType:  { type: String, enum: ['always', 'from_stage', 'until_stage', 'between_stages'], default: 'always' },
    fromStage: { type: String, default: '' },
    toStage:   { type: String, default: '' },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('FAQ', faqSchema);
