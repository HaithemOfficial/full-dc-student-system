const User = require('../models/User');
const logger = require('../utils/logger');
const { generateToken, generateRefreshToken, verifyRefreshToken, REFRESH_COOKIE_OPTS } = require('../middleware/auth');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !user.isActive) {
    logger.authFail('Invalid credentials', { ip: req.ip, email });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    logger.authFail('Wrong password', { ip: req.ip, email });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  user.lastLogin = new Date();
  await user.save();

  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

  logger.security('Staff login', { userId: user._id, role: user.role, ip: req.ip });

  const userObj = user.toObject();
  delete userObj.password;

  res.json({ token: accessToken, user: userObj });
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  try {
    const decoded = verifyRefreshToken(token);
    if (decoded.type !== 'staff_refresh') throw new Error('Invalid type');

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) throw new Error('User inactive');

    const newAccessToken = generateToken(user._id);
    res.json({ token: newAccessToken, user });
  } catch {
    res.clearCookie('refreshToken', { path: '/' });
    res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('refreshToken', { path: '/' });
  logger.security('Staff logout', { ip: req.ip });
  res.json({ message: 'Logged out' });
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ message: 'New password must be at least 8 characters' });

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
};
