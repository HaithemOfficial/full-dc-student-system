const Destination = require('../models/Destination');
const Student = require('../models/Student');

exports.getDestinations = async (req, res) => {
  const destinations = await Destination.find().sort({ name: 1 });
  res.json(destinations);
};

exports.getDestination = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  res.json(dest);
};

exports.createDestination = async (req, res) => {
  const dest = await Destination.create(req.body);
  res.status(201).json(dest);
};

exports.updateDestination = async (req, res) => {
  const dest = await Destination.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  res.json(dest);
};

// Pipeline stage management
exports.addStage = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  dest.pipelineStages.push(req.body);
  await dest.save();
  res.json(dest);
};

exports.updateStage = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  const stage = dest.pipelineStages.id(req.params.stageId);
  if (!stage) return res.status(404).json({ message: 'Stage not found' });
  const oldName = stage.name;
  Object.assign(stage, req.body);
  await dest.save();
  // Keep currentStageName in sync when a stage is renamed
  if (req.body.name && req.body.name !== oldName) {
    await Student.updateMany(
      { currentStageId: req.params.stageId },
      { currentStageName: req.body.name }
    );
  }
  res.json(dest);
};

exports.deleteStage = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  dest.pipelineStages.pull({ _id: req.params.stageId });
  // Clear any document triggerStage refs that pointed to the deleted stage
  for (const doc of dest.documentDefinitions) {
    if (String(doc.triggerStage) === req.params.stageId) doc.triggerStage = null;
  }
  await dest.save();
  res.json(dest);
};

exports.reorderStages = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  const { orderedIds } = req.body;
  orderedIds.forEach((id, index) => {
    const stage = dest.pipelineStages.id(id);
    if (stage) stage.order = index;
  });
  await dest.save();
  res.json(dest);
};

// Checklist item management per stage
exports.addChecklistItem = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  const stage = dest.pipelineStages.id(req.params.stageId);
  if (!stage) return res.status(404).json({ message: 'Stage not found' });
  stage.checklist.push(req.body);
  await dest.save();
  res.json(dest);
};

exports.updateChecklistItem = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  const stage = dest.pipelineStages.id(req.params.stageId);
  if (!stage) return res.status(404).json({ message: 'Stage not found' });
  const item = stage.checklist.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  Object.assign(item, req.body);
  await dest.save();
  res.json(dest);
};

exports.deleteChecklistItem = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  const stage = dest.pipelineStages.id(req.params.stageId);
  if (!stage) return res.status(404).json({ message: 'Stage not found' });
  stage.checklist.pull({ _id: req.params.itemId });
  await dest.save();
  res.json(dest);
};

// Document definition management
exports.addDocumentDef = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  dest.documentDefinitions.push(req.body);
  await dest.save();
  res.json(dest);
};

exports.updateDocumentDef = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  const doc = dest.documentDefinitions.id(req.params.docId);
  if (!doc) return res.status(404).json({ message: 'Document definition not found' });
  Object.assign(doc, req.body);
  await dest.save();
  res.json(dest);
};

exports.deleteDocumentDef = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  dest.documentDefinitions.pull({ _id: req.params.docId });
  await dest.save();
  res.json(dest);
};

exports.reorderDocumentDefs = async (req, res) => {
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ message: 'Destination not found' });
  const { orderedIds } = req.body;
  orderedIds.forEach((id, index) => {
    const doc = dest.documentDefinitions.id(id);
    if (doc) doc.order = index;
  });
  await dest.save();
  res.json(dest);
};
