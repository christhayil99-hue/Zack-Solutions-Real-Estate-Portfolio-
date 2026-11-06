const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();

// How long an admin stays logged in before having to sign in again
const TOKEN_HOURS = 12;

// Creates a signature using the admin password as the secret key.
// Only this server knows the password, so only this server can make valid tokens.
function sign(value) {
  return crypto.createHmac('sha256', process.env.ADMIN_PASSWORD).update(value).digest('hex');
}

// Compares two strings in constant time (prevents timing-based guessing)
function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// ── POST /api/auth/login ── checks the password and returns a signed token
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password required' });
  }

  if (!process.env.ADMIN_PASSWORD || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ success: false, message: 'Incorrect password' });
  }

  // Token = "expiry time" + "." + signature of that expiry time
  const expires = String(Date.now() + TOKEN_HOURS * 60 * 60 * 1000);
  return res.json({ success: true, token: `${expires}.${sign(expires)}` });
});

// ── requireAdmin ── add this to any route that only admins may use
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  const [expires, signature] = token.split('.');

  const valid = process.env.ADMIN_PASSWORD
    && expires && signature
    && Number(expires) > Date.now()
    && safeEqual(signature, sign(expires));

  if (!valid) {
    return res.status(401).json({ success: false, message: 'Please log in again.' });
  }
  next();
}

module.exports = router;
module.exports.requireAdmin = requireAdmin;
