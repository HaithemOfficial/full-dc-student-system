const InterviewQuestion = require('../models/InterviewQuestion');

exports.getByDestination = async (req, res) => {
  const filter = {};
  if (req.query.destination) filter.destination = req.query.destination;
  // Students only see active questions; founders see all
  if (!req.user || req.user.role !== 'founder') filter.active = true;

  const questions = await InterviewQuestion.find(filter).sort({ topic: 1, order: 1, createdAt: 1 });
  res.json(questions);
};

exports.create = async (req, res) => {
  const question = await InterviewQuestion.create({
    ...req.body,
    createdBy: req.user._id,
  });
  res.status(201).json(question);
};

exports.update = async (req, res) => {
  const question = await InterviewQuestion.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!question) return res.status(404).json({ message: 'Not found' });
  res.json(question);
};

exports.remove = async (req, res) => {
  const question = await InterviewQuestion.findByIdAndDelete(req.params.id);
  if (!question) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
};
