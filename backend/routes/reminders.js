const express = require('express');
const router = express.Router();
const c = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);

router.get('/',        wrap(c.getReminders));
router.post('/',       wrap(c.createReminder));
router.put('/:id',     wrap(c.updateReminder));
router.patch('/:id/done', wrap(c.toggleDone));
router.delete('/:id',  wrap(c.deleteReminder));

module.exports = router;
