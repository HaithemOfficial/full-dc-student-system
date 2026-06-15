const CustomNotificationRule = require('../models/CustomNotificationRule');

exports.getAll = async (req, res) => {
  const rules = await CustomNotificationRule.find().sort({ createdAt: -1 }).lean();
  res.json(rules);
};

exports.create = async (req, res) => {
  const { label, trigger, condition, recipient, title, message, enabled } = req.body;
  if (!label?.trim() || !trigger || !recipient || !title?.trim() || !message?.trim()) {
    return res.status(400).json({ message: 'label, trigger, recipient, title and message are required' });
  }
  const rule = await CustomNotificationRule.create({ label, trigger, condition, recipient, title, message, enabled });
  res.status(201).json(rule);
};

exports.update = async (req, res) => {
  const rule = await CustomNotificationRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!rule) return res.status(404).json({ message: 'Rule not found' });
  res.json(rule);
};

exports.remove = async (req, res) => {
  await CustomNotificationRule.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};
