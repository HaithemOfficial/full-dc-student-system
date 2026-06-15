const express = require('express');
const router = express.Router();
const c = require('../controllers/destinationController');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);
router.get('/', wrap(c.getDestinations));
router.get('/:id', wrap(c.getDestination));

router.use(founderOnly);
router.post('/', wrap(c.createDestination));
router.put('/:id', wrap(c.updateDestination));

router.post('/:id/stages', wrap(c.addStage));
router.put('/:id/stages/reorder', wrap(c.reorderStages));
router.put('/:id/stages/:stageId', wrap(c.updateStage));
router.delete('/:id/stages/:stageId', wrap(c.deleteStage));

router.post('/:id/stages/:stageId/checklist', wrap(c.addChecklistItem));
router.put('/:id/stages/:stageId/checklist/:itemId', wrap(c.updateChecklistItem));
router.delete('/:id/stages/:stageId/checklist/:itemId', wrap(c.deleteChecklistItem));

router.post('/:id/documents', wrap(c.addDocumentDef));
router.put('/:id/documents/reorder', wrap(c.reorderDocumentDefs));
router.put('/:id/documents/:docId', wrap(c.updateDocumentDef));
router.delete('/:id/documents/:docId', wrap(c.deleteDocumentDef));

module.exports = router;
