const express = require('express');
const router = express.Router();
const c = require('../controllers/studentPortalController');
const { protectStudent } = require('../middleware/studentAuth');
const wrap = require('../middleware/asyncHandler');

router.use(protectStudent);

router.get('/me', wrap(c.getMe));
router.get('/me/progress', wrap(c.getProgress));
router.get('/me/payments', wrap(c.getPayments));
router.get('/me/deadlines', wrap(c.getDeadlines));
router.get('/me/notifications/unread-count', wrap(c.getUnreadCount));
router.get('/me/notifications', wrap(c.getNotifications));
router.put('/me/notifications/read-all', wrap(c.markAllRead));
router.put('/me/notifications/:id/read', wrap(c.markRead));

router.get('/me/interview-prep/check', wrap(c.checkInterviewPrep));
router.get('/me/interview-questions', wrap(c.getInterviewQuestions));
router.get('/me/articles', wrap(c.getStudentArticles));
router.get('/me/content', wrap(c.getContent));
router.get('/me/announcements', wrap(c.getAnnouncements));
router.patch('/me/announcements/:id/read', wrap(c.markAnnouncementRead));
router.get('/me/documents', wrap(c.getDocuments));
router.post('/me/complete-onboarding', wrap(c.completeOnboarding));
router.get('/me/referral', wrap(c.getReferral));
router.get('/me/onboarding-slides', wrap(c.getOnboardingSlides));
router.get('/me/useful-links',      wrap(c.getUsefulLinks));
router.post('/me/check-device',     wrap(c.checkDevice));

module.exports = router;
