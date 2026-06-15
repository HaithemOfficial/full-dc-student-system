const mongoose = require('mongoose');

const onboardingSlideSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  body:         { type: String, required: true, trim: true },
  emoji:        { type: String, default: '✨', trim: true },
  order:        { type: Number, default: 0 },
  // Empty array = shown to all destinations
  destinations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }],
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('OnboardingSlide', onboardingSlideSchema);
