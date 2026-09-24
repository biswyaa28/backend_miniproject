// This file handles the MongoDB connection.
// We use Mongoose, which is a library that makes MongoDB easier to use in Node.js.

const mongoose = require("mongoose");

// connectDB reads the MONGO_URI from the .env file and connects to the database.
const connectDB = async () => {
  try {
    // mongoose.connect opens a connection to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, print the error and stop the server
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
