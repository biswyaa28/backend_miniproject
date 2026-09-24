// Patient model - extra details for users whose role is "patient".
// Created automatically when a patient registers.

const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // links back to the User collection
    required: true,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
});

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
