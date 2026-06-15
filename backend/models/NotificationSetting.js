const mongoose = require('mongoose');

const notificationSettingSchema = new mongoose.Schema({
  key:             { type: String, required: true, unique: true },
  enabled:         { type: Boolean, default: true },
  titleTemplate:   { type: String, default: '' },
  messageTemplate: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('NotificationSetting', notificationSettingSchema);
