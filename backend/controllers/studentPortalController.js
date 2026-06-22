const Student = require('../models/Student');
const StudentNotification = require('../models/StudentNotification');
const StudentAccount = require('../models/StudentAccount');
const ReferralSettings = require('../models/ReferralSettings');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTopic = require('../models/InterviewTopic');
const InterviewResource = require('../models/InterviewResource');
const InterviewVideo = require('../models/InterviewVideo');
const InterviewMistake = require('../models/InterviewMistake');
const FAQ = require('../models/FAQ');
const KBArticle = require('../models/KBArticle');
const Announcement = require('../models/Announcement');
const OnboardingSlide = require('../models/OnboardingSlide');
const UsefulLink      = require('../models/UsefulLink');
const AppSettings = require('../models/AppSettings');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { evaluateVisibility } = require('../utils/visibility');
const { isPhase2Active, isDocTriggerReached } = require('../utils/phaseUtils');

exports.getMe = async (req, res) => {
  const student = await Student.findById(req.student._id)
    .select('firstName lastName phone destinationName currentStageName currentStageId destination assignedTo')
    .populate('destination', 'name code flag')
    .populate('assignedTo', 'name phone')
    .lean();
  res.json({ ...student, onboardingCompleted: req.studentAccount?.onboardingCompleted ?? false });
};

exports.completeOnboarding = async (req, res) => {
  await req.studentAccount.constructor.findByIdAndUpdate(
    req.studentAccount._id,
    { onboardingCompleted: true }
  );
  res.json({ success: true });
};

exports.getProgress = async (req, res) => {
  const [student, settingsDoc] = await Promise.all([
    Student.findById(req.student._id).populate('destination', 'pipelineStages name'),
    AppSettings.findOne({ key: 'global' }).lean(),
  ]);

  const stages = (student.destination?.pipelineStages || [])
    .sort((a, b) => a.order - b.order);

  const currentIndex = stages.findIndex(
    s => String(s._id) === String(student.currentStageId)
  );

  // Check and clear celebration flag
  const account = req.studentAccount;
  let celebration = false;
  if (account.celebrationPending) {
    celebration = true;
    account.celebrationPending = false;
    await account.save();
  }

  const currentStage = currentIndex >= 0 ? stages[currentIndex] : null;

  // Build student-facing checklist for current stage
  let studentChecklist = [];
  if (currentStage) {
    studentChecklist = currentStage.checklist
      .filter(item => item.studentFacing)
      .map(item => {
        const completion = student.checklistCompletions.find(
          c => String(c.itemId) === String(item._id)
        );
        return {
          _id: item._id,
          label: item.studentLabel || item.label,
          completed: completion?.completed || false,
          completedAt: completion?.completedAt,
        };
      });
  }

  // Calculate estimated remaining days (incomplete stages)
  const estimatedRemaining = stages
    .slice(currentIndex >= 0 ? currentIndex : stages.length)
    .reduce((sum, s) => sum + (s.estimatedDays || 0), 0);

  // Build stage data with rich student fields
  const openStageIds = new Set((student.openStages || []).map(s => String(s.stageId)));

  const progressData = stages.map((stage, index) => {
    const historyEntry = student.stageHistory?.find(
      h => String(h.stageId) === String(stage._id)
    );
    let status = 'upcoming';
    if (index < currentIndex) status = 'completed';
    if (index === currentIndex) status = 'current';

    if (status === 'upcoming' && (stage.alwaysOpen || openStageIds.has(String(stage._id)))) {
      status = 'parallel';
    }

    let stageChecklist = [];
    if (status === 'parallel') {
      stageChecklist = (stage.checklist || []).map(item => {
        const completion = student.checklistCompletions.find(
          c => String(c.itemId) === String(item._id)
        );
        return {
          _id: item._id,
          label: item.studentLabel || item.label,
          completed: completion?.completed || false,
          completedAt: completion?.completedAt,
        };
      });
    }

    return {
      _id: stage._id,
      name: stage.name,
      description: stage.description,
      color: stage.color,
      order: stage.order,
      estimatedDays: stage.estimatedDays || null,
      studentDescription: stage.studentDescription || '',
      studentWaitingFor: stage.studentWaitingFor || '',
      studentActionRequired: stage.studentActionRequired || '',
      studentTips: stage.studentTips || [],
      status,
      stageChecklist,
      category: stage.category,
      enteredAt: historyEntry?.enteredAt,
      exitedAt: historyEntry?.exitedAt,
    };
  });

  // Only show stages from the same category as the current stage
  // (e.g. hide visa stages when student is still in uni_acceptance phase)
  const currentCategory = currentStage?.category || null;
  const visibleStages = currentCategory
    ? progressData.filter(s => (s.category || 'uni_acceptance') === currentCategory)
    : progressData;

  const visibleCurrentIndex = visibleStages.findIndex(
    s => String(s._id) === String(student.currentStageId)
  );

  const visibleEstimatedRemaining = visibleStages
    .slice(visibleCurrentIndex >= 0 ? visibleCurrentIndex : visibleStages.length)
    .reduce((sum, s) => sum + (s.estimatedDays || 0), 0);

  res.json({
    stages: visibleStages,
    currentStageId: student.currentStageId,
    currentStageName: student.currentStageName,
    currentStageDescription: currentStage?.description || '',
    currentIndex: visibleCurrentIndex,
    totalStages: visibleStages.length,
    progressPercent: visibleStages.length > 0
      ? Math.round(((visibleCurrentIndex + 1) / visibleStages.length) * 100)
      : 0,
    estimatedDays: currentStage?.estimatedDays || null,
    estimatedRemaining: visibleEstimatedRemaining,
    studentChecklist,
    celebration,
    destinationName: student.destination?.name || '',
    startedAt: student.stageHistory?.[0]?.enteredAt || null,
    decisions:          student.decisions          || [],
    applicationStopped: student.applicationStopped || false,
    decisionMessages:   settingsDoc?.decisionMessages || {},
  });
};

exports.getPayments = async (req, res) => {
  const student = req.student;
  const serviceFeePayments = student.payments.filter(
    p => (p.category || '').toLowerCase().trim() === 'service fee'
  );
  const totalPaid = serviceFeePayments.reduce((sum, p) => sum + p.amount, 0);
  // Strip internal fields (recordedBy, recordedByName) before sending to student
  const safePayments = [...student.payments]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(({ amount, date, method, category, notes }) => ({ amount, date, method, category, notes }));
  res.json({
    serviceAmount: student.serviceAmount,
    totalPaid,
    remaining: student.serviceAmount - totalPaid,
    payments: safePayments,
  });
};

exports.getDeadlines = async (req, res) => {
  const student = req.student;
  const raw = [
    { id: 'vfs', title: 'VFS Appointment', date: student.vfsAppointmentDate },
    { id: 'visa', title: 'Visa Decision Deadline', date: student.visaDecisionDeadline },
    { id: 'mediation', title: 'Mediation Code Expiry', date: student.mediationCodeExpiry },
    { id: 'enrollment', title: 'Enrollment Confirmation', date: student.enrollmentConfirmationDate },
  ].filter(d => d.date);

  const now = new Date();
  const withUrgency = raw.map(d => {
    const daysLeft = Math.ceil((new Date(d.date) - now) / 86400000);
    let urgency = 'normal';
    if (daysLeft < 0) urgency = 'overdue';
    else if (daysLeft === 0) urgency = 'today';
    else if (daysLeft <= 3) urgency = 'critical';
    else if (daysLeft <= 7) urgency = 'warning';
    else if (daysLeft <= 14) urgency = 'soon';
    return { ...d, daysLeft, urgency };
  });

  res.json({
    upcoming: withUrgency.filter(d => d.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft),
    past: withUrgency.filter(d => d.daysLeft < 0).sort((a, b) => new Date(b.date) - new Date(a.date)),
  });
};

exports.getNotifications = async (req, res) => {
  const notifications = await StudentNotification.find({ student: req.student._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(notifications);
};

exports.markRead = async (req, res) => {
  await StudentNotification.findOneAndUpdate(
    { _id: req.params.id, student: req.student._id },
    { isRead: true }
  );
  res.json({ message: 'Marked as read' });
};

exports.markAllRead = async (req, res) => {
  await StudentNotification.updateMany(
    { student: req.student._id, isRead: false },
    { isRead: true }
  );
  res.json({ message: 'All marked as read' });
};

exports.getUnreadCount = async (req, res) => {
  const count = await StudentNotification.countDocuments({
    student: req.student._id,
    isRead: false,
  });
  res.json({ count });
};

exports.checkInterviewPrep = async (req, res) => {
  const student = await Student.findById(req.student._id).select('destination').lean();
  const available = !!(await InterviewQuestion.exists({ destination: student?.destination, active: true }));
  res.json({ available });
};

exports.getInterviewQuestions = async (req, res) => {
  const student = await Student.findById(req.student._id).select('destination');
  if (!student?.destination) return res.json({});

  const questions = await InterviewQuestion.find({
    destination: student.destination,
    active: true,
  }).sort({ topic: 1, order: 1, createdAt: 1 });

  const grouped = {};
  for (const q of questions) {
    if (!grouped[q.topic]) grouped[q.topic] = [];
    grouped[q.topic].push({ _id: q._id, question: q.question, answerTip: q.answerTip, topic: q.topic });
  }

  res.json(grouped);
};

exports.getStudentArticles = async (req, res) => {
  const student = await Student.findById(req.student._id).select('destination');

  const filter = { status: 'published', studentFacing: true };
  if (student?.destination) filter.destinationRef = student.destination;
  if (req.query.articleType) filter.articleType = req.query.articleType;

  const articles = await KBArticle.find(filter)
    .select('title articleType overview steps faqs linkedStage destinationName updatedAt')
    .sort({ updatedAt: -1 });

  const grouped = {};
  for (const a of articles) {
    const key = a.articleType || 'other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  }

  res.json(grouped);
};

// Unified content endpoint — all student-facing content with lock evaluation
exports.getContent = async (req, res) => {
  const student = await Student.findById(req.student._id)
    .populate('destination', 'pipelineStages name interviewUniversity interviewVisa');

  const stages = (student.destination?.pipelineStages || []).sort((a, b) => a.order - b.order);
  const currentIndex = stages.findIndex(s => String(s._id) === String(student.currentStageId));
  const destId = student.destination?._id;
  const studentUniId = student.university ? student.university.toString() : null;

  if (!destId) return res.json({ guides: [], studentGuides: [], checklists: [], interviewTopics: [], tips: [], interviewVideos: [], interviewMistakes: [], faqs: {}, interviewUniversity: false, interviewVisa: false });

  // Fetch all student-facing published KB articles for this destination
  const articles = await KBArticle.find({
    status: 'published',
    studentFacing: true,
    destinationRef: destId,
  }).select('title articleType guideCategory overview steps faqs linkedStage visibilityRule updatedAt');

  // Fetch InterviewTopics
  const topics = await InterviewTopic.find({ destination: destId, active: true }).sort({ order: 1, createdAt: 1 });

  // Fetch questions and resources assigned to topics
  const topicIds = topics.map(t => t._id);
  const topicQuestions = topicIds.length
    ? await InterviewQuestion.find({ destination: destId, active: true, topicId: { $in: topicIds } })
        .sort({ order: 1, createdAt: 1 })
    : [];
  const topicResources = topicIds.length
    ? await InterviewResource.find({ destination: destId, active: true, topicId: { $in: topicIds } })
        .sort({ order: 1, createdAt: 1 })
    : [];

  // Section-level resources (not attached to any specific topic)
  const allSectionResources = await InterviewResource.find({ destination: destId, active: true, topicId: null })
    .sort({ order: 1, createdAt: 1 });

  // Fetch legacy questions (no topicId)
  const legacyQuestions = await InterviewQuestion.find({
    destination: destId,
    active: true,
    topicId: null,
  }).sort({ topic: 1, order: 1, createdAt: 1 });

  // Fetch videos, mistakes, and FAQs
  const [rawVideos, rawMistakes, rawFaqs] = await Promise.all([
    InterviewVideo.find({ destination: destId, active: true }).sort({ order: 1, createdAt: 1 }),
    InterviewMistake.find({ destination: destId, active: true }).sort({ order: 1, createdAt: 1 }),
    FAQ.find({ active: true, $or: [{ destination: destId }, { destination: null }] }).sort({ topic: 1, order: 1, createdAt: 1 }),
  ]);

  // Process KB articles
  const guides = [], checklists = [], tips = [], studentGuides = [];
  for (const a of articles) {
    const vis = evaluateVisibility(a.visibilityRule, stages, currentIndex);
    const item = {
      _id: a._id,
      title: a.title,
      articleType: a.articleType,
      guideCategory: a.guideCategory || '',
      locked: vis.locked,
      lockedReason: vis.lockedReason || null,
    };
    if (!vis.locked) {
      item.overview = a.overview;
      item.steps = a.steps;
      item.faqs = a.faqs;
    }
    const t = a.articleType;
    if (t === 'visa_checklist' || t === 'after_arrival') checklists.push(item);
    else if (t === 'student_tip') tips.push(item);
    else if (t === 'guide') studentGuides.push(item);
    else guides.push(item);
  }

  // Process videos
  const interviewVideos = rawVideos.map(v => {
    const vis = evaluateVisibility(v.visibilityRule, stages, currentIndex);
    return {
      _id: v._id,
      title: v.title,
      description: v.description,
      url: v.url,
      platform: v.platform,
      locked: vis.locked,
      lockedReason: vis.lockedReason || null,
    };
  });

  // Process mistakes
  const interviewMistakes = rawMistakes.map(m => {
    const vis = evaluateVisibility(m.visibilityRule, stages, currentIndex);
    const item = {
      _id: m._id,
      title: m.title,
      locked: vis.locked,
      lockedReason: vis.lockedReason || null,
    };
    if (!vis.locked) {
      item.explanation = m.explanation;
      item.tip = m.tip;
    }
    return item;
  });

  // Process FAQs — group by topic with lock per item
  const faqGrouped = {};
  for (const f of rawFaqs) {
    const vis = evaluateVisibility(f.visibilityRule, stages, currentIndex);
    const item = {
      _id: f._id,
      question: f.question,
      locked: vis.locked,
      lockedReason: vis.lockedReason || null,
    };
    if (!vis.locked) item.answer = f.answer;
    if (!faqGrouped[f.topic]) faqGrouped[f.topic] = [];
    faqGrouped[f.topic].push(item);
  }

  // Process structured topics — filter university-specific topics to the student's uni
  const interviewTopics = topics
    .filter(t => !t.universityId || !studentUniId || String(t.universityId) === studentUniId)
    .map(topic => {
      const vis = evaluateVisibility(topic.visibilityRule, stages, currentIndex);
      const tId = String(topic._id);

      const questions = topicQuestions
        .filter(q => String(q.topicId) === tId)
        .filter(q => !q.universityId || !studentUniId || String(q.universityId) === studentUniId)
        .map(q => ({ _id: q._id, question: q.question, answerTip: q.answerTip }));

      const resources = topicResources
        .filter(r => String(r.topicId) === tId)
        .filter(r => !r.universityId || !studentUniId || String(r.universityId) === studentUniId)
        .map(r => ({ _id: r._id, title: r.title, resourceType: r.resourceType, url: r.url, description: r.description }));

      const item = {
        _id: topic._id,
        name: topic.name,
        description: topic.description,
        interviewType: topic.interviewType || 'university',
        locked: vis.locked,
        lockedReason: vis.lockedReason || null,
        questionCount: questions.length,
        resourceCount: resources.length,
      };
      if (!vis.locked) {
        item.questions = questions;
        item.resources = resources;
      }
      return item;
    });

  // Add legacy questions (no topicId) as always-unlocked implicit university topics
  const legacyByTopic = {};
  for (const q of legacyQuestions) {
    if (!legacyByTopic[q.topic]) legacyByTopic[q.topic] = [];
    legacyByTopic[q.topic].push({ _id: q._id, question: q.question, answerTip: q.answerTip });
  }
  for (const [name, qs] of Object.entries(legacyByTopic)) {
    interviewTopics.push({
      _id: `legacy_${name}`,
      name,
      description: '',
      interviewType: 'university',
      locked: false,
      lockedReason: null,
      questionCount: qs.length,
      resourceCount: 0,
      questions: qs,
      resources: [],
    });
  }

  const sectionResources = allSectionResources
    .filter(r => !r.universityId || !studentUniId || String(r.universityId) === studentUniId)
    .map(r => ({ _id: r._id, title: r.title, resourceType: r.resourceType, url: r.url, description: r.description, interviewType: r.interviewType }));

  res.json({
    guides,
    studentGuides,
    checklists,
    interviewTopics,
    sectionResources,
    tips,
    interviewVideos,
    interviewMistakes,
    faqs: faqGrouped,
    interviewUniversity: !!student.destination?.interviewUniversity,
    interviewVisa: !!student.destination?.interviewVisa,
  });
};

exports.getAnnouncements = async (req, res) => {
  const studentId = req.student._id;
  const announcements = await Announcement.find({
    status: 'sent',
    sentToStudents: studentId,
  })
    .sort({ sentAt: -1 })
    .select('title message type sentAt readBy')
    .lean();

  res.json(announcements.map(a => ({
    _id: a._id,
    title: a.title,
    message: a.message,
    type: a.type,
    sentAt: a.sentAt,
    isRead: (a.readBy || []).some(id => String(id) === String(studentId)),
  })));
};

exports.markAnnouncementRead = async (req, res) => {
  const studentId = req.student._id;
  // Only mark announcements that were actually sent to this student (IDOR prevention)
  await Announcement.findOneAndUpdate(
    { _id: req.params.id, sentToStudents: studentId },
    { $addToSet: { readBy: studentId } }
  );
  res.json({ message: 'Marked as read' });
};

exports.getDocuments = async (req, res) => {
  const [student, settingsDoc] = await Promise.all([
    Student.findById(req.student._id).populate('destination', 'pipelineStages documentDefinitions name'),
    AppSettings.findOne({ key: 'global' }).lean(),
  ]);
  if (!student) return res.status(404).json({ message: 'Not found' });

  const docStatuses = settingsDoc?.documentStatuses || [];
  const readyKeys = docStatuses.filter(s => s.isReady).map(s => s.key);
  const isReadyStatus = (st) => readyKeys.length
    ? readyKeys.includes(st)
    : st === 'ready' || st === 'approved';

  const dest = student.destination;
  const stages = (dest?.pipelineStages || []).sort((a, b) => a.order - b.order);

  // Determine the active phase from the student's current pipeline stage category
  const currentStage = stages.find(s => String(s._id) === String(student.currentStageId));
  const currentCategory = currentStage?.category || 'uni_acceptance';
  const activePhase = currentCategory === 'visa' ? 'visa_process' : 'university_acceptance';
  const phaseLabel = activePhase === 'visa_process' ? 'Visa Process' : 'University Acceptance';

  // Status lookup from student's saved entries
  const statusMap = {};
  for (const doc of (student.documents || [])) {
    statusMap[String(doc.documentDefId)] = doc;
  }

  // Source of truth: definitions — filter to active phase + triggerStage check
  const activeDefs = (dest?.documentDefinitions || [])
    .filter(def => {
      if ((def.phase || 'university_acceptance') !== activePhase) return false;
      return isDocTriggerReached(def.triggerStage, student, dest);
    });

  const documents = activeDefs.map(def => {
    const entry = statusMap[String(def._id)];
    return {
      documentDefId: def._id,
      name: def.name,
      status:       entry?.status || 'not_requested',
      agentNotes:   entry?.notes  || '',
      phase:        def.phase     || 'university_acceptance',
      requirements: def.requirements || [],
      steps:        def.steps        || [],
      defNotes:     def.notes        || '',
    };
  });

  const ready = documents.filter(d => isReadyStatus(d.status)).length;

  res.json({
    documents,
    activePhase,
    phaseLabel,
    progress: { ready, total: documents.length },
    documentStatuses: docStatuses,
  });
};

exports.getReferral = async (req, res) => {
  const [student, settings] = await Promise.all([
    Student.findById(req.student._id).select('referralCode').lean(),
    ReferralSettings.findOne({ key: 'global' }).lean(),
  ]);

  const s = settings || {};
  const active = s.active !== false;

  if (!active) return res.json({ active: false });

  res.json({
    referralCode: student?.referralCode || null,
    settings: {
      active:            true,
      referrerDiscount:  s.referrerDiscount  ?? 5000,
      referredDiscount:  s.referredDiscount  ?? 5000,
      discountAppliesTo: s.discountAppliesTo ?? 'second installment',
      rulesText:         s.rulesText         ?? '',
      howToUseText:      s.howToUseText      ?? '',
      popupTitle:        s.popupTitle        ?? 'Share & Save Together 🎁',
      popupMessage:      s.popupMessage      ?? 'Share your referral code with friends and you both get 5,000 DA off your second installment!',
    },
  });
};

exports.getOnboardingSlides = async (req, res) => {
  const student = await Student.findById(req.student._id).select('destination').lean();
  const destId = student?.destination;

  const slides = await OnboardingSlide.find({
    isActive: true,
    $or: [
      { destinations: { $size: 0 } },
      ...(destId ? [{ destinations: destId }] : []),
    ],
  }).sort({ order: 1, createdAt: 1 }).lean();

  res.json(slides);
};

exports.getUsefulLinks = async (req, res) => {
  const student = await Student.findById(req.student._id).select('destination university').lean();
  const destId = student?.destination;
  const uniId  = student?.university;

  const links = await UsefulLink.find({
    isActive: true,
    $and: [
      {
        $or: [
          { destinations: { $exists: false } },
          { destinations: { $size: 0 } },
          ...(destId ? [{ destinations: destId }] : []),
        ],
      },
      {
        $or: [
          { universities: { $exists: false } },
          { universities: { $size: 0 } },
          ...(uniId ? [{ universities: uniId }] : []),
        ],
      },
    ],
  }).sort({ order: 1, createdAt: 1 }).lean();

  res.json(links);
};

exports.checkDevice = async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 64)
    return res.status(400).json({ message: 'Invalid device ID' });

  const account = req.studentAccount;

  // First time this device is seen — register it silently
  if (!account.knownDeviceIds?.length) {
    await account.constructor.findByIdAndUpdate(account._id, {
      $addToSet: { knownDeviceIds: deviceId },
    });
    return res.json({ ok: true, known: true });
  }

  // Known device — no action needed
  if (account.knownDeviceIds.includes(deviceId)) {
    return res.json({ ok: true, known: true });
  }

  // Unknown device — register it then notify founder + DC agent
  await account.constructor.findByIdAndUpdate(account._id, {
    $addToSet: { knownDeviceIds: deviceId },
  });

  const student = await Student.findById(req.student._id)
    .select('firstName lastName assignedTo').lean();
  if (!student) return res.json({ ok: true, known: false });

  const name    = `${student.firstName} ${student.lastName}`;
  const title   = `⚠️ New device detected — ${name}`;
  const message = `${name} opened the student app on a new device. This may indicate account sharing. Check with the student if this is expected.`;

  const founders = await User.find({ role: 'founder', isActive: true }, '_id').lean();
  const recipients = founders.map(f => f._id);
  if (student.assignedTo) recipients.push(student.assignedTo);

  await Notification.insertMany(recipients.map(uid => ({
    recipient:   uid,
    student:     student._id,
    studentName: name,
    type:        'custom',
    title,
    message,
  })));

  await Student.findByIdAndUpdate(req.student._id, {
    $push: { activityLog: {
      action:          'New device detected',
      performedByName: 'Student App',
      details:         `Unrecognised device ID: ${deviceId.slice(0, 8)}…`,
      createdAt:       new Date(),
    }},
  });

  res.json({ ok: true, known: false });
};
