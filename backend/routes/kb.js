const express = require('express');
const router = express.Router();
const c = require('../controllers/kbController');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);

router.get('/', wrap(c.getArticles));
router.get('/:id', wrap(c.getArticle));

router.use(founderOnly);
router.post('/', wrap(c.createArticle));
router.patch('/:id', wrap(c.updateArticle));
router.patch('/:id/publish', wrap(c.togglePublish));
router.delete('/:id', wrap(c.deleteArticle));

module.exports = router;
