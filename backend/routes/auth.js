const express = require('express');
const router = express.Router();
const { login, refresh, logout, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { auth: authLimiter, authByPhone, refresh: refreshLimiter } = require('../middleware/rateLimiter');
const wrap = require('../middleware/asyncHandler');

router.post('/login',   authLimiter, authByPhone, wrap(login));
router.post('/refresh', refreshLimiter, wrap(refresh));
router.post('/logout',  wrap(logout));
router.get('/me',       protect, wrap(getMe));
router.put('/change-password', protect, wrap(changePassword));

module.exports = router;
