const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();

// How long an admin stays logged in before having to sign in again
const TOKEN_HOURS = 12;

// Wrong-password protection: after 5 failed attempts from the same
// connection, logins are blocked for 15 minutes
const MAX_FAILS    = 5;
const LOCK_MINUTES = 15;
const failedLogins = new Map(); // ip -> { count, firstFailAt }

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

function isLockedOut(ip) {
  const entry = failedLogins.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstFailAt > LOCK_MINUTES * 60 * 1000) {
    failedLogins.delete(ip); // lock period over, start fresh
    return false;
  }
  return entry.count >= MAX_FAILS;
}

function recordFail(ip) {
  const entry = failedLogins.get(ip) || { count: 0, firstFailAt: Date.now() };
  entry.count += 1;
  failedLogins.set(ip, entry);
}

// ── POST /api/auth/login ── checks the password and returns a signed token
router.post('/login', (req, res) => {
  const ip = req.ip;
  const { password } = req.body || {};

  if (isLockedOut(ip)) {
    return res.status(429).json({
      success: false,
      message: `Too many wrong attempts. Please wait ${LOCK_MINUTES} minutes and try again.`,
    });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password required' });
  }

  if (!process.env.ADMIN_PASSWORD || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    recordFail(ip);
    return res.status(401).json({ success: false, message: 'Incorrect password' });
  }

  failedLogins.delete(ip);
  // Token = "expiry time" + "." + signature of that expiry time
  const expires = String(Date.now() + TOKEN_HOURS * 60 * 60 * 1000);
  return res.json({ success: true, token: `${expires}.${sign(expires)}` });
});

// Returns true if the request carries a valid, unexpired admin token
function isAdmin(req) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  const [expires, signature] = token.split('.');

  return Boolean(
    process.env.ADMIN_PASSWORD
    && expires && signature
    && Number(expires) > Date.now()
    && safeEqual(signature, sign(expires))
  );
}

// ── requireAdmin ── add this to any route that only admins may use
function requireAdmin(req, res, next) {
  if (!isAdmin(req)) {
    return res.status(401).json({ success: false, message: 'Please log in again.' });
  }
  next();
}

module.exports = router;
module.exports.requireAdmin = requireAdmin;
module.exports.isAdmin = isAdmin;
