const InterviewResource = require('../models/InterviewResource');

exports.getByDestination = async (req, res) => {
  const filter = {};
  if (req.query.destination) filter.destination = req.query.destination;
  if (req.query.interviewType) filter.interviewType = req.query.interviewType;
  if (!req.user || req.user.role !== 'founder') filter.active = true;
  const resources = await InterviewResource.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(resources);
};

exports.create = async (req, res) => {
  if (!req.body.title || !req.body.url || !req.body.resourceType || !req.body.interviewType) {
    return res.status(400).json({ message: 'title, url, resourceType, and interviewType are required' });
  }
  const resource = await InterviewResource.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(resource);
};

exports.update = async (req, res) => {
  const resource = await InterviewResource.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!resource) return res.status(404).json({ message: 'Not found' });
  res.json(resource);
};

exports.remove = async (req, res) => {
  await InterviewResource.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};
