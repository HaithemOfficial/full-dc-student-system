const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

exports.getUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
};

exports.createUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already in use' });

  const user = await User.create({ name, email, password, role, phone });
  res.status(201).json({ token: generateToken(user._id), user });
};

exports.updateUser = async (req, res) => {
  const { name, email, role, phone, isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role, phone, isActive },
    { new: true, runValidators: true }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

exports.deleteUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deactivated' });
};

exports.resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password reset successfully' });
};
