const mongoose = require('mongoose');

const decisionMsgSchema = new mongoose.Schema({
  title:   { type: String, default: '' },
  message: { type: String, default: '' },
}, { _id: false });

const docStatusSchema = new mongoose.Schema({
  key:          { type: String, required: true },
  dcLabel:      { type: String, required: true },
  studentLabel: { type: String, required: true },
  color:        { type: String, default: 'gray' },
  isReady:      { type: Boolean, default: false },
}, { _id: false });

// Singleton — always upsert with { key: 'global' }
const appSettingsSchema = new mongoose.Schema({
  key:            { type: String, default: 'global', unique: true },
  reportingEmail: { type: String, default: '', trim: true },
  maintenanceMode: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: '', trim: true },
  },
  disclaimer: {
    title: { type: String, default: 'Terms & Disclaimer', trim: true },
    body:  { type: String, default: '', trim: true },
  },
  documentStatuses: { type: [docStatusSchema], default: [] },
  decisionMessages: {
    uni_positive:  { type: decisionMsgSchema, default: () => ({}) },
    uni_negative:  { type: decisionMsgSchema, default: () => ({}) },
    visa_positive: { type: decisionMsgSchema, default: () => ({}) },
    visa_negative: { type: decisionMsgSchema, default: () => ({}) },
  },
}, { timestamps: true });

module.exports = mongoose.model('AppSettings', appSettingsSchema);
