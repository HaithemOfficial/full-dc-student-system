require('dotenv').config();
const validateEnv = require('./utils/validateEnv');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { global: globalLimiter } = require('./middleware/rateLimiter');
const connectDB = require('./config/db');

const app = express();

connectDB().then(async () => {
  // Seed default payment category
  try {
    const PaymentCategory = require('./models/PaymentCategory');
    const exists = await PaymentCategory.findOne({ name: /^service fee$/i });
    if (!exists) await PaymentCategory.create({ name: 'Service Fee', color: 'green' });
  } catch (e) { logger.warn('Could not seed default payment category: ' + e.message); }

  // Ensure default onboarding slides exist (upsert by title — safe to run every restart)
  try {
    const OnboardingSlide = require('./models/OnboardingSlide');
    const defaults = [
      { emoji: '✨', title: 'Welcome, {firstName}!',  body: 'Your El Nadjah dashboard is ready. Everything you need for your study-abroad journey is right here.',             order: 0 },
      { emoji: '📍', title: 'Track your journey',     body: "You're applying to {destinationName}. Follow your current stage and see exactly where you stand.",                order: 1 },
      { emoji: '📄', title: 'Documents & updates',    body: "Your agent keeps your document statuses up to date. You'll always know what's needed and what's approved.",       order: 2 },
      { emoji: '🤝', title: 'Your agent',             body: 'Your dedicated agent is here to guide you every step of the way. You can reach them from your home screen anytime.', order: 3 },
    ];
    let added = 0;
    for (const d of defaults) {
      const exists = await OnboardingSlide.findOne({ title: d.title });
      if (!exists) { await OnboardingSlide.create({ ...d, destinations: [], isActive: true }); added++; }
    }
    if (added > 0) logger.info(`Added ${added} missing default onboarding slide(s)`);
  } catch (e) { logger.warn('Could not seed onboarding slides: ' + e.message); }

  // Seed default document statuses if none configured
  try {
    const AppSettings = require('./models/AppSettings');
    const DEFAULT_DOC_STATUSES = [
      { key: 'not_requested',        dcLabel: 'Not Requested',        studentLabel: 'Pending',       color: 'gray',    isReady: false },
      { key: 'requested',            dcLabel: 'Requested',            studentLabel: 'Requested',     color: 'blue',    isReady: false },
      { key: 'received',             dcLabel: 'Received',             studentLabel: 'Received',      color: 'indigo',  isReady: false },
      { key: 'under_review',         dcLabel: 'Under Review',         studentLabel: 'Under Review',  color: 'yellow',  isReady: false },
      { key: 'approved',             dcLabel: 'Approved',             studentLabel: 'Approved',      color: 'green',   isReady: false },
      { key: 'sent_for_translation', dcLabel: 'Sent for Translation', studentLabel: 'In Progress',   color: 'purple',  isReady: false },
      { key: 'translated',           dcLabel: 'Translated',           studentLabel: 'In Progress',   color: 'purple',  isReady: false },
      { key: 'sent_for_legalization',dcLabel: 'Sent for Legalization',studentLabel: 'In Progress',   color: 'orange',  isReady: false },
      { key: 'legalized',            dcLabel: 'Legalized',            studentLabel: 'In Progress',   color: 'lime',    isReady: false },
      { key: 'ready',                dcLabel: 'Ready',                studentLabel: 'Ready ✓',       color: 'emerald', isReady: true  },
    ];
    const ds = await AppSettings.findOne({ key: 'global' });
    if (!ds?.documentStatuses?.length) {
      await AppSettings.findOneAndUpdate(
        { key: 'global' },
        { $set: { documentStatuses: DEFAULT_DOC_STATUSES } },
        { upsert: true }
      );
      logger.info('Seeded default document statuses');
    }
  } catch (e) { logger.warn('Could not seed document statuses: ' + e.message); }

  // Seed default decision popup messages if not yet set
  try {
    const AppSettings = require('./models/AppSettings');
    const s = await AppSettings.findOne({ key: 'global' });
    if (!s?.decisionMessages?.uni_positive?.message) {
      await AppSettings.findOneAndUpdate(
        { key: 'global' },
        { $set: { decisionMessages: {
          uni_positive: {
            title:   '🎉 University Acceptance!',
            message: 'Congratulations! You have been accepted to your chosen university. Your agent will contact you shortly with the next steps.',
          },
          uni_negative: {
            title:   'University Decision Update',
            message: 'Unfortunately, your university application did not result in an acceptance at this time. Please contact your agent to discuss your options and possible next steps.',
          },
          visa_positive: {
            title:   '✅ Visa Approved!',
            message: 'Great news — your visa application has been approved! Your agent will reach out to help you prepare for your departure.',
          },
          visa_negative: {
            title:   'Visa Application Update',
            message: 'We regret to inform you that your visa application was not successful at this time. Your agent will contact you to review the situation and explore next steps.',
          },
        }}},
        { upsert: true }
      );
      logger.info('Seeded default decision popup messages');
    }
  } catch (e) { logger.warn('Could not seed decision messages: ' + e.message); }

  // Seed default disclaimer text if not yet set
  try {
    const AppSettings = require('./models/AppSettings');
    const DEFAULT_DISCLAIMER = `El Nadjah Agency provides consultancy and application assistance services for students seeking to study abroad. By using this application, you acknowledge and agree to the following terms.

SERVICE SCOPE
El Nadjah Agency acts as an intermediary to assist you in preparing and submitting your application to universities and relevant authorities. We do not represent any university, embassy, or government body.

NO GUARANTEE OF OUTCOME
Acceptance and visa decisions are made exclusively by universities and visa authorities. El Nadjah Agency cannot guarantee admission, visa approval, or any specific outcome, and shall not be held liable for rejection or delays caused by third parties.

ACCURACY OF INFORMATION
You are responsible for providing accurate, complete, and truthful information and documents. El Nadjah Agency is not liable for consequences arising from incorrect or incomplete information submitted on your behalf.

PAYMENT & REFUND POLICY
Service fees are governed by the agreement signed between you and El Nadjah Agency. Fees may be non-refundable once the application process has commenced. Please refer to your signed contract for full payment and refund terms.

PRIVACY & DATA
Your personal information is collected solely for the purpose of managing your study-abroad application. It will not be shared with third parties without your consent, except as required by universities, visa authorities, or applicable law.

APP CONTENT
Information displayed in this application is updated regularly but may not always reflect real-time changes from universities or government agencies. Always confirm critical deadlines and requirements directly with the relevant institution.

LIMITATION OF LIABILITY
El Nadjah Agency's liability is limited to the service fees paid. We are not responsible for any indirect, incidental, or consequential damages arising from the use of this application or our services.

CONTACT
For questions or concerns regarding these terms, please contact your assigned agent or reach out to us directly through the app.`;

    const s = await AppSettings.findOne({ key: 'global' });
    if (!s?.disclaimer?.body) {
      await AppSettings.findOneAndUpdate(
        { key: 'global' },
        { $set: { 'disclaimer.title': 'Terms & Disclaimer', 'disclaimer.body': DEFAULT_DISCLAIMER } },
        { upsert: true }
      );
    }
  } catch (e) { logger.warn('Could not seed default disclaimer: ' + e.message); }

  // Migrate Reminders → Tasks (idempotent: skips already-migrated records)
  try {
    const Reminder = require('./models/Reminder');
    const Task     = require('./models/Task');
    const reminders = await Reminder.find({});
    let migrated = 0;
    for (const r of reminders) {
      const exists = await Task.findOne({ reminderId: r._id });
      if (exists) continue;
      await Task.create({
        title:              r.title,
        type:               r.type || 'custom',
        priority:           'normal',
        dueDate:            r.reminderAt,
        hasTime:            true,
        notifyBefore:       r.notifyBefore || 0,
        notificationSent:   r.notificationSent || false,
        linkedStudent:      r.student     || undefined,
        linkedStudentName:  r.studentName || '',
        stageName:          r.stageName   || '',
        checklistItemLabel: r.checklistItemLabel || '',
        notes:              r.notes || '',
        status:             r.isDone ? 'done' : 'pending',
        assignedTo:         r.createdBy,
        assignedToName:     r.createdByName || '',
        createdBy:          r.createdBy,
        createdByName:      r.createdByName || '',
        reminderId:         r._id,
      });
      migrated++;
    }
    if (migrated > 0) logger.info(`Migrated ${migrated} reminder(s) → tasks`);
  } catch (e) { logger.warn('Reminder migration failed: ' + e.message); }
});

const { startAnnouncementScheduler } = require('./jobs/announcementScheduler');
startAnnouncementScheduler();

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'"],
      fontSrc:     ["'self'"],
      objectSrc:   ["'none'"],
      frameSrc:    ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
}));

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.STUDENT_APP_URL,
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174']
    : []),
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    logger.warn(`CORS blocked origin: ${origin}`);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing + size limits ───────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// ── NoSQL injection prevention ───────────────────────────────────────────────
app.use(mongoSanitize());

// ── Global rate limiter ──────────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ── Request logging ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
}

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',                     require('./routes/auth'));
app.use('/api/users',                    require('./routes/users'));
app.use('/api/students',                 require('./routes/students'));
app.use('/api/destinations',             require('./routes/destinations'));
app.use('/api/universities',             require('./routes/universities'));
app.use('/api/notifications',            require('./routes/notifications'));
app.use('/api/handoff',                  require('./routes/handoff'));
app.use('/api/tasks',                    require('./routes/tasks'));
app.use('/api/kb',                       require('./routes/kb'));
app.use('/api/reminders',                require('./routes/reminders'));
app.use('/api/student-auth',             require('./routes/studentAuth'));
app.use('/api/student',                  require('./routes/studentPortal'));
app.use('/api/interview-questions',      require('./routes/interviewQuestions'));
app.use('/api/interview-topics',         require('./routes/interviewTopics'));
app.use('/api/interview-resources',      require('./routes/interviewResources'));
app.use('/api/announcements',            require('./routes/announcements'));
app.use('/api/student-app',              require('./routes/studentApp'));
app.use('/api/notification-settings',   require('./routes/notificationSettings'));
app.use('/api/custom-notification-rules', require('./routes/customNotificationRules'));
app.use('/api/payment-categories',       require('./routes/paymentCategories'));
app.use('/api/interview-videos',         require('./routes/interviewVideos'));
app.use('/api/interview-mistakes',       require('./routes/interviewMistakes'));
app.use('/api/faqs',                     require('./routes/faqs'));
app.use('/api/settings',                 require('./routes/appSettings'));
app.use('/api/referral',                 require('./routes/referral'));
app.use('/api/onboarding-slides',        require('./routes/onboardingSlides'));
app.use('/api/useful-links',             require('./routes/usefulLinks'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, url: req.url, method: req.method });
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    message: isProd ? 'Something went wrong' : err.message,
  });
});

// ── Unhandled rejections ─────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));
