// backend/server.js
// This is the MAIN file that starts the entire backend server.
// Run this with: npm start

// ── Load environment variables from .env file ──────────────────────────────
require('dotenv').config(); // must be first line before anything else

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const connectDB  = require('./config/db');

// ── Connect to MongoDB ──────────────────────────────────────────────────────
connectDB();

// ── Create the Express app ──────────────────────────────────────────────────
const app = express();

// Render sits in front of this app as a proxy; this lets us see each
// visitor's real address (used by the wrong-password lockout)
app.set('trust proxy', 1);

// ── Middleware ──────────────────────────────────────────────────────────────
// Middleware runs before every request — like a checkpoint

app.use(cors());                  // Allow frontend to talk to backend
app.use(express.json());          // Allow server to read JSON from request body
app.use(express.urlencoded({ extended: false })); // Allow HTML form submissions

// Serve frontend files (HTML, CSS, JS) as static files
// When someone visits "/", Express will look for files in the "frontend" folder
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ──────────────────────────────────────────────────────────────
// Any request that starts with /api/properties → handled by properties.js
// Any request that starts with /api/inquiries  → handled by inquiries.js

app.use('/api/properties', require('./routes/properties'));
app.use('/api/inquiries',  require('./routes/inquiries'));
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/photos',     require('./routes/photos'));

// Unknown /api/... links get a proper "not found" reply instead of the homepage
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Not found' }));

// ── Catch-all Route ─────────────────────────────────────────────────────────
// For any other URL, serve the homepage
// This makes sure refreshing on any page still works
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Start the Server ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000; // Use port from .env or default to 3000

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
