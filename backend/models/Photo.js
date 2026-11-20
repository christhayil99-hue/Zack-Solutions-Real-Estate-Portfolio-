// backend/models/Photo.js
// Stores uploaded listing photos inside the MongoDB database.
//
// Why the database and not a folder? Render's free plan wipes its disk every
// time the site redeploys or restarts, so photos saved as files would vanish.
// The admin page shrinks each photo before uploading (usually 150–400 KB),
// so the free 512 MB database has room for well over a thousand photos.

const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    data:        { type: Buffer, required: true },   // the image itself
    contentType: { type: String, required: true },   // e.g. "image/jpeg"
    size:        { type: Number, required: true },   // in bytes
  },
  { timestamps: true }
);

module.exports = mongoose.model('Photo', photoSchema);
