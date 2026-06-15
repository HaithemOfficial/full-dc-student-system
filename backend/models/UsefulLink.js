const mongoose = require('mongoose');

const usefulLinkSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  url:          { type: String, required: true, trim: true },
  description:  { type: String, default: '', trim: true },
  emoji:        { type: String, default: '🔗', trim: true },
  order:        { type: Number, default: 0 },
  destinations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }],
  universities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'University' }],
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('UsefulLink', usefulLinkSchema);
