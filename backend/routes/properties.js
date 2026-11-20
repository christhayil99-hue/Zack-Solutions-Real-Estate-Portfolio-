// backend/routes/properties.js
// API endpoints for property listings.
// Listings come ONLY from the database. There is no sample or placeholder data.

const express  = require('express');
const mongoose = require('mongoose');
const router   = express.Router();
const Property = require('../models/Property');
const { requireAdmin, isAdmin } = require('./auth');
const { deletePhotosByUrl } = require('./photos');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const UNAVAILABLE = { success: false, message: 'Listings are temporarily unavailable. Please try again shortly.' };

// Only copy the fields a listing is allowed to have from the request
// (so nobody can sneak extra fields into the database)
function pickPropertyFields(body = {}) {
  const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));
  const data = {
    title:       body.title,
    category:    body.category,
    address: {
      street: body.address?.street,
      city:   body.address?.city,
      state:  body.address?.state,
      zip:    body.address?.zip,
    },
    price:       num(body.price),
    type:        body.type,
    status:      body.status,
    bedrooms:    num(body.bedrooms),
    bathrooms:   num(body.bathrooms),
    squareFeet:  num(body.squareFeet),
    yearBuilt:   num(body.yearBuilt),
    description: body.description,
    features:    Array.isArray(body.features) ? body.features.map(String).filter(Boolean).slice(0, 30) : [],
    images:      Array.isArray(body.images)
                   ? body.images.filter(u => typeof u === 'string' && u.startsWith('/api/photos/')).slice(0, 15)
                   : [],
  };
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);
  return data;
}

// ── GET /api/properties ───────────────────────────────────────────────────────
// Public: returns active listings, with optional filters.
// Admin (logged in, with ?all=1): returns every listing, including sold/rented.
router.get('/', async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json(UNAVAILABLE);

    const query = {};
    if (!(req.query.all === '1' && isAdmin(req))) query.status = 'active';
    if (req.query.type)     query.type     = String(req.query.type);
    if (req.query.category) query.category = String(req.query.category);
    if (req.query.bedrooms) query.bedrooms = { $gte: Number(req.query.bedrooms) };
    if (req.query.minPrice) query.price    = { ...query.price, $gte: Number(req.query.minPrice) };
    if (req.query.maxPrice) query.price    = { ...query.price, $lte: Number(req.query.maxPrice) };

    const results = await Property.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/properties/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json(UNAVAILABLE);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const property = await Property.findById(req.params.id);
    // Visitors can't open sold/rented listings by link; admins can
    if (!property || (property.status !== 'active' && !isAdmin(req))) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/properties ── admin "Add new listing"
router.post('/', requireAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Database not connected. Cannot save new listings.' });

    const property = await Property.create(pickPropertyFields(req.body));
    res.status(201).json({ success: true, data: property });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── PUT /api/properties/:id ── admin "Edit"
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Database not connected.' });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const existing = await Property.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Property not found' });

    const updates = pickPropertyFields(req.body);
    // Fields left blank in the edit form should be cleared, not kept
    const unset = {};
    ['bedrooms', 'bathrooms', 'squareFeet', 'yearBuilt'].forEach(k => {
      if (!(k in updates)) unset[k] = 1;
    });

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updates, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { new: true, runValidators: true }
    );

    // Delete photos that were removed during the edit
    const removed = (existing.images || []).filter(u => !(property.images || []).includes(u));
    await deletePhotosByUrl(removed);

    res.json({ success: true, data: property });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── DELETE /api/properties/:id ── admin "Delete"
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Database not connected.' });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    await deletePhotosByUrl(property.images); // remove its photos too
    res.json({ success: true, message: 'Property deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
