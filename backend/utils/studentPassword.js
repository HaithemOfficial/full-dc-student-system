const crypto = require('crypto');

function generateStudentPassword() {
  // 9 random bytes → 12 base64url chars (no padding ambiguity, URL-safe alphabet)
  return crypto.randomBytes(9).toString('base64url');
}

module.exports = { generateStudentPassword };
