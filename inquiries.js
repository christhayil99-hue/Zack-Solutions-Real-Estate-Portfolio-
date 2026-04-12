// backend/routes/inquiries.js
// These are the API endpoints for property inquiries (contact form submissions).

const express = require('express');
const router  = express.Router();
const Inquiry = require('../models/Inquiry');

// ─────────────────────────────────────────────
// GET /api/inquiries
// Returns ALL inquiries — for the admin dashboard
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // .sort({ createdAt: -1 }) = newest first
    // .populate('propertyId') = also fetch the linked property's full data
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });

    res.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/inquiries
// Creates a new inquiry — called when visitor submits the contact form
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const inquiry = await Inquiry.create(req.body);

    res.status(201).json({ success: true, data: inquiry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/inquiries/:id
// Updates the STATUS of an inquiry (new → contacted → closed)
// Used by the admin dashboard
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status }, // only allow status to be updated here
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    res.json({ success: true, data: inquiry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
