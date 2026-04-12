// backend/models/Property.js
// This defines what a "property" looks like in our database.
// Think of this like a form template — every property must follow this shape.

const mongoose = require('mongoose');

// Define the shape of a property document
const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'], // required = can't be blank
    },

    address: {
      street:  { type: String, required: true },
      city:    { type: String, required: true },
      state:   { type: String, required: true },
      zip:     { type: String, required: true },
    },

    price: {
      type: Number,
      required: [true, 'Please add a price'],
    },

    // "sale" = buying, "rent" = monthly rental
    type: {
      type: String,
      enum: ['sale', 'rent'], // only these two values allowed
      required: true,
    },

    // Is this listing currently available?
    status: {
      type: String,
      enum: ['active', 'sold', 'rented'],
      default: 'active', // new listings default to active
    },

    bedrooms:   { type: Number, required: true },
    bathrooms:  { type: Number, required: true },
    squareFeet: { type: Number },
    yearBuilt:  { type: Number },

    description: {
      type: String,
      required: [true, 'Please add a description'],
    },

    imageUrl: {
      type: String,
      default: '/images/placeholder.jpg',
    },

    // Array of strings e.g. ["Doorman", "Gym", "Rooftop"]
    features: [String],
  },
  {
    // Mongoose automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Export the model so routes can use it
module.exports = mongoose.model('Property', propertySchema);
