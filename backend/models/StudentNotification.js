const mongoose = require('mongoose');

const studentNotificationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentByName: { type: String },
}, { timestamps: true });

studentNotificationSchema.index({ student: 1, createdAt: -1 });
studentNotificationSchema.index({ student: 1, isRead: 1 });

// After any notification is saved, send a push notification if the student has subscribed.
studentNotificationSchema.post('save', async function () {
  try {
    const StudentAccount = require('./StudentAccount');
    const { sendPush } = require('../utils/pushUtils');
    const account = await StudentAccount.findOne({ student: this.student }).select('pushSubscription');
    if (!account?.pushSubscription) return;
    await sendPush(account.pushSubscription, this.title, this.message).catch(async (err) => {
      if (err.expired) {
        await StudentAccount.updateOne({ _id: account._id }, { $unset: { pushSubscription: 1 } });
      }
    });
  } catch (_) {}
});

module.exports = mongoose.model('StudentNotification', studentNotificationSchema);
