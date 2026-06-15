const jwt = require('jsonwebtoken');
const StudentAccount = require('../models/StudentAccount');
const Student = require('../models/Student');

const STUDENT_SECRET   = () => process.env.JWT_STUDENT_SECRET  || process.env.STUDENT_JWT_SECRET;
const REFRESH_SECRET   = () => process.env.JWT_REFRESH_STUDENT_SECRET;

const protectStudent = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, STUDENT_SECRET());
    if (decoded.type !== 'student') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const account = await StudentAccount.findById(decoded.id);
    if (!account || !account.isActive) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const student = await Student.findById(account.student)
      .populate('destination', 'name code flag pipelineStages')
      .populate('assignedTo', 'name');
    if (!student || student.isArchived) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    req.studentAccount = account;
    req.student = student;
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized' });
  }
};

const generateStudentToken = (accountId) =>
  jwt.sign({ id: accountId, type: 'student' }, STUDENT_SECRET(), { expiresIn: '1h' });

const generateStudentRefreshToken = (accountId) =>
  jwt.sign({ id: accountId, type: 'student_refresh' }, REFRESH_SECRET(), { expiresIn: '30d' });

const verifyStudentRefreshToken = (token) =>
  jwt.verify(token, REFRESH_SECRET());

const STUDENT_REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

module.exports = {
  protectStudent,
  generateStudentToken,
  generateStudentRefreshToken,
  verifyStudentRefreshToken,
  STUDENT_REFRESH_COOKIE_OPTS,
};
