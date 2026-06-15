const REQUIRED = [
  // Accept new names OR old backward-compat names
  { keys: ['JWT_STAFF_SECRET', 'JWT_SECRET'],            label: 'JWT_STAFF_SECRET (or JWT_SECRET)' },
  { keys: ['JWT_STUDENT_SECRET', 'STUDENT_JWT_SECRET'],  label: 'JWT_STUDENT_SECRET (or STUDENT_JWT_SECRET)' },
  { keys: ['JWT_REFRESH_STAFF_SECRET'],                  label: 'JWT_REFRESH_STAFF_SECRET' },
  { keys: ['JWT_REFRESH_STUDENT_SECRET'],                label: 'JWT_REFRESH_STUDENT_SECRET' },
  { keys: ['MONGODB_URI'],                               label: 'MONGODB_URI' },
];

module.exports = function validateEnv() {
  const missing = REQUIRED.filter(r => !r.keys.some(k => process.env[k]));
  if (missing.length) {
    console.error('\n[FATAL] Missing required environment variables:');
    missing.forEach(r => console.error(`  - ${r.label}`));
    console.error('\nSee .env.example for the full list.\n');
    process.exit(1);
  }

  const SHORT_WARN = ['JWT_STAFF_SECRET', 'JWT_SECRET', 'JWT_STUDENT_SECRET', 'STUDENT_JWT_SECRET',
                      'JWT_REFRESH_STAFF_SECRET', 'JWT_REFRESH_STUDENT_SECRET'];
  SHORT_WARN.forEach(k => {
    if (process.env[k] && process.env[k].length < 64 && process.env.NODE_ENV === 'production') {
      console.warn(`[WARN] ${k} should be at least 64 characters in production.`);
    }
  });
};
