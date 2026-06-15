const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  color:  { type: String, default: 'gray' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PaymentCategory', schema);
