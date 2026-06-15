const KBArticle = require('../models/KBArticle');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewTopic = require('../models/InterviewTopic');
const InterviewVideo = require('../models/InterviewVideo');
const InterviewMistake = require('../models/InterviewMistake');
const FAQ = require('../models/FAQ');
const StudentAccount = require('../models/StudentAccount');
const Announcement = require('../models/Announcement');
const Destination = require('../models/Destination');

exports.getStats = async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalPwaStudents,
    totalGuides,
    totalQuestions,
    totalAnnouncementsThisMonth,
    destinations,
  ] = await Promise.all([
    StudentAccount.countDocuments({ isActive: true }),
    KBArticle.countDocuments({ studentFacing: true, status: 'published', articleType: 'guide' }),
    InterviewQuestion.countDocuments({ active: true }),
    Announcement.countDocuments({ status: 'sent', sentAt: { $gte: startOfMonth } }),
    Destination.find({ isActive: true }).select('_id name flag code pipelineStages').lean(),
  ]);

  // Per-destination breakdown
  const destIds = destinations.map(d => d._id);
  const [guideCounts, topicCounts, videoCounts, mistakeCounts, faqCounts] = await Promise.all([
    KBArticle.aggregate([
      { $match: { studentFacing: true, status: 'published', articleType: 'guide', destinationRef: { $in: destIds } } },
      { $group: { _id: '$destinationRef', count: { $sum: 1 } } },
    ]),
    InterviewTopic.aggregate([
      { $match: { destination: { $in: destIds }, active: true } },
      { $group: { _id: '$destination', count: { $sum: 1 } } },
    ]),
    InterviewVideo.aggregate([
      { $match: { destination: { $in: destIds }, active: true } },
      { $group: { _id: '$destination', count: { $sum: 1 } } },
    ]),
    InterviewMistake.aggregate([
      { $match: { destination: { $in: destIds }, active: true } },
      { $group: { _id: '$destination', count: { $sum: 1 } } },
    ]),
    FAQ.aggregate([
      { $match: { destination: { $in: destIds }, active: true } },
      { $group: { _id: '$destination', count: { $sum: 1 } } },
    ]),
  ]);

  const perDestination = destinations.map(dest => {
    const find = (arr) => arr.find(x => String(x._id) === String(dest._id))?.count || 0;
    return {
      _id:               dest._id,
      name:              dest.name,
      flag:              dest.flag,
      code:              dest.code,
      guides:            find(guideCounts),
      interviewTopics:   find(topicCounts),
      interviewVideos:   find(videoCounts),
      interviewMistakes: find(mistakeCounts),
      faqCount:          find(faqCounts),
    };
  });

  res.json({ totalPwaStudents, totalGuides, totalQuestions, totalAnnouncementsThisMonth, perDestination });
};
