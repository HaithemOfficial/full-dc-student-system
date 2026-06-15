const express = require('express');
const router = express.Router();
const PaymentCategory = require('../models/PaymentCategory');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);

// Any authenticated user can read (needed for the payment form dropdown)
router.get('/', wrap(async (req, res) => {
  const cats = await PaymentCategory.find({ active: true }).sort({ name: 1 });
  res.json(cats);
}));

// Founders only for write operations
router.post('/', founderOnly, wrap(async (req, res) => {
  const cat = await PaymentCategory.create(req.body);
  res.status(201).json(cat);
}));

router.put('/:id', founderOnly, wrap(async (req, res) => {
  const cat = await PaymentCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cat) return res.status(404).json({ message: 'Not found' });
  res.json(cat);
}));

router.delete('/:id', founderOnly, wrap(async (req, res) => {
  await PaymentCategory.findByIdAndUpdate(req.params.id, { active: false });
  res.json({ message: 'Deleted' });
}));

module.exports = router;
