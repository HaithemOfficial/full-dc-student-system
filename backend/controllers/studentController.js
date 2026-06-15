const Student = require('../models/Student');
const Destination = require('../models/Destination');
const Notification = require('../models/Notification');
const User = require('../models/User');
const StudentAccount = require('../models/StudentAccount');
const StudentNotification = require('../models/StudentNotification');
const { generateStudentPassword } = require('../utils/studentPassword');
const { isPhase2Active } = require('../utils/phaseUtils');
const { buildNotification, applyTemplate } = require('../utils/notificationUtils');
const CustomNotificationRule = require('../models/CustomNotificationRule');
const AppSettings = require('../models/AppSettings');

const generateUniqueReferralCode = async (firstName) => {
  const clean = (firstName || 'USER').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6) || 'USER';
  for (let i = 0; i < 10; i++) {
    const num = String(Math.floor(1000 + Math.random() * 9000));
    const code = `${clean}-${num}`;
    const exists = await Student.findOne({ referralCode: code }).lean();
    if (!exists) return code;
  }
  return `${clean}-${Date.now().toString().slice(-4)}`;
};

const logActivity = (student, action, user, details = '') => {
  student.activityLog.push({
    action,
    performedBy: user._id,
    performedByName: user.name,
    details,
  });
};

const _firePhase2UnlockNotifications = async (student, triggeredByUser) => {
  const name = `${student.firstName} ${student.lastName}`;
  const [agentNotif, studentNotif] = await Promise.all([
    buildNotification('phase2_agent', { studentName: name }),
    buildNotification('phase2_student', {}),
  ]);
  await Promise.all([
    agentNotif && Notification.create({
      recipient: student.assignedTo,
      student: student._id,
      studentName: name,
      type: 'document_update',
      ...agentNotif,
      createdBy: triggeredByUser._id,
    }),
    studentNotif && StudentNotification.create({
      student: student._id,
      title: studentNotif.title,
      message: studentNotif.message,
      sentBy: triggeredByUser._id,
      sentByName: triggeredByUser.name,
    }),
  ].filter(Boolean));
  await _fireCustomRules(
    'visa_phase_started',
    (cond) => !cond.destinationName || cond.destinationName === (student.destinationName || ''),
    { studentName: name, destinationName: student.destinationName || '' },
    student,
    triggeredByUser
  );
};

const _fireCustomRules = async (trigger, conditionMatch, vars, student, triggeredByUser) => {
  const rules = await CustomNotificationRule.find({ trigger, enabled: true }).lean();
  for (const rule of rules) {
    if (!conditionMatch(rule.condition)) continue;
    const title   = applyTemplate(rule.title,   vars);
    const message = applyTemplate(rule.message, vars);
    if (rule.recipient === 'student') {
      await StudentNotification.create({ student: student._id, title, message, sentBy: triggeredByUser._id, sentByName: triggeredByUser.name });
    } else if (rule.recipient === 'assigned_agent') {
      await Notification.create({ recipient: student.assignedTo, student: student._id, studentName: `${student.firstName} ${student.lastName}`, type: 'stage_update', title, message, createdBy: triggeredByUser._id });
    } else if (rule.recipient === 'all_founders') {
      const founders = await User.find({ role: 'founder', isActive: true }, '_id').lean();
      await Promise.all(founders.map(f => Notification.create({ recipient: f._id, student: student._id, studentName: `${student.firstName} ${student.lastName}`, type: 'stage_update', title, message, createdBy: triggeredByUser._id })));
    }
  }
};

const _computeVirtuals = (students) => students.map(s => {
  const paid = (s.payments || [])
    .filter(p => (p.category || '').toLowerCase().trim() === 'service fee')
    .reduce((sum, p) => sum + p.amount, 0);
  return { ...s, totalPaid: paid, remainingDebt: (s.serviceAmount || 0) - paid };
});

exports.getStudents = async (req, res) => {
  const filter = { isArchived: false };
  if (req.user.role === 'dc_agent') filter.assignedTo = req.user._id;
  if (req.query.destination) filter.destination = req.query.destination;
  if (req.query.agent && req.user.role !== 'dc_agent') filter.assignedTo = req.query.agent;
  if (req.query.stage) filter.currentStageName = req.query.stage;
  if (req.query.urgent === 'true') filter.isUrgent = true;
  if (req.query.flagged === 'true') filter.isFlagged = true;
  if (req.query.status === 'no_contract') filter.contractSigned = { $ne: true };

  if (req.query.search) {
    const re = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ firstName: re }, { lastName: re }, { email: re }, { whatsapp: re }, { phone: re }];
  }

  // Payment filters evaluated at DB level
  if (req.query.payment) {
    const svcFeeSum = { $reduce: {
      input: { $filter: { input: { $ifNull: ['$payments', []] }, as: 'p',
        cond: { $eq: [{ $toLower: { $trim: { input: { $ifNull: ['$$p.category', ''] } } } }, 'service fee'] } } },
      initialValue: 0,
      in: { $add: ['$$value', '$$this.amount'] },
    }};
    if (req.query.payment === 'has_debt') filter.$expr = { $gt: ['$serviceAmount', svcFeeSum] };
    else if (req.query.payment === 'paid')   filter.$expr = { $lte: ['$serviceAmount', svcFeeSum] };
    else if (req.query.payment === 'unpaid') filter.$expr = { $eq: [0, svcFeeSum] };
  }

  const baseQuery = () => Student.find(filter)
    .populate('assignedTo', 'name email')
    .populate('destination', 'name code flag')
    .populate('university', 'name city')
    .sort({ updatedAt: -1 })
    .lean();

  if (req.query.page) {
    const pageNum  = Math.max(1, parseInt(req.query.page) || 1);
    const limitNum = Math.min(100, parseInt(req.query.limit) || 25);
    const [students, total] = await Promise.all([
      baseQuery().skip((pageNum - 1) * limitNum).limit(limitNum),
      Student.countDocuments(filter),
    ]);
    return res.json({ students: _computeVirtuals(students), total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  }

  const students = await baseQuery();
  return res.json({ students: _computeVirtuals(students), total: students.length, page: 1, totalPages: 1 });
};

exports.getStudent = async (req, res) => {
  const query = { _id: req.params.id };
  if (req.user.role === 'dc_agent') query.assignedTo = req.user._id;

  const student = await Student.findOne(query)
    .populate('assignedTo', 'name email')
    .populate('destination', 'name code flag pipelineStages documentDefinitions')
    .populate('university', 'name city programs');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
};

exports.createStudent = async (req, res) => {
  // Strip empty strings from optional ObjectId fields
  if (req.body.university === '') req.body.university = undefined;

  const dest = await Destination.findById(req.body.destination);
  if (!dest) return res.status(400).json({ message: 'Destination not found' });

  const assignedUser = await User.findById(req.body.assignedTo);
  if (!assignedUser) return res.status(400).json({ message: 'Assigned user not found' });

  // Initialize documents from destination definitions
  const documents = dest.documentDefinitions.map(d => ({
    documentDefId: d._id,
    name: d.name,
    status: 'not_requested',
    phase: d.phase || 'university_acceptance',
    history: [],
  }));

  // Set initial stage
  const firstStage = dest.pipelineStages.sort((a, b) => a.order - b.order)[0];

  // Initialize checklist completions for ALL stages so future stages can be pre-filled
  const checklistCompletions = dest.pipelineStages.flatMap(stage =>
    stage.checklist.map(item => ({
      itemId: item._id,
      label: item.label,
      completed: false,
    }))
  );

  const referralCode = await generateUniqueReferralCode(req.body.firstName);

  const student = await Student.create({
    ...req.body,
    assignedToName: assignedUser.name,
    destinationName: dest.name,
    documents,
    currentStageId: firstStage?._id,
    currentStageName: firstStage?.name,
    checklistCompletions,
    referralCode,
    stageHistory: firstStage
      ? [{ stageId: firstStage._id, stageName: firstStage.name, movedBy: req.user._id, movedByName: req.user.name }]
      : [],
  });

  // Notify assigned DC agent
  const newCaseNotif = await buildNotification('new_case', {
    firstName: student.firstName, lastName: student.lastName, destinationName: dest.name,
  });
  if (newCaseNotif) {
    await Notification.create({
      recipient: req.body.assignedTo,
      student: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      type: 'new_case',
      ...newCaseNotif,
      createdBy: req.user._id,
    });
  }

  // Notify all founders: new student enrolled
  const enrolledNotif = await buildNotification('new_student_created', {
    firstName: student.firstName,
    lastName: student.lastName,
    destinationName: dest.name,
    agentName: assignedUser.name,
  });
  if (enrolledNotif) {
    const founders = await User.find({ role: 'founder', isActive: true }, '_id').lean();
    await Promise.all(founders.map(f => Notification.create({
      recipient: f._id,
      student: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      type: 'new_case',
      ...enrolledNotif,
      createdBy: req.user._id,
    })));
  }

  // Fire custom rules for student_created
  await _fireCustomRules(
    'student_created',
    (cond) => !cond.destinationName || cond.destinationName === dest.name,
    { firstName: student.firstName, lastName: student.lastName, destinationName: dest.name, agentName: assignedUser.name },
    student,
    req.user
  );

  // Auto-create student app account
  const generatedPassword = generateStudentPassword(student.firstName, student.phone);
  await StudentAccount.create({
    student: student._id,
    phone: student.phone || student.whatsapp || '',
    password: generatedPassword,
  });

  res.status(201).json({ ...student.toJSON(), generatedPassword });
};

exports.updateStudent = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (req.user.role === 'dc_agent' && String(student.assignedTo) !== String(req.user._id))
    return res.status(403).json({ message: 'Not authorized' });

  if (req.body.university === '') req.body.university = undefined;

  const allowedFields = [
    'firstName', 'lastName', 'phone', 'email', 'whatsapp', 'dateOfBirth',
    'passportNumber', 'passportExpiry', 'bacGrade', 'bacYear', 'currentDegree',
    'fieldOfStudy', 'languageLevel', 'notes', 'serviceAmount', 'university',
    'universityName', 'program', 'mediationCode', 'mediationCodeExpiry',
    'vfsAppointmentDate', 'visaDecisionDeadline', 'enrollmentConfirmationDate',
    'isUrgent', 'isFlagged', 'flagReason', 'contractSigned', 'salesAgent',
  ];
  if (req.user.role === 'founder') allowedFields.push('assignedTo', 'assignedToName', 'destination');

  const oldAssignedTo = student.assignedTo?.toString();
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) student[field] = req.body[field];
  });

  logActivity(student, 'Profile updated', req.user);
  await student.save();

  // Fire custom rules when student is reassigned
  if (req.body.assignedTo && req.body.assignedTo !== oldAssignedTo) {
    const newAgent = await User.findById(req.body.assignedTo, 'name').lean();
    await _fireCustomRules(
      'student_assigned',
      (cond) => !cond.destinationName || cond.destinationName === (student.destinationName || ''),
      { studentName: `${student.firstName} ${student.lastName}`, agentName: newAgent?.name || '', destinationName: student.destinationName || '' },
      student,
      req.user
    );
  }
  res.json(student);
};

// Move student to next pipeline stage
exports.advanceStage = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('destination', 'pipelineStages');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (req.user.role === 'dc_agent' && String(student.assignedTo) !== String(req.user._id))
    return res.status(403).json({ message: 'Not authorized' });

  if (student.applicationStopped)
    return res.status(400).json({ message: 'Cannot advance: this student received a negative university decision and their application is stopped.' });

  const stages = student.destination.pipelineStages.sort((a, b) => a.order - b.order);
  const currentIndex = stages.findIndex(s => String(s._id) === String(student.currentStageId));
  const currentStage = stages[currentIndex];

  // Check mandatory checklist items
  if (currentStage) {
    const mandatoryItems = currentStage.checklist.filter(i => i.isMandatory);
    for (const item of mandatoryItems) {
      const completion = student.checklistCompletions.find(c => String(c.itemId) === String(item._id));
      if (!completion || !completion.completed) {
        return res.status(400).json({
          message: `Cannot advance: mandatory checklist item not completed: "${item.label}"`,
          blockedBy: item.label,
        });
      }
    }
  }

  const nextStage = stages[currentIndex + 1];
  if (!nextStage) return res.status(400).json({ message: 'Already at the final stage' });

  // Detect phase 2 unlock before advancing
  const wasPhase2Active = isPhase2Active(student, student.destination);

  // Close current stage history
  const currentHistory = student.stageHistory.find(
    h => String(h.stageId) === String(student.currentStageId) && !h.exitedAt
  );
  if (currentHistory) {
    currentHistory.exitedAt = new Date();
  }

  // Add checklist items for next stage only if not already present (preserves pre-filled items)
  const existingItemIds = new Set(student.checklistCompletions.map(c => String(c.itemId)));
  for (const item of nextStage.checklist) {
    if (!existingItemIds.has(String(item._id))) {
      student.checklistCompletions.push({ itemId: item._id, label: item.label, completed: false });
    }
  }

  student.currentStageId = nextStage._id;
  student.currentStageName = nextStage.name;
  student.stageHistory.push({
    stageId: nextStage._id,
    stageName: nextStage.name,
    movedBy: req.user._id,
    movedByName: req.user.name,
  });

  logActivity(student, `Advanced to stage: ${nextStage.name}`, req.user);
  await student.save();

  // Trigger celebration in student app on next progress fetch
  await StudentAccount.findOneAndUpdate({ student: student._id }, { celebrationPending: true });

  // Notify student about stage advancement
  const stageNotif = await buildNotification('stage_advanced', {
    stageName: nextStage.name,
    studentDescription: nextStage.description || '',
  });
  if (stageNotif) {
    await StudentNotification.create({
      student: student._id,
      title: stageNotif.title,
      message: stageNotif.message,
      sentBy: req.user._id,
      sentByName: req.user.name,
    });
  }

  // Fire phase 2 unlock notifications if newly activated
  const nowPhase2Active = isPhase2Active(student, student.destination);
  if (!wasPhase2Active && nowPhase2Active) {
    await _firePhase2UnlockNotifications(student, req.user);
  }

  // Fire custom notification rules for stage_reached
  await _fireCustomRules(
    'stage_reached',
    (cond) => !cond?.stageName || cond.stageName === nextStage.name,
    { studentName: `${student.firstName} ${student.lastName}`, stageName: nextStage.name, destinationName: student.destinationName || '' },
    student, req.user
  );

  res.json(student);
};

// Jump to any pipeline stage (bypasses mandatory checks)
exports.setStage = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('destination', 'pipelineStages');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (req.user.role === 'dc_agent' && String(student.assignedTo) !== String(req.user._id))
    return res.status(403).json({ message: 'Not authorized' });

  const { stageId } = req.body;
  const stages = student.destination.pipelineStages;
  const targetStage = stages.find(s => String(s._id) === String(stageId));
  if (!targetStage) return res.status(400).json({ message: 'Stage not found' });

  if (String(student.currentStageId) === String(stageId))
    return res.status(400).json({ message: 'Already on this stage' });

  // Detect phase 2 unlock before moving
  const wasPhase2Active = isPhase2Active(student, student.destination);

  // Close current stage history entry
  const currentHistory = student.stageHistory.find(
    h => String(h.stageId) === String(student.currentStageId) && !h.exitedAt
  );
  if (currentHistory) currentHistory.exitedAt = new Date();

  // Ensure target stage checklist items exist (in case student was created before this fix)
  const existingItemIds = new Set(student.checklistCompletions.map(c => String(c.itemId)));
  for (const item of targetStage.checklist) {
    if (!existingItemIds.has(String(item._id))) {
      student.checklistCompletions.push({ itemId: item._id, label: item.label, completed: false });
    }
  }

  student.currentStageId = targetStage._id;
  student.currentStageName = targetStage.name;
  student.stageHistory.push({
    stageId: targetStage._id,
    stageName: targetStage.name,
    movedBy: req.user._id,
    movedByName: req.user.name,
  });

  logActivity(student, `Stage set to: ${targetStage.name}`, req.user);
  await student.save();

  // Trigger celebration in student app on next progress fetch
  await StudentAccount.findOneAndUpdate({ student: student._id }, { celebrationPending: true });

  // Notify student about stage change
  const stageNotif = await buildNotification('stage_advanced', {
    stageName: targetStage.name,
    studentDescription: targetStage.description || '',
  });
  if (stageNotif) {
    await StudentNotification.create({
      student: student._id,
      title: stageNotif.title,
      message: stageNotif.message,
      sentBy: req.user._id,
      sentByName: req.user.name,
    });
  }

  // Fire phase 2 unlock notifications if newly activated
  const nowPhase2Active = isPhase2Active(student, student.destination);
  if (!wasPhase2Active && nowPhase2Active) {
    await _firePhase2UnlockNotifications(student, req.user);
  }

  // Fire custom notification rules for stage_reached
  await _fireCustomRules(
    'stage_reached',
    (cond) => !cond?.stageName || cond.stageName === targetStage.name,
    { studentName: `${student.firstName} ${student.lastName}`, stageName: targetStage.name, destinationName: student.destinationName || '' },
    student, req.user
  );

  res.json(student);
};

// Toggle checklist item
exports.toggleChecklistItem = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('destination', 'pipelineStages');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (req.user.role === 'dc_agent' && String(student.assignedTo) !== String(req.user._id))
    return res.status(403).json({ message: 'Not authorized' });

  const { itemId } = req.params;
  let item = student.checklistCompletions.find(c => String(c.itemId) === itemId);

  // For students created before all-stages init: create the entry on the fly
  if (!item) {
    let label = null;
    for (const stage of (student.destination?.pipelineStages || [])) {
      const ci = stage.checklist.find(ci => String(ci._id) === itemId);
      if (ci) { label = ci.label; break; }
    }
    if (!label) return res.status(404).json({ message: 'Checklist item not found' });
    student.checklistCompletions.push({ itemId, label, completed: false });
    item = student.checklistCompletions[student.checklistCompletions.length - 1];
  }

  item.completed = !item.completed;
  item.completedAt = item.completed ? new Date() : undefined;
  item.completedBy = item.completed ? req.user._id : undefined;
  item.completedByName = item.completed ? req.user.name : undefined;

  logActivity(student, `Checklist item "${item.label}" ${item.completed ? 'checked' : 'unchecked'}`, req.user);
  await student.save();
  res.json(student);
};

// Update document status
exports.updateDocumentStatus = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('destination', 'documentDefinitions');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (req.user.role === 'dc_agent' && String(student.assignedTo) !== String(req.user._id))
    return res.status(403).json({ message: 'Not authorized' });

  // docId is documentDefId — find or create the student's document entry
  let doc = student.documents.find(d => String(d.documentDefId) === req.params.docId);
  if (!doc) {
    const def = (student.destination?.documentDefinitions || [])
      .find(d => String(d._id) === req.params.docId);
    if (!def) return res.status(404).json({ message: 'Document definition not found' });
    student.documents.push({
      documentDefId: def._id,
      name: def.name,
      phase: def.phase || 'university_acceptance',
      status: 'not_requested',
    });
    doc = student.documents[student.documents.length - 1];
  }

  const prevStatus = doc.status;
  doc.status = req.body.status;
  if (req.body.notes !== undefined) doc.notes = req.body.notes;
  doc.history.push({
    status: req.body.status,
    changedBy: req.user._id,
    changedByName: req.user.name,
  });

  logActivity(student, `Document "${doc.name}" status changed: ${prevStatus} → ${req.body.status}`, req.user);
  await student.save();

  // Notify student when their document reaches a positive status
  if (['ready', 'approved'].includes(req.body.status)) {
    const docNotif = await buildNotification('document_updated', {
      documentName: doc.name,
      status: req.body.status,
    });
    if (docNotif) {
      await StudentNotification.create({
        student: student._id,
        title: docNotif.title,
        message: docNotif.message,
        sentBy: req.user._id,
        sentByName: req.user.name,
      });
    }
  }

  // Fire custom notification rules for document_status_changed
  await _fireCustomRules(
    'document_status_changed',
    (cond) => {
      if (cond?.documentName && cond.documentName !== doc.name) return false;
      if (cond?.documentStatus && cond.documentStatus !== req.body.status) return false;
      return true;
    },
    { studentName: `${student.firstName} ${student.lastName}`, documentName: doc.name, status: req.body.status, destinationName: student.destinationName || '' },
    student, req.user
  );

  res.json(student);
};

// Add payment
exports.addPayment = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (req.user.role === 'dc_agent' && String(student.assignedTo) !== String(req.user._id))
    return res.status(403).json({ message: 'Not authorized' });

  student.payments.push({
    ...req.body,
    recordedBy: req.user._id,
    recordedByName: req.user.name,
  });
  logActivity(student, `Payment recorded: ${req.body.amount} DZD`, req.user, req.body.notes);
  await student.save();
  await _fireCustomRules(
    'payment_recorded',
    () => true,
    { studentName: `${student.firstName} ${student.lastName}`, amount: String(req.body.amount || ''), currency: req.body.currency || 'DZD', destinationName: student.destinationName || '' },
    student,
    req.user
  );
  res.json(student);
};

exports.editPayment = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (req.user.role === 'dc_agent' && String(student.assignedTo) !== String(req.user._id))
    return res.status(403).json({ message: 'Not authorized' });

  const payment = student.payments.id(req.params.paymentId);
  if (!payment) return res.status(404).json({ message: 'Payment not found' });

  const { amount, date, method, category, notes } = req.body;
  if (amount  !== undefined) payment.amount   = Number(amount);
  if (date    !== undefined) payment.date      = date;
  if (method  !== undefined) payment.method    = method;
  if (category !== undefined) payment.category = category;
  if (notes   !== undefined) payment.notes     = notes;

  logActivity(student, `Payment updated: ${payment.amount} DZD`, req.user);
  await student.save();
  res.json(student);
};

exports.deletePayment = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  student.payments.pull({ _id: req.params.paymentId });
  logActivity(student, 'Payment deleted', req.user);
  await student.save();
  res.json(student);
};

// Add communication log
exports.addCommunication = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (req.user.role === 'dc_agent' && String(student.assignedTo) !== String(req.user._id))
    return res.status(403).json({ message: 'Not authorized' });

  student.communications.push({
    ...req.body,
    loggedBy: req.user._id,
    loggedByName: req.user.name,
  });
  logActivity(student, `Communication logged: ${req.body.channel} with ${req.body.contactType}`, req.user);
  await student.save();
  res.json(student);
};

exports.deleteCommunication = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  student.communications.pull({ _id: req.params.commId });
  await student.save();
  res.json(student);
};

exports.archiveStudent = async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json({ message: 'Student archived' });
};

exports.getActivityLog = async (req, res) => {
  const limit = Math.min(200, parseInt(req.query.limit) || 100);
  const filter = { isArchived: false };
  if (req.user.role === 'dc_agent') filter.assignedTo = req.user._id;

  // Use aggregation to unwind, sort, and limit activity log entries at DB level
  const logs = await Student.aggregate([
    { $match: filter },
    { $project: { firstName: 1, lastName: 1, activityLog: 1 } },
    { $unwind: { path: '$activityLog', preserveNullAndEmptyArrays: false } },
    { $sort: { 'activityLog.createdAt': -1 } },
    { $limit: limit },
    { $project: {
      _id: '$activityLog._id',
      action: '$activityLog.action',
      details: '$activityLog.details',
      performedBy: '$activityLog.performedBy',
      performedByName: '$activityLog.performedByName',
      createdAt: '$activityLog.createdAt',
      studentId: '$_id',
      studentName: { $concat: ['$firstName', ' ', '$lastName'] },
    }},
  ]);

  res.json(logs);
};

exports.notifyStudent = async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message)
    return res.status(400).json({ message: 'Title and message are required' });

  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (req.user.role === 'dc_agent' && String(student.assignedTo) !== String(req.user._id))
    return res.status(403).json({ message: 'Not authorized' });

  const notification = await StudentNotification.create({
    student: student._id,
    title,
    message,
    sentBy: req.user._id,
    sentByName: req.user.name,
  });

  res.status(201).json(notification);
};

exports.getStats = async (req, res) => {
  const filter = {};
  if (req.user.role === 'dc_agent') filter.assignedTo = req.user._id;

  const [total, urgent, flagged, byStage] = await Promise.all([
    Student.countDocuments({ ...filter, isArchived: false }),
    Student.countDocuments({ ...filter, isArchived: false, isUrgent: true }),
    Student.countDocuments({ ...filter, isArchived: false, isFlagged: true }),
    Student.aggregate([
      { $match: { ...filter, isArchived: false } },
      { $group: { _id: '$currentStageName', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({ total, urgent, flagged, byStage });
};

exports.getDashboard = async (req, res) => {
  const now            = new Date();
  const in14Days       = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Optional period filter: which student cohort to show
  const { period } = req.query;
  let periodFilter = {};
  if (period === 'month')   periodFilter = { createdAt: { $gte: thisMonthStart } };
  if (period === 'quarter') periodFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 2, 1) } };
  if (period === 'year')    periodFilter = { createdAt: { $gte: new Date(now.getFullYear(), 0, 1) } };

  const base    = { isArchived: false, ...periodFilter };
  const baseAll = { isArchived: false }; // always all students, for cash-flow metrics

  // Reusable expression: sum of service-fee payments per student
  const serviceFeeSum = {
    $reduce: {
      input: { $filter: {
        input: '$payments',
        cond: {
          $eq: [{ $toLower: { $trim: { input: { $ifNull: ['$$this.category', ''] } } } }, 'service fee'],
        },
      }},
      initialValue: 0,
      in: { $add: ['$$value', '$$this.amount'] },
    },
  };

  // Helper: count decisions of a specific type+outcome per student (for $addFields)
  const decisionFlag = (type, outcome) => ({
    $gt: [{
      $size: { $filter: {
        input: { $ifNull: ['$decisions', []] },
        as: 'd',
        cond: { $and: [{ $eq: ['$$d.type', type] }, { $eq: ['$$d.outcome', outcome] }] },
      }},
    }, 0],
  });

  const [
    total,
    urgentDocs,
    flaggedDocs,
    stoppedDocs,
    noContractDocs,
    financeSummary,
    byStage,
    newThisMonth,
    newLastMonth,
    agentBreakdown,
    deadlineDocs,
    decisionsAgg,
    positiveUnpaidDocs,
    collectionsThisMonth,
    collectionsLastMonth,
    pipelineByDestAgg,
    destPerfAgg,
    studentsByMonthAgg,
  ] = await Promise.all([
    Student.countDocuments(base),
    Student.find({ ...base, isUrgent: true })
      .select('firstName lastName currentStageName destinationName').lean().limit(12),
    Student.find({ ...base, isFlagged: true })
      .select('firstName lastName currentStageName destinationName flagReason').lean().limit(12),
    Student.find({ ...base, applicationStopped: true })
      .select('firstName lastName currentStageName destinationName').lean().limit(12),
    Student.find({ ...base, contractSigned: false, serviceAmount: { $gt: 0 } })
      .select('firstName lastName currentStageName destinationName').lean().limit(12),

    // Finance split by acceptance status.
    // Only students who received a positive university decision owe the full amount.
    // Pre-acceptance students only owe installment 1, so tracking outstanding against
    // their full serviceAmount overstates what's actually due.
    Student.aggregate([
      { $match: base },
      { $addFields: {
        totalPaidCalc: serviceFeeSum,
        isAccepted: {
          $gt: [{
            $size: { $filter: {
              input: { $ifNull: ['$decisions', []] },
              as: 'd',
              cond: { $and: [
                { $eq: ['$$d.type', 'university_acceptance'] },
                { $eq: ['$$d.outcome', 'positive'] },
              ]},
            }},
          }, 0],
        },
      }},
      { $group: {
        _id:            '$isAccepted',
        totalContract:  { $sum: '$serviceAmount' },
        totalCollected: { $sum: '$totalPaidCalc' },
        count:          { $sum: 1 },
        noPaid:         { $sum: { $cond: [{ $eq: ['$totalPaidCalc', 0] }, 1, 0] } },
      }},
    ]),

    // Pipeline by stage (flat)
    Student.aggregate([
      { $match: base },
      { $group: { _id: '$currentStageName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // New students counts
    Student.countDocuments({ ...base, createdAt: { $gte: thisMonthStart } }),
    Student.countDocuments({ ...base, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),

    // Agent workload
    Student.aggregate([
      { $match: base },
      { $group: {
        _id:    '$assignedTo',
        count:  { $sum: 1 },
        urgent: { $sum: { $cond: ['$isUrgent', 1, 0] } },
      }},
    ]),

    // Upcoming deadlines
    Student.find({
      ...base,
      $or: [
        { vfsAppointmentDate:         { $gte: now, $lte: in14Days } },
        { visaDecisionDeadline:       { $gte: now, $lte: in14Days } },
        { mediationCodeExpiry:        { $gte: now, $lte: in14Days } },
        { enrollmentConfirmationDate: { $gte: now, $lte: in14Days } },
        { passportExpiry:             { $gte: now, $lte: in14Days } },
      ],
    })
      .select('firstName lastName vfsAppointmentDate visaDecisionDeadline mediationCodeExpiry enrollmentConfirmationDate passportExpiry')
      .lean()
      .limit(20),

    // Decision outcomes breakdown
    Student.aggregate([
      { $match: base },
      { $unwind: { path: '$decisions', preserveNullAndEmptyArrays: false } },
      { $group: {
        _id:   { type: '$decisions.type', outcome: '$decisions.outcome' },
        count: { $sum: 1 },
      }},
    ]),

    // Students with positive uni decision but still owe money
    Student.aggregate([
      { $match: {
        ...base,
        decisions:     { $elemMatch: { type: 'university_acceptance', outcome: 'positive' } },
        serviceAmount: { $gt: 0 },
      }},
      { $addFields: { totalPaidCalc: serviceFeeSum } },
      { $addFields: { remainingDebt: { $subtract: ['$serviceAmount', '$totalPaidCalc'] } } },
      { $match: { remainingDebt: { $gt: 0 } } },
      { $project: {
        firstName: 1, lastName: 1,
        currentStageName: 1, destinationName: 1,
        serviceAmount: 1, totalPaidCalc: 1, remainingDebt: 1,
      }},
      { $sort: { remainingDebt: -1 } },
      { $limit: 20 },
    ]),

    // Cash collected this calendar month (all students, not cohort-filtered)
    Student.aggregate([
      { $match: baseAll },
      { $unwind: '$payments' },
      { $match: {
        'payments.date': { $gte: thisMonthStart },
        $expr: { $eq: [{ $toLower: { $trim: { input: { $ifNull: ['$payments.category', ''] } } } }, 'service fee'] },
      }},
      { $group: { _id: null, total: { $sum: '$payments.amount' } } },
    ]),

    // Cash collected last calendar month
    Student.aggregate([
      { $match: baseAll },
      { $unwind: '$payments' },
      { $match: {
        'payments.date': { $gte: lastMonthStart, $lte: lastMonthEnd },
        $expr: { $eq: [{ $toLower: { $trim: { input: { $ifNull: ['$payments.category', ''] } } } }, 'service fee'] },
      }},
      { $group: { _id: null, total: { $sum: '$payments.amount' } } },
    ]),

    // Pipeline by destination: for each destination, list stages + counts
    Student.aggregate([
      { $match: base },
      { $group: {
        _id:   { destination: '$destinationName', stage: '$currentStageName' },
        count: { $sum: 1 },
      }},
      { $group: {
        _id:    '$_id.destination',
        stages: { $push: { stage: '$_id.stage', count: '$count' } },
        total:  { $sum: '$count' },
      }},
      { $sort: { total: -1 } },
    ]),

    // Destination performance
    Student.aggregate([
      { $match: base },
      { $addFields: {
        totalPaidCalc: serviceFeeSum,
        uniPos:  { $cond: [decisionFlag('university_acceptance', 'positive'), 1, 0] },
        uniNeg:  { $cond: [decisionFlag('university_acceptance', 'negative'), 1, 0] },
        visaPos: { $cond: [decisionFlag('visa', 'positive'), 1, 0] },
        visaNeg: { $cond: [decisionFlag('visa', 'negative'), 1, 0] },
      }},
      { $group: {
        _id:         '$destinationName',
        total:       { $sum: 1 },
        collected:   { $sum: '$totalPaidCalc' },
        contract:    { $sum: '$serviceAmount' },
        uniPositive: { $sum: '$uniPos' },
        uniNegative: { $sum: '$uniNeg' },
        visaPositive:{ $sum: '$visaPos' },
        visaNegative:{ $sum: '$visaNeg' },
        urgent:      { $sum: { $cond: ['$isUrgent', 1, 0] } },
        stopped:     { $sum: { $cond: ['$applicationStopped', 1, 0] } },
      }},
      { $sort: { total: -1 } },
    ]),

    // Students per month — last 12 months, NOT period-filtered (always full history)
    Student.aggregate([
      { $match: { isArchived: false, createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  // Resolve agent names
  const agentIds   = agentBreakdown.filter(a => a._id).map(a => a._id);
  const agentUsers = await User.find({ _id: { $in: agentIds } }, 'name').lean();
  const agentMap   = Object.fromEntries(agentUsers.map(u => [String(u._id), u.name]));

  const agents = agentBreakdown
    .map(a => ({
      id:     a._id,
      name:   a._id ? (agentMap[String(a._id)] || 'Unknown') : 'Unassigned',
      count:  a.count,
      urgent: a.urgent,
    }))
    .sort((a, b) => b.count - a.count);

  // Finance — split by acceptance status
  const finMap  = Object.fromEntries(financeSummary.map(g => [String(g._id), g]));
  const accFin  = finMap['true']  || { totalContract: 0, totalCollected: 0, count: 0, noPaid: 0 };
  const pendFin = finMap['false'] || { totalContract: 0, totalCollected: 0, count: 0, noPaid: 0 };

  const totalContract    = accFin.totalContract  + pendFin.totalContract;
  const totalCollected   = accFin.totalCollected + pendFin.totalCollected;
  // Collection rate is only meaningful for accepted students — full payment is expected from them
  const accOutstanding   = accFin.totalContract  - accFin.totalCollected;
  const accCollectionRate = accFin.totalContract > 0
    ? Math.round((accFin.totalCollected / accFin.totalContract) * 100) : null;
  const avgContractValue = total > 0 ? Math.round(totalContract / total) : 0;
  const noPaymentAtAll   = accFin.noPaid + pendFin.noPaid;

  // Monthly collections
  const collectedThisMonth = collectionsThisMonth[0]?.total || 0;
  const collectedLastMonth = collectionsLastMonth[0]?.total || 0;

  // Decisions
  const decMap = {};
  for (const d of decisionsAgg) {
    const k = `${d._id.type}__${d._id.outcome}`;
    decMap[k] = d.count;
  }
  const decisions = {
    university: {
      positive: decMap['university_acceptance__positive'] || 0,
      negative: decMap['university_acceptance__negative'] || 0,
    },
    visa: {
      positive: decMap['visa__positive'] || 0,
      negative: decMap['visa__negative'] || 0,
    },
  };

  // Upcoming deadlines
  const dateFields = [
    { key: 'vfsAppointmentDate',         label: 'VFS Appointment' },
    { key: 'visaDecisionDeadline',       label: 'Visa Deadline' },
    { key: 'mediationCodeExpiry',        label: 'Mediation Expiry' },
    { key: 'enrollmentConfirmationDate', label: 'Enrollment' },
    { key: 'passportExpiry',             label: 'Passport Expiry' },
  ];
  const upcomingDeadlines = [];
  for (const s of deadlineDocs) {
    for (const { key, label } of dateFields) {
      if (s[key]) {
        const d = new Date(s[key]);
        if (d >= now && d <= in14Days) {
          upcomingDeadlines.push({
            studentId: s._id,
            name:      `${s.firstName} ${s.lastName}`,
            label,
            date:      s[key],
            daysLeft:  Math.ceil((d - now) / 86400000),
          });
        }
      }
    }
  }
  upcomingDeadlines.sort((a, b) => a.daysLeft - b.daysLeft);

  // Pipeline by destination — sort stages by count within each destination
  const pipelineByDestination = pipelineByDestAgg.map(d => ({
    destination: d._id || 'Unknown',
    total:       d.total,
    stages:      [...d.stages].sort((a, b) => b.count - a.count),
  }));

  // Destination performance — add computed rates
  const destinationPerf = destPerfAgg.map(d => ({
    name:         d._id || 'Unknown',
    total:        d.total,
    collected:    d.collected,
    contract:     d.contract,
    rate:         d.contract > 0 ? Math.round((d.collected / d.contract) * 100) : 0,
    avgContract:  d.total > 0 ? Math.round(d.contract / d.total) : 0,
    uniPositive:  d.uniPositive,
    uniNegative:  d.uniNegative,
    uniWinRate:   (d.uniPositive + d.uniNegative) > 0
      ? Math.round((d.uniPositive / (d.uniPositive + d.uniNegative)) * 100) : null,
    visaPositive: d.visaPositive,
    visaNegative: d.visaNegative,
    visaWinRate:  (d.visaPositive + d.visaNegative) > 0
      ? Math.round((d.visaPositive / (d.visaPositive + d.visaNegative)) * 100) : null,
    urgent:       d.urgent,
    stopped:      d.stopped,
  }));

  const fmt = s => ({
    _id:         s._id,
    name:        `${s.firstName} ${s.lastName}`,
    stage:       s.currentStageName,
    destination: s.destinationName,
  });

  res.json({
    period:    period || 'all',
    total,
    newThisMonth,
    newLastMonth,
    urgent:     urgentDocs.map(fmt),
    flagged:    flaggedDocs.map(s => ({ ...fmt(s), reason: s.flagReason })),
    stopped:    stoppedDocs.map(fmt),
    noContract: noContractDocs.map(fmt),
    finance: {
      // Overall cash picture
      totalContract,
      totalCollected,
      avgContractValue,
      noPaymentAtAll,
      // Acceptance-gated (accurate): only students where full payment is now due
      accStudents:        accFin.count,
      accContract:        accFin.totalContract,
      accCollected:       accFin.totalCollected,
      accOutstanding,
      accCollectionRate,
      // Pre-acceptance students (installment 1 only expected so far)
      pendStudents:       pendFin.count,
      pendCollected:      pendFin.totalCollected,
      // Monthly cash flow
      collectedThisMonth,
      collectedLastMonth,
    },
    byStage,
    agents,
    upcomingDeadlines,
    decisions,
    positiveUnpaid: positiveUnpaidDocs.map(s => ({
      _id:         s._id,
      name:        `${s.firstName} ${s.lastName}`,
      destination: s.destinationName,
      stage:       s.currentStageName,
      remaining:   s.remainingDebt,
      paid:        s.totalPaidCalc,
      contract:    s.serviceAmount,
    })),
    pipelineByDestination,
    destinationPerf,
    studentsByMonth: studentsByMonthAgg.map(m => ({
      year:  m._id.year,
      month: m._id.month,
      count: m.count,
    })),
  });
};

exports.setDecision = async (req, res) => {
  const { type, outcome, notes } = req.body;
  if (!['university_acceptance', 'visa'].includes(type))
    return res.status(400).json({ message: 'Invalid decision type' });
  if (!['positive', 'negative'].includes(outcome))
    return res.status(400).json({ message: 'Invalid outcome' });

  const query = { _id: req.params.id };
  if (req.user.role === 'dc_agent') query.assignedTo = req.user._id;

  const student = await Student.findOne(query);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Replace existing decision of same type
  student.decisions = (student.decisions || []).filter(d => d.type !== type);
  student.decisions.push({ type, outcome, notes: notes || '', decidedByName: req.user.name });

  if (type === 'university_acceptance') {
    student.applicationStopped = outcome === 'negative';
  }

  logActivity(
    student,
    `${type === 'university_acceptance' ? 'University' : 'Visa'} decision recorded: ${outcome}`,
    req.user,
    notes || ''
  );

  await student.save();

  // Send notification to student using configured message
  const settings = await AppSettings.findOne({ key: 'global' }).lean();
  const msgKey = `${type === 'university_acceptance' ? 'uni' : 'visa'}_${outcome}`;
  const msgConfig = settings?.decisionMessages?.[msgKey];

  if (msgConfig?.message) {
    await StudentNotification.create({
      student: student._id,
      title:   msgConfig.title || (outcome === 'positive' ? 'Good news!' : 'Application update'),
      message: msgConfig.message,
      sentBy:     req.user._id,
      sentByName: req.user.name,
    });
  }

  res.json(student);
};

exports.toggleOpenStage = async (req, res) => {
  const query = { _id: req.params.id };
  if (req.user.role === 'dc_agent') query.assignedTo = req.user._id;

  const student = await Student.findOne(query);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const stageId = req.params.stageId;
  const idx = student.openStages.findIndex(s => String(s.stageId) === stageId);

  if (idx !== -1) {
    student.openStages.splice(idx, 1);
  } else {
    if (student.openStages.length >= 2) {
      return res.status(400).json({ message: 'Maximum 2 stages can be open at the same time' });
    }
    student.openStages.push({ stageId, openedByName: req.user.name });
  }

  await student.save();
  res.json({ openStages: student.openStages });
};
