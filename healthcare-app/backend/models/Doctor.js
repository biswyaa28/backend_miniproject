// Doctor model - extra details for users whose role is "doctor".
// isAvailable controls whether patients can book this doctor.

const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // links back to the User collection
    required: true,
  },
  specialization: {
    type: String,
  },
  phone: {
    type: String,
  },
  isAvailable: {
    type: Boolean,
    default: true, // doctors are available by default
  },
});

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
