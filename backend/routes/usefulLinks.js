const express = require('express');
const router  = express.Router();
const UsefulLink = require('../models/UsefulLink');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect, founderOnly);

router.get('/', wrap(async (req, res) => {
  const links = await UsefulLink.find()
    .populate('destinations', 'name flag')
    .populate('universities', 'name')
    .sort({ order: 1, createdAt: 1 });
  res.json(links);
}));

router.post('/', wrap(async (req, res) => {
  const link = await UsefulLink.create(req.body);
  res.status(201).json(link);
}));

router.put('/:id', wrap(async (req, res) => {
  const link = await UsefulLink.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('destinations', 'name flag');
  if (!link) return res.status(404).json({ message: 'Link not found' });
  res.json(link);
}));

router.delete('/:id', wrap(async (req, res) => {
  await UsefulLink.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
}));

module.exports = router;
