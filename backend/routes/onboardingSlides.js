const express = require('express');
const router  = express.Router();
const OnboardingSlide = require('../models/OnboardingSlide');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect, founderOnly);

router.get('/', wrap(async (req, res) => {
  const slides = await OnboardingSlide.find()
    .populate('destinations', 'name flag')
    .sort({ order: 1, createdAt: 1 })
    .lean();
  res.json(slides);
}));

router.post('/', wrap(async (req, res) => {
  const { title, body, emoji, order, destinations, isActive } = req.body;
  const slide = await OnboardingSlide.create({ title, body, emoji, order, destinations: destinations || [], isActive });
  res.status(201).json(slide);
}));

router.put('/:id', wrap(async (req, res) => {
  const allowed = ['title', 'body', 'emoji', 'order', 'destinations', 'isActive'];
  const update = {};
  for (const k of allowed) {
    if (k in req.body) update[k] = req.body[k];
  }
  const slide = await OnboardingSlide.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    .populate('destinations', 'name flag');
  if (!slide) return res.status(404).json({ message: 'Slide not found' });
  res.json(slide);
}));

router.delete('/:id', wrap(async (req, res) => {
  await OnboardingSlide.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}));

module.exports = router;
