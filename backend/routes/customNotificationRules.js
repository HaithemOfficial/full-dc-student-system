const router = require('express').Router();
const { protect, founderOnly } = require('../middleware/auth');
const c = require('../controllers/customNotificationRulesController');

router.use(protect, founderOnly);
router.get('/',     c.getAll);
router.post('/',    c.create);
router.put('/:id',  c.update);
router.delete('/:id', c.remove);

module.exports = router;
