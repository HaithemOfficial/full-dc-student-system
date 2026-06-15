const KBArticle = require('../models/KBArticle');

exports.getArticles = async (req, res) => {
  const filter = {};
  if (req.user.role !== 'founder') filter.status = 'published';
  if (req.query.type) filter.type = req.query.type;
  if (req.query.destination) filter.destinationRef = req.query.destination;
  if (req.query.studentFacing === 'true') filter.studentFacing = true;
  if (req.query.articleType) filter.articleType = req.query.articleType;
  const articles = await KBArticle.find(filter).sort({ updatedAt: -1 });
  res.json(articles);
};

exports.getArticle = async (req, res) => {
  const article = await KBArticle.findById(req.params.id);
  if (!article) return res.status(404).json({ message: 'Article not found' });
  if (article.status === 'draft' && req.user.role !== 'founder')
    return res.status(403).json({ message: 'Not authorized' });
  res.json(article);
};

exports.createArticle = async (req, res) => {
  const article = await KBArticle.create({
    ...req.body,
    lastUpdatedBy: req.user._id,
    lastUpdatedByName: req.user.name,
  });
  res.status(201).json(article);
};

exports.updateArticle = async (req, res) => {
  const article = await KBArticle.findById(req.params.id);
  if (!article) return res.status(404).json({ message: 'Article not found' });
  Object.assign(article, req.body, {
    lastUpdatedBy: req.user._id,
    lastUpdatedByName: req.user.name,
  });
  await article.save();
  res.json(article);
};

exports.togglePublish = async (req, res) => {
  const article = await KBArticle.findById(req.params.id);
  if (!article) return res.status(404).json({ message: 'Article not found' });
  article.status = article.status === 'published' ? 'draft' : 'published';
  article.lastUpdatedBy = req.user._id;
  article.lastUpdatedByName = req.user.name;
  await article.save();
  res.json(article);
};

exports.deleteArticle = async (req, res) => {
  const article = await KBArticle.findByIdAndDelete(req.params.id);
  if (!article) return res.status(404).json({ message: 'Article not found' });
  res.json({ message: 'Deleted' });
};
