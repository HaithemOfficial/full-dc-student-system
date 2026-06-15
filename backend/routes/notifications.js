const express = require('express');
const router = express.Router();
const c = require('../controllers/notificationController');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);
router.get('/unread-count', wrap(c.getUnreadCount));
router.get('/', wrap(c.getNotifications));
router.put('/mark-all-read', wrap(c.markAllRead));
router.put('/:id/read', wrap(c.markRead));
router.delete('/:id', wrap(c.deleteNotification));

router.get('/all', founderOnly, wrap(c.getAllNotifications));
router.post('/', founderOnly, wrap(c.createCustomNotification));

module.exports = router;
