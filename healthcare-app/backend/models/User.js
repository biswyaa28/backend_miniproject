// User model - stores login accounts for every person using the system.
// Each user has a role that decides what they are allowed to do.

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // email cannot be repeated
  },
  password: {
    type: String,
    required: true, // will store the bcrypt hashed password
  },
  role: {
    type: String,
    enum: ["admin", "doctor", "patient", "receptionist"],
    default: "patient",
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
