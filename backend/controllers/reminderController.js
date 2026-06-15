const Reminder = require('../models/Reminder');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { buildNotification } = require('../utils/notificationUtils');

// Fire notifications for reminders whose notify time has passed
const firePending = async () => {
  const now = new Date();
  const due = await Reminder.find({
    isDone: false,
    notificationSent: false,
  });

  for (const r of due) {
    const fireAt = new Date(r.reminderAt.getTime() - r.notifyBefore * 60 * 1000);
    if (now >= fireAt) {
      // Find founders to also notify
      const founders = await User.find({ role: 'founder', isActive: true }, '_id');
      const recipients = new Set([String(r.createdBy)]);
      founders.forEach(f => recipients.add(String(f._id)));

      const timeStr = r.reminderAt.toLocaleString('en-GB', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      });
      const reminderDetails = [
        r.studentName ? `Student: ${r.studentName}` : '',
        r.stageName ? `Stage: ${r.stageName}` : '',
        `Scheduled: ${timeStr}`,
        r.notes || '',
      ].filter(Boolean).join(' · ');

      const reminderNotif = await buildNotification('reminder', {
        reminderTitle: r.title,
        reminderDetails,
      });

      if (reminderNotif) {
        await Promise.all(
          [...recipients].map(uid =>
            Notification.create({
              recipient: uid,
              type: 'custom',
              ...reminderNotif,
              student: r.student || undefined,
              studentName: r.studentName || undefined,
              createdBy: r.createdBy,
            })
          )
        );
      }

      r.notificationSent = true;
      await r.save();
    }
  }
};

exports.getReminders = async (req, res) => {
  await firePending().catch(() => {}); // best-effort, never fail the request

  const filter = {};
  if (req.user.role !== 'founder') filter.createdBy = req.user._id;
  if (req.query.done === 'true')  filter.isDone = true;
  if (req.query.done === 'false') filter.isDone = false;
  if (req.query.student) filter.student = req.query.student;

  const reminders = await Reminder.find(filter).sort({ reminderAt: 1 });
  res.json(reminders);
};

exports.createReminder = async (req, res) => {
  const reminder = await Reminder.create({
    ...req.body,
    createdBy: req.user._id,
    createdByName: req.user.name,
  });
  res.status(201).json(reminder);
};

exports.updateReminder = async (req, res) => {
  const filter = req.user.role === 'founder'
    ? { _id: req.params.id }
    : { _id: req.params.id, createdBy: req.user._id };

  const reminder = await Reminder.findOneAndUpdate(
    filter,
    { ...req.body, notificationSent: false }, // reset so updated time re-fires
    { new: true }
  );
  if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
  res.json(reminder);
};

exports.toggleDone = async (req, res) => {
  const filter = req.user.role === 'founder'
    ? { _id: req.params.id }
    : { _id: req.params.id, createdBy: req.user._id };

  const reminder = await Reminder.findOne(filter);
  if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
  reminder.isDone = !reminder.isDone;
  await reminder.save();
  res.json(reminder);
};

exports.deleteReminder = async (req, res) => {
  const filter = req.user.role === 'founder'
    ? { _id: req.params.id }
    : { _id: req.params.id, createdBy: req.user._id };

  await Reminder.findOneAndDelete(filter);
  res.json({ message: 'Deleted' });
};
