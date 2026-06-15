const cron = require('node-cron');
const Announcement = require('../models/Announcement');
const { sendAnnouncement } = require('../utils/sendAnnouncement');

function startAnnouncementScheduler() {
  // Every minute: process due scheduled announcements
  cron.schedule('* * * * *', async () => {
    try {
      const due = await Announcement.find({
        status: 'scheduled',
        scheduledFor: { $lte: new Date() },
      });
      for (const ann of due) {
        await sendAnnouncement(ann);
        console.log(`[scheduler] Sent announcement "${ann.title}" to ${ann.recipientCount} students`);
      }
    } catch (err) {
      console.error('[scheduler] Error processing announcements:', err.message);
    }
  });
  console.log('[scheduler] Announcement scheduler started');
}

module.exports = { startAnnouncementScheduler };
