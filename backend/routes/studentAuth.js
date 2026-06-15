const express = require('express');
const router = express.Router();
const { login, refresh, logout, resetPassword } = require('../controllers/studentAuthController');
const { protect } = require('../middleware/auth');
const { auth: authLimiter, authByPhone, refresh: refreshLimiter } = require('../middleware/rateLimiter');
const wrap = require('../middleware/asyncHandler');

router.post('/login',   authLimiter, authByPhone, wrap(login));
router.post('/refresh', refreshLimiter, wrap(refresh));
router.post('/logout',  wrap(logout));
router.post('/reset-password/:studentId', protect, wrap(resetPassword));

module.exports = router;
