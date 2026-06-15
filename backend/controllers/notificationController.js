const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  const filter = { recipient: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;
  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
};

exports.getAllNotifications = async (req, res) => {
  const notifications = await Notification.find()
    .populate('recipient', 'name')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(notifications);
};

exports.markRead = async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true }
  );
  res.json({ message: 'Marked as read' });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'All marked as read' });
};

exports.createCustomNotification = async (req, res) => {
  const notif = await Notification.create({
    ...req.body,
    type: 'custom',
    createdBy: req.user._id,
  });
  res.status(201).json(notif);
};

exports.deleteNotification = async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  res.json({ message: 'Notification deleted' });
};

exports.getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ count });
};
