const express = require('express');
const router = express.Router();
const c = require('../controllers/studentController');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);

router.get('/stats',     wrap(c.getStats));
router.get('/dashboard', founderOnly, wrap(c.getDashboard));
router.get('/activity-log', wrap(c.getActivityLog));
router.get('/', wrap(c.getStudents));
router.post('/', wrap(c.createStudent));
router.get('/:id', wrap(c.getStudent));
router.put('/:id', wrap(c.updateStudent));
router.delete('/:id', founderOnly, wrap(c.archiveStudent));

router.post('/:id/advance-stage', wrap(c.advanceStage));
router.post('/:id/set-stage', wrap(c.setStage));
router.post('/:id/checklist/:itemId/toggle', wrap(c.toggleChecklistItem));

router.put('/:id/documents/:docId', wrap(c.updateDocumentStatus));

router.post('/:id/payments', wrap(c.addPayment));
router.put('/:id/payments/:paymentId', wrap(c.editPayment));
router.delete('/:id/payments/:paymentId', founderOnly, wrap(c.deletePayment));

router.post('/:id/communications', wrap(c.addCommunication));
router.delete('/:id/communications/:commId', founderOnly, wrap(c.deleteCommunication));

router.post('/:id/notify', wrap(c.notifyStudent));
router.post('/:id/open-stages/:stageId/toggle', wrap(c.toggleOpenStage));
router.post('/:id/decision', wrap(c.setDecision));

module.exports = router;
