const NotificationSetting = require('../models/NotificationSetting');
const { CATALOG } = require('../utils/notificationUtils');

// GET /notification-settings — returns full catalog merged with any saved overrides
exports.getAll = async (req, res) => {
  const saved = await NotificationSetting.find().lean();
  const savedMap = Object.fromEntries(saved.map(s => [s.key, s]));

  const result = CATALOG.map(def => {
    const override = savedMap[def.key];
    return {
      key:             def.key,
      label:           def.label,
      category:        def.category,
      description:     def.description,
      recipientNote:   def.recipientNote,
      vars:            def.vars,
      defaultTitle:    def.defaultTitle,
      defaultMessage:  def.defaultMessage,
      enabled:         override ? override.enabled : true,
      titleTemplate:   override?.titleTemplate   || '',
      messageTemplate: override?.messageTemplate || '',
    };
  });

  res.json(result);
};

// PUT /notification-settings/:key — upsert enabled / templates
exports.update = async (req, res) => {
  const { key } = req.params;
  if (!CATALOG.find(c => c.key === key))
    return res.status(404).json({ message: 'Unknown notification key' });

  const { enabled, titleTemplate, messageTemplate } = req.body;

  const setting = await NotificationSetting.findOneAndUpdate(
    { key },
    { $set: { enabled, titleTemplate, messageTemplate } },
    { new: true, upsert: true, runValidators: true }
  );

  res.json(setting);
};
