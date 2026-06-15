require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');

const generateCode = (firstName) => {
  const clean = (firstName || 'USER').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6) || 'USER';
  const num = String(Math.floor(1000 + Math.random() * 9000));
  return `${clean}-${num}`;
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const students = await Student.find({ $or: [{ referralCode: { $exists: false } }, { referralCode: null }, { referralCode: '' }] }).lean();
  console.log(`Found ${students.length} students without a referral code`);

  if (students.length === 0) {
    console.log('All students already have referral codes. Done.');
    await mongoose.disconnect();
    return;
  }

  let generated = 0;
  for (const s of students) {
    let code;
    let attempts = 0;
    do {
      code = generateCode(s.firstName);
      const exists = await Student.findOne({ referralCode: code }).lean();
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    await Student.findByIdAndUpdate(s._id, { referralCode: code });
    console.log(`  ${s.firstName} ${s.lastName} → ${code}`);
    generated++;
  }

  console.log(`\nGenerated ${generated} referral codes for existing students.`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
