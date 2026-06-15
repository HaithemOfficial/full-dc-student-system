const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['bachelor', 'master', 'phd', 'other'], default: 'bachelor' },
  duration: { type: String },
  tuitionFee: { type: Number },
  language: { type: String, default: 'English' },
});

const universitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
  city: { type: String, trim: true },
  website: { type: String, trim: true },
  programs: [programSchema],
  applicationFee: { type: Number, default: 0 },
  intakes: [{
    name:     { type: String, required: true },
    openDate: { type: Date },
    closeDate: { type: Date },
  }],
  contactPerson: { type: String },
  contactEmail: { type: String },
  isPartner: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('University', universitySchema);
