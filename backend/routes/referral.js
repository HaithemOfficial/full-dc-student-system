const express = require('express');
const router = express.Router();
const ReferralSettings = require('../models/ReferralSettings');
const Student = require('../models/Student');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

// ── Settings ─────────────────────────────────────────────────────────────────
router.get('/settings', protect, founderOnly, wrap(async (req, res) => {
  const settings = await ReferralSettings.findOne({ key: 'global' }).lean();
  if (!settings) {
    const defaults = new ReferralSettings();
    return res.json(defaults.toObject());
  }
  res.json(settings);
}));

router.patch('/settings', protect, founderOnly, wrap(async (req, res) => {
  const allowed = ['active', 'referrerDiscount', 'referredDiscount', 'discountAppliesTo', 'rulesText', 'howToUseText', 'popupTitle', 'popupMessage'];
  const update = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
  update.updatedBy = req.user._id;

  const settings = await ReferralSettings.findOneAndUpdate(
    { key: 'global' },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );
  res.json(settings);
}));

// ── Code lookup (any authenticated user — agents + founders) ────────────────
router.get('/lookup', protect, wrap(async (req, res) => {
  const code = (req.query.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ message: 'Code is required' });
  const student = await Student.findOne({ referralCode: code })
    .select('firstName lastName phone destinationName currentStageName referralCode')
    .lean();
  if (!student) return res.status(404).json({ message: 'No student found with this code' });
  res.json(student);
}));

// ── Codes directory (founders only) ─────────────────────────────────────────
router.get('/codes', protect, founderOnly, wrap(async (req, res) => {
  const { search = '', page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { isArchived: false, referralCode: { $exists: true, $not: { $in: [null, ''] } } };
  if (search.trim()) {
    const rx = new RegExp(search.trim(), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { phone: rx }, { referralCode: rx }];
  }

  const [students, total] = await Promise.all([
    Student.find(filter)
      .select('firstName lastName phone destinationName currentStageName referralCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Student.countDocuments(filter),
  ]);

  res.json({ students, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
}));

module.exports = router;
