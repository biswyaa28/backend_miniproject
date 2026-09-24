// Prescription model - medicines given to a patient by a doctor.
// Separate from MedicalRecord so each concern stays simple.

const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  medicines: {
    type: String, // e.g. "Paracetamol 500mg"
    required: true,
  },
  instructions: {
    type: String, // e.g. "Take twice daily after food"
  },
  date: {
    type: String,
    required: true,
  },
});

const Prescription = mongoose.model("Prescription", prescriptionSchema);

module.exports = Prescription;
