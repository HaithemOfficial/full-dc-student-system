const InterviewTopic = require('../models/InterviewTopic');
const InterviewQuestion = require('../models/InterviewQuestion');

exports.getByDestination = async (req, res) => {
  const filter = {};
  if (req.query.destination) filter.destination = req.query.destination;
  if (req.user.role !== 'founder') filter.active = true;
  const topics = await InterviewTopic.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(topics);
};

exports.create = async (req, res) => {
  const topic = await InterviewTopic.create({
    ...req.body,
    createdBy: req.user._id,
  });
  res.status(201).json(topic);
};

exports.update = async (req, res) => {
  const topic = await InterviewTopic.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!topic) return res.status(404).json({ message: 'Not found' });
  res.json(topic);
};

exports.remove = async (req, res) => {
  // Unlink questions from this topic before deleting
  await InterviewQuestion.updateMany({ topicId: req.params.id }, { $unset: { topicId: '' } });
  await InterviewTopic.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};
