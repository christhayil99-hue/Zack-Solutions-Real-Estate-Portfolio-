// backend/models/Property.js
// This defines what a "property" looks like in our database.
// Think of this like a form template — every property must follow this shape.

const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: 150,
    },

    address: {
      street: { type: String, required: [true, 'Please add a street address'], trim: true },
      city:   { type: String, required: [true, 'Please add a city'], trim: true },
      state:  { type: String, required: [true, 'Please add a state'], trim: true },
      zip:    { type: String, required: [true, 'Please add a ZIP code'], trim: true },
    },

    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: 0,
    },

    // "sale" = buying, "rent" = monthly rental
    type: {
      type: String,
      enum: ['sale', 'rent'],
      required: true,
    },

    // Is this listing currently available?
    // Only "active" listings appear on the public website.
    status: {
      type: String,
      enum: ['active', 'sold', 'rented'],
      default: 'active',
    },

    // Optional, because land and commercial properties often have none
    bedrooms:   { type: Number, min: 0 },
    bathrooms:  { type: Number, min: 0 },
    squareFeet: { type: Number, min: 0 },
    yearBuilt:  { type: Number },

    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: 5000,
    },

    // Photo links, e.g. "/api/photos/6650f1...". The FIRST photo is the cover photo.
    images: {
      type: [String],
      default: [],
    },

    // Older single-photo field, kept so older listings still display
    image: {
      type: String,
      default: '',
    },

    category: {
      type: String,
      enum: [
        'office', 'retail', 'industrial', 'home', 'luxury', 'modern', 'family',
        'real-estate', 'vacant-land', 'construction-design',
        'commercial-investment', 'income-properties', 'multifamily', 'development',
      ],
      required: [true, 'Please select a category'],
    },

    // Array of strings e.g. ["Parking", "Corner Lot", "Highway Access"]
    features: [String],
  },
  {
    // Mongoose automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

module.exports = mongoose.model('Property', propertySchema);
