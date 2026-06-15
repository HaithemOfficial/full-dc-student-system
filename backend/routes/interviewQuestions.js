const express = require('express');
const router = express.Router();
const c = require('../controllers/interviewQuestionController');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);
router.get('/', wrap(c.getByDestination));

router.use(founderOnly);
router.post('/', wrap(c.create));
router.put('/:id', wrap(c.update));
router.delete('/:id', wrap(c.remove));

module.exports = router;
