const express = require('express');
const router  = express.Router();
const InterviewVideo = require('../models/InterviewVideo');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

function detectPlatform(url) {
  if (/youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\//.test(url)) return 'youtube';
  if (/tiktok\.com\/@.+\/video\//.test(url)) return 'tiktok';
  return null;
}

router.use(protect);

router.get('/', wrap(async (req, res) => {
  const filter = { active: true };
  if (req.query.destination) filter.destination = req.query.destination;
  const videos = await InterviewVideo.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(videos);
}));

router.post('/', founderOnly, wrap(async (req, res) => {
  const platform = detectPlatform(req.body.url || '');
  if (!platform) return res.status(400).json({ message: 'Invalid YouTube or TikTok URL' });
  const video = await InterviewVideo.create({ ...req.body, platform, createdBy: req.user._id });
  res.status(201).json(video);
}));

router.patch('/:id', founderOnly, wrap(async (req, res) => {
  if (req.body.url) {
    const platform = detectPlatform(req.body.url);
    if (!platform) return res.status(400).json({ message: 'Invalid YouTube or TikTok URL' });
    req.body.platform = platform;
  }
  const video = await InterviewVideo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!video) return res.status(404).json({ message: 'Not found' });
  res.json(video);
}));

router.patch('/:id/toggle', founderOnly, wrap(async (req, res) => {
  const video = await InterviewVideo.findById(req.params.id);
  if (!video) return res.status(404).json({ message: 'Not found' });
  video.active = !video.active;
  await video.save();
  res.json(video);
}));

router.delete('/:id', founderOnly, wrap(async (req, res) => {
  await InterviewVideo.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
}));

module.exports = router;
