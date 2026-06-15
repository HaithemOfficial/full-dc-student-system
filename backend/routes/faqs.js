const express = require('express');
const router  = express.Router();
const FAQ = require('../models/FAQ');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);

router.get('/', wrap(async (req, res) => {
  const filter = { active: true };
  if (req.query.destination) {
    filter.$or = [{ destination: req.query.destination }, { destination: null }];
  }
  const faqs = await FAQ.find(filter).sort({ topic: 1, order: 1, createdAt: 1 });
  // Group by topic
  const grouped = {};
  for (const f of faqs) {
    if (!grouped[f.topic]) grouped[f.topic] = [];
    grouped[f.topic].push(f);
  }
  res.json(grouped);
}));

router.post('/', founderOnly, wrap(async (req, res) => {
  const faq = await FAQ.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(faq);
}));

router.patch('/:id', founderOnly, wrap(async (req, res) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faq) return res.status(404).json({ message: 'Not found' });
  res.json(faq);
}));

router.patch('/:id/toggle', founderOnly, wrap(async (req, res) => {
  const faq = await FAQ.findById(req.params.id);
  if (!faq) return res.status(404).json({ message: 'Not found' });
  faq.active = !faq.active;
  await faq.save();
  res.json(faq);
}));

router.delete('/:id', founderOnly, wrap(async (req, res) => {
  await FAQ.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
}));

module.exports = router;
