const express = require('express');
const router = express.Router();
const c = require('../controllers/universityController');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);
router.get('/', wrap(c.getUniversities));
router.get('/:id', wrap(c.getUniversity));

router.use(founderOnly);
router.post('/', wrap(c.createUniversity));
router.put('/:id', wrap(c.updateUniversity));
router.delete('/:id', wrap(c.deleteUniversity));

module.exports = router;
