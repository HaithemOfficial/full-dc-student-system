const Student = require('../models/Student');
const Destination = require('../models/Destination');
const Notification = require('../models/Notification');
const User = require('../models/User');
const StudentAccount = require('../models/StudentAccount');
const { generateStudentPassword } = require('../utils/studentPassword');
const { buildNotification } = require('../utils/notificationUtils');

exports.submitHandoff = async (req, res) => {
  const {
    firstName, lastName, phone, email, whatsapp,
    destinationId, universityPreference, program, bacGrade,
    languageLevel, serviceAmount, paymentAmount, paymentMethod,
    assignedTo, notes,
  } = req.body;

  const dest = await Destination.findById(destinationId);
  if (!dest) return res.status(400).json({ message: 'Destination not found' });

  const assignedUser = await User.findById(assignedTo);
  if (!assignedUser) return res.status(400).json({ message: 'DC Agent not found' });

  const documents = dest.documentDefinitions.map(d => ({
    documentDefId: d._id,
    name: d.name,
    status: 'not_requested',
    history: [],
  }));

  const firstStage = dest.pipelineStages.sort((a, b) => a.order - b.order)[0];
  const checklistCompletions = firstStage
    ? firstStage.checklist.map(item => ({ itemId: item._id, label: item.label, completed: false }))
    : [];

  const student = await Student.create({
    firstName, lastName, phone, email, whatsapp,
    destination: destinationId,
    destinationName: dest.name,
    universityName: universityPreference,
    program,
    bacGrade,
    languageLevel,
    serviceAmount: serviceAmount || 0,
    assignedTo,
    assignedToName: assignedUser.name,
    documents,
    currentStageId: firstStage?._id,
    currentStageName: firstStage?.name,
    checklistCompletions,
    stageHistory: firstStage
      ? [{ stageId: firstStage._id, stageName: firstStage.name }]
      : [],
    source: 'handoff',
    notes,
    payments: paymentAmount
      ? [{ amount: paymentAmount, date: new Date(), method: paymentMethod || 'cash', notes: 'Initial payment at handoff' }]
      : [],
    activityLog: [{ action: 'Case created via handoff form', performedByName: 'Sales Team' }],
  });

  const handoffNotif = await buildNotification('handoff', {
    firstName, lastName, destinationName: dest.name,
  });
  if (handoffNotif) {
    await Notification.create({
      recipient: assignedTo,
      student: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      type: 'handoff',
      ...handoffNotif,
    });
  }

  // Auto-create student app account
  const generatedPassword = generateStudentPassword(student.firstName, student.phone);
  await StudentAccount.create({
    student: student._id,
    phone: student.phone || student.whatsapp || '',
    password: generatedPassword,
  });

  res.status(201).json({ message: 'Handoff successful', student, generatedPassword });
};
