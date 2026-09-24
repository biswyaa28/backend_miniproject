// Appointment model - one booking between a patient and a doctor.
// status tracks the appointment through its life cycle:
// Booked -> Confirmed -> Completed (or Cancelled)

const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
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
  date: {
    type: String, // e.g. "2026-09-25"
    required: true,
  },
  timeSlot: {
    type: String, // e.g. "10:00-10:30"
    required: true,
  },
  reason: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Booked", "Confirmed", "Completed", "Cancelled"],
    default: "Booked",
  },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
