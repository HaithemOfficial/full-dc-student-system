const rateLimit = require('express-rate-limit');

const handler = (req, res) => {
  const resetMs  = req.rateLimit?.resetTime instanceof Date
    ? req.rateLimit.resetTime.getTime()
    : (req.rateLimit?.resetTime || Date.now());
  const retryAfter = Math.max(0, Math.ceil((resetMs - Date.now()) / 1000));
  res.status(429).json({
    message: 'Too many requests. Please try again later.',
    retryAfter,
  });
};

// Global — 1000 req / 15 min per IP
// Multiple users can share one IP (office network), and SPAs make many calls
const global = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Auth endpoints — 20 attempts / 15 min per IP
const auth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Per-phone login limiter — 10 attempts / 15 min per phone number
// Prevents targeted brute-force without penalising bystanders on shared carrier IPs
const authByPhone = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.phone || req.ip,
  validate: { keyGeneratorIpFallback: false },
  handler,
});

// Refresh — 120 req / 15 min per IP
// App calls refresh on every mount/tab open across staff + students
const refresh = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

module.exports = { global, auth, authByPhone, refresh };
