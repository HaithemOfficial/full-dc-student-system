const express = require('express');
const router = express.Router();
const c = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);

// Order matters: specific paths before /:id
router.post('/check-overdue', wrap(c.checkOverdue));
router.get('/student/:studentId', wrap(c.getStudentTasks));

router.get('/', wrap(c.getTasks));
router.post('/', wrap(c.createTask));
router.put('/:id', wrap(c.updateTask));
router.patch('/:id/status', wrap(c.updateStatus));
router.patch('/:id/done', wrap(c.toggleDone));
router.delete('/:id', wrap(c.deleteTask));

module.exports = router;
