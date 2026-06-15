const StudentAccount = require('../models/StudentAccount');
const Student = require('../models/Student');
const logger = require('../utils/logger');
const { generateStudentToken, generateStudentRefreshToken, verifyStudentRefreshToken, STUDENT_REFRESH_COOKIE_OPTS } = require('../middleware/studentAuth');
const { generateStudentPassword } = require('../utils/studentPassword');
const { protect } = require('../middleware/auth');

exports.login = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password)
    return res.status(400).json({ message: 'Phone and password are required' });

  const account = await StudentAccount.findOne({ phone: phone.trim() }).select('+password');
  if (!account || !account.isActive) {
    logger.authFail('Student login - account not found', { ip: req.ip, phone });
    return res.status(401).json({ message: 'Incorrect phone number or password' });
  }

  const student = await Student.findById(account.student);
  if (!student || student.isArchived) {
    logger.authFail('Student login - student not found', { ip: req.ip });
    return res.status(401).json({ message: 'Incorrect phone number or password' });
  }

  const isMatch = await account.comparePassword(password);
  if (!isMatch) {
    logger.authFail('Student login - wrong password', { ip: req.ip, phone });
    return res.status(401).json({ message: 'Incorrect phone number or password' });
  }

  account.lastLogin = new Date();
  await account.save();

  const accessToken = generateStudentToken(account._id);
  const refreshToken = generateStudentRefreshToken(account._id);

  res.cookie('studentRefreshToken', refreshToken, STUDENT_REFRESH_COOKIE_OPTS);

  logger.security('Student login', { studentId: student._id, ip: req.ip });

  res.json({
    token: accessToken,
    student: {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone,
      destinationName: student.destinationName,
      currentStageName: student.currentStageName,
      onboardingCompleted: account.onboardingCompleted ?? false,
    },
  });
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.studentRefreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  try {
    const decoded = verifyStudentRefreshToken(token);
    if (decoded.type !== 'student_refresh') throw new Error('Invalid type');

    const account = await StudentAccount.findById(decoded.id);
    if (!account || !account.isActive) throw new Error('Account inactive');

    const student = await Student.findById(account.student);
    if (!student || student.isArchived) throw new Error('Student not found');

    const newAccessToken = generateStudentToken(account._id);

    res.json({
      token: newAccessToken,
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        destinationName: student.destinationName,
        currentStageName: student.currentStageName,
        onboardingCompleted: account.onboardingCompleted ?? false,
      },
    });
  } catch {
    res.clearCookie('studentRefreshToken', { path: '/' });
    res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('studentRefreshToken', { path: '/' });
  logger.security('Student logout', { ip: req.ip });
  res.json({ message: 'Logged out' });
};

exports.resetPassword = async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  if (req.user.role === 'dc_agent' && String(student.assignedTo) !== String(req.user._id))
    return res.status(403).json({ message: 'Not authorized' });

  const newPassword = generateStudentPassword(student.firstName, student.phone);
  let account = await StudentAccount.findOne({ student: student._id });

  if (!account) {
    account = new StudentAccount({
      student: student._id,
      phone: student.phone || '',
      password: newPassword,
    });
    return account.save().then(() =>
      res.json({ message: 'App account created', generatedPassword: newPassword })
    );
  }

  account.password = newPassword;
  await account.save();
  res.json({ message: 'Password reset successfully', generatedPassword: newPassword });
};
