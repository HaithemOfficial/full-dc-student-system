const express = require('express');
const router = express.Router();
const c = require('../controllers/studentAppController');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect, founderOnly);
router.get('/stats', wrap(c.getStats));

module.exports = router;
