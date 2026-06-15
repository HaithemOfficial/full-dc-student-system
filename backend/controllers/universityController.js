const University = require('../models/University');

exports.getUniversities = async (req, res) => {
  const filter = { isActive: true };
  if (req.query.destination) filter.destination = req.query.destination;
  const universities = await University.find(filter).populate('destination', 'name code flag').sort({ name: 1 });
  res.json(universities);
};

exports.getUniversity = async (req, res) => {
  const uni = await University.findById(req.params.id).populate('destination', 'name code flag');
  if (!uni) return res.status(404).json({ message: 'University not found' });
  res.json(uni);
};

exports.createUniversity = async (req, res) => {
  const uni = await University.create(req.body);
  res.status(201).json(uni);
};

exports.updateUniversity = async (req, res) => {
  const uni = await University.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!uni) return res.status(404).json({ message: 'University not found' });
  res.json(uni);
};

exports.deleteUniversity = async (req, res) => {
  const uni = await University.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!uni) return res.status(404).json({ message: 'University not found' });
  res.json({ message: 'University removed' });
};
