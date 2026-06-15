const jwt = require('jsonwebtoken');
const User = require('../models/User');

const STAFF_SECRET   = () => process.env.JWT_STAFF_SECRET   || process.env.JWT_SECRET;
const REFRESH_SECRET = () => process.env.JWT_REFRESH_STAFF_SECRET;

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, STAFF_SECRET());
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized' });
  }
};

const founderOnly = (req, res, next) => {
  if (req.user?.role === 'founder') return next();
  res.status(403).json({ message: 'Access restricted to founders only' });
};

const generateToken = (id) =>
  jwt.sign({ id }, STAFF_SECRET(), { expiresIn: '8h' });

const generateRefreshToken = (id) =>
  jwt.sign({ id, type: 'staff_refresh' }, REFRESH_SECRET(), { expiresIn: '7d' });

const verifyRefreshToken = (token) =>
  jwt.verify(token, REFRESH_SECRET());

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

module.exports = { protect, founderOnly, generateToken, generateRefreshToken, verifyRefreshToken, REFRESH_COOKIE_OPTS };
