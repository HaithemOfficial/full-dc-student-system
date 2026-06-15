const express = require('express');
const router = express.Router();
const c = require('../controllers/notificationSettingsController');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect, founderOnly);
router.get('/',     wrap(c.getAll));
router.put('/:key', wrap(c.update));

module.exports = router;
