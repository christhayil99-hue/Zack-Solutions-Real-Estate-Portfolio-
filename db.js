// backend/config/db.js
// This file connects our server to MongoDB Atlas

const mongoose = require('mongoose'); // Mongoose helps us talk to MongoDB

// This function connects to the database
const connectDB = async () => {
  try {
    // process.env.MONGO_URI reads from your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If something goes wrong, print the error and stop the server
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1); // Exit with failure code
  }
};

module.exports = connectDB; // Export so server.js can use it
