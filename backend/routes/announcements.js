const express = require('express');
const router = express.Router();
const c = require('../controllers/announcementController');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect, founderOnly);

router.get('/', wrap(c.getAll));
router.post('/', wrap(c.create));
router.post('/preview-count', wrap(c.previewCount));
router.get('/:id', wrap(c.getOne));
router.patch('/:id', wrap(c.update));
router.delete('/:id', wrap(c.remove));
router.post('/:id/send', wrap(c.send));

module.exports = router;
