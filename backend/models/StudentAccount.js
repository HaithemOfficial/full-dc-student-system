const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentAccountSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  phone:    { type: String, required: true, trim: true },
  password: { type: String, required: true, select: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  celebrationPending:   { type: Boolean, default: false },
  onboardingCompleted:  { type: Boolean, default: false },
  knownDeviceIds:       [{ type: String }],
}, { timestamps: true });

studentAccountSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

studentAccountSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

studentAccountSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('StudentAccount', studentAccountSchema);
