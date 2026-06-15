const Student = require('../models/Student');
const StudentAccount = require('../models/StudentAccount');

async function resolveRecipients(announcement) {
  if (announcement.target === 'all_students') {
    const accounts = await StudentAccount.find({ isActive: true }).select('student').lean();
    return accounts.map(a => a.student).filter(Boolean);
  }

  if (announcement.target === 'by_destination') {
    const accounts = await StudentAccount.find({ isActive: true }).select('student').lean();
    const activeIds = accounts.map(a => a.student).filter(Boolean);
    const students = await Student.find({
      _id: { $in: activeIds },
      destination: { $in: announcement.destinations },
    }).select('_id').lean();
    return students.map(s => s._id);
  }

  if (announcement.target === 'specific_students') {
    return announcement.specificStudents || [];
  }

  return [];
}

async function sendAnnouncement(announcement) {
  const studentIds = await resolveRecipients(announcement);
  announcement.sentToStudents = studentIds;
  announcement.recipientCount = studentIds.length;
  announcement.status = 'sent';
  announcement.sentAt = new Date();
  await announcement.save();
}

module.exports = { sendAnnouncement, resolveRecipients };
