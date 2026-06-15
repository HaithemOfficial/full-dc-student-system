const express = require('express');
const router  = express.Router();
const InterviewMistake = require('../models/InterviewMistake');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);

router.get('/', wrap(async (req, res) => {
  const filter = { active: true };
  if (req.query.destination) filter.destination = req.query.destination;
  const mistakes = await InterviewMistake.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(mistakes);
}));

router.post('/', founderOnly, wrap(async (req, res) => {
  const mistake = await InterviewMistake.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(mistake);
}));

router.patch('/:id', founderOnly, wrap(async (req, res) => {
  const mistake = await InterviewMistake.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!mistake) return res.status(404).json({ message: 'Not found' });
  res.json(mistake);
}));

router.patch('/:id/toggle', founderOnly, wrap(async (req, res) => {
  const mistake = await InterviewMistake.findById(req.params.id);
  if (!mistake) return res.status(404).json({ message: 'Not found' });
  mistake.active = !mistake.active;
  await mistake.save();
  res.json(mistake);
}));

router.delete('/:id', founderOnly, wrap(async (req, res) => {
  await InterviewMistake.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
}));

module.exports = router;
