const Announcement = require('../models/Announcement');
const Student = require('../models/Student');
const StudentAccount = require('../models/StudentAccount');
const { sendAnnouncement, resolveRecipients } = require('../utils/sendAnnouncement');

exports.create = async (req, res) => {
  const ann = await Announcement.create({
    ...req.body,
    sentBy: req.user._id,
    sentByName: req.user.name,
    status: 'draft',
  });
  res.status(201).json(ann);
};

exports.getAll = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const announcements = await Announcement.find(filter)
    .sort({ createdAt: -1 })
    .select('-sentToStudents -readBy')
    .populate('destinations', 'name flag')
    .populate('specificStudents', 'firstName lastName');
  res.json(announcements);
};

exports.getOne = async (req, res) => {
  const ann = await Announcement.findById(req.params.id)
    .populate('destinations', 'name flag')
    .populate('specificStudents', 'firstName lastName phone');
  if (!ann) return res.status(404).json({ message: 'Announcement not found' });
  res.json(ann);
};

exports.update = async (req, res) => {
  const ann = await Announcement.findById(req.params.id);
  if (!ann) return res.status(404).json({ message: 'Announcement not found' });
  if (ann.status === 'sent') return res.status(400).json({ message: 'Cannot edit a sent announcement' });
  Object.assign(ann, req.body);
  await ann.save();
  res.json(ann);
};

exports.remove = async (req, res) => {
  const ann = await Announcement.findById(req.params.id);
  if (!ann) return res.status(404).json({ message: 'Announcement not found' });
  if (ann.status === 'sent') return res.status(400).json({ message: 'Cannot delete a sent announcement' });
  await ann.deleteOne();
  res.json({ message: 'Deleted' });
};

exports.send = async (req, res) => {
  const ann = await Announcement.findById(req.params.id);
  if (!ann) return res.status(404).json({ message: 'Announcement not found' });
  if (ann.status === 'sent') return res.status(400).json({ message: 'Already sent' });
  await sendAnnouncement(ann);
  res.json({ message: 'Sent', recipientCount: ann.recipientCount });
};

exports.previewCount = async (req, res) => {
  const { target, destinations, specificStudents } = req.body;
  const mockAnn = { target, destinations, specificStudents };
  const ids = await resolveRecipients(mockAnn);
  res.json({ count: ids.length });
};
