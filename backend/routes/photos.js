// backend/routes/photos.js
// Upload and serve listing photos.
//   POST   /api/photos       → admin uploads one photo, gets back its link
//   GET    /api/photos/:id   → anyone can view a photo (used in <img> tags)

const express  = require('express');
const mongoose = require('mongoose');
const router   = express.Router();
const Photo    = require('../models/Photo');
const { requireAdmin } = require('./auth');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES     = 5 * 1024 * 1024; // 5 MB per photo (after the browser shrinks it)

// ── POST /api/photos ── admin only
router.post(
  '/',
  requireAdmin,
  express.raw({ type: ALLOWED_TYPES, limit: MAX_BYTES }),
  async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ success: false, message: 'Database not connected. Please try again shortly.' });
      }
      const type = (req.headers['content-type'] || '').split(';')[0].trim();
      if (!ALLOWED_TYPES.includes(type) || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ success: false, message: 'Please upload a JPG, PNG or WebP image.' });
      }

      const photo = await Photo.create({ data: req.body, contentType: type, size: req.body.length });
      res.status(201).json({ success: true, url: `/api/photos/${photo._id}` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ── GET /api/photos/:id ── public
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end();
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).end();

    res.set('Content-Type', photo.contentType);
    // A photo's link never changes, so browsers can keep it for a year
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(photo.data);
  } catch (error) {
    res.status(500).end();
  }
});

// Deletes the stored photos behind a list of links (used when a listing
// is deleted, or when a photo is removed while editing a listing)
async function deletePhotosByUrl(urls = []) {
  const ids = urls
    .filter(u => typeof u === 'string' && u.startsWith('/api/photos/'))
    .map(u => u.replace('/api/photos/', ''))
    .filter(id => mongoose.isValidObjectId(id));
  if (ids.length) await Photo.deleteMany({ _id: { $in: ids } });
}

module.exports = router;
module.exports.deletePhotosByUrl = deletePhotosByUrl;
