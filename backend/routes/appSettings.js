const express = require('express');
const router  = express.Router();
const AppSettings = require('../models/AppSettings');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

// Public — student app reads this without auth
router.get('/public', wrap(async (req, res) => {
  const settings = await AppSettings.findOne({ key: 'global' }).lean();
  res.json({
    reportingEmail:   settings?.reportingEmail   || '',
    maintenanceMode:  settings?.maintenanceMode  || { enabled: false, message: '' },
    disclaimer:       settings?.disclaimer       || { title: 'Terms & Disclaimer', body: '' },
    documentStatuses: settings?.documentStatuses || [],
    decisionMessages: settings?.decisionMessages || {},
  });
}));

// Protected routes
router.use(protect);

router.get('/', founderOnly, wrap(async (req, res) => {
  const settings = await AppSettings.findOne({ key: 'global' }).lean();
  res.json(settings || { reportingEmail: '' });
}));

router.patch('/', founderOnly, wrap(async (req, res) => {
  const allowed = ['reportingEmail', 'maintenanceMode', 'disclaimer', 'documentStatuses', 'decisionMessages'];
  const update = {};
  for (const k of allowed) {
    if (k in req.body) update[k] = req.body[k];
  }
  const settings = await AppSettings.findOneAndUpdate(
    { key: 'global' },
    { $set: update },
    { new: true, upsert: true }
  );
  res.json(settings);
}));

module.exports = router;
