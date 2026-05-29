// backend/models/Inquiry.js
// This defines what an "inquiry" looks like — submitted when a visitor
// fills out the contact form on a property page.

const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    // Links this inquiry to a specific property
    // mongoose.Schema.Types.ObjectId is the type MongoDB uses for IDs
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property', // "ref" means this ID refers to the Property collection
      required: true,
    },

    // Save the property title so the admin can read it without extra lookups
    propertyTitle: {
      type: String,
      required: true,
    },

    // Visitor information
    name:  { type: String, required: [true, 'Please enter your name'] },
    email: { type: String, required: [true, 'Please enter your email'] },
    phone: { type: String }, // optional
    message: { type: String, required: [true, 'Please enter a message'] },

    // Admin tracks where each inquiry stands
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new', // every new submission starts as "new"
    },
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
