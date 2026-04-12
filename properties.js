// backend/routes/properties.js
// These are the API "endpoints" for properties.
// Each one handles a specific type of request from the frontend.

const express  = require('express');
const router   = express.Router(); // Router lets us group related routes
const Property = require('../models/Property');

// ─────────────────────────────────────────────
// GET /api/properties
// Returns ALL active property listings
// Used by: listings.html page
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { type, minPrice, maxPrice, bedrooms } = req.query;

    // Build a filter object based on what the user searched for
    let filter = { status: 'active' }; // always only show active listings

    if (type)     filter.type     = type;           // e.g. ?type=rent
    if (bedrooms) filter.bedrooms = Number(bedrooms); // e.g. ?bedrooms=2
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice); // greater than or equal
      if (maxPrice) filter.price.$lte = Number(maxPrice); // less than or equal
    }

    // .find(filter) searches the database for matching documents
    // .sort({ createdAt: -1 }) sorts newest first
    const properties = await Property.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, count: properties.length, data: properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/properties/:id
// Returns ONE specific property by its ID
// Used by: detail.html page
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    // req.params.id gets the :id part from the URL
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/properties
// Creates a NEW property listing
// Used by: admin.html page
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    // req.body contains the data sent from the admin form
    const property = await Property.create(req.body);

    res.status(201).json({ success: true, data: property });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/properties/:id
// Updates an EXISTING property
// Used by: admin.html page (edit button)
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // "new: true" returns the updated version
    );

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({ success: true, data: property });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/properties/:id
// Removes a property listing
// Used by: admin.html page (delete button)
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({ success: true, message: 'Property removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
