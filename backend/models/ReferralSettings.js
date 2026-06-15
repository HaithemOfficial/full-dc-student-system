const mongoose = require('mongoose');

const referralSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  active: { type: Boolean, default: true },
  referrerDiscount: { type: Number, default: 5000 },
  referredDiscount: { type: Number, default: 5000 },
  discountAppliesTo: { type: String, default: 'second installment' },
  rulesText: {
    type: String,
    default: 'Share your referral code with a friend who wants to study abroad. When they sign up with El Nadjah Agency and give your code to their sales agent, you both get 5,000 DA off your second installment. Simple as that.',
  },
  howToUseText: {
    type: String,
    default: '1. Copy your personal referral code below\n2. Share it with a friend who wants to study abroad\n3. Tell them to give your code to their El Nadjah sales agent when they sign up\n4. Once confirmed, you both receive 5,000 DA off your second installment',
  },
  popupTitle:   { type: String, default: 'Share & Save Together 🎁' },
  popupMessage: { type: String, default: 'Share your referral code with friends and you both get 5,000 DA off your second installment!' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ReferralSettings', referralSettingsSchema);
