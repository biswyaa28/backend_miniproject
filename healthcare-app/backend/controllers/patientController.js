// Patient controller - handles patient viewing functions.

const Patient = require("../models/Patient");

// 1) Get all patients - Admin, Receptionist
const getAllPatients = async (req, res) => {
  try {
    // populate("userId") brings in the User so we can read the name
    const patients = await Patient.find().populate("userId", "name email role");

    // Build a safe response (never include password)
    const result = patients.map((p) => ({
      patientId: p._id,
      name: p.userId ? p.userId.name : "Unknown",
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      address: p.address,
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching patients" });
  }
};

// 2) Get my patient profile - Patient only
// Uses req.user.userId from the JWT.
const getMyPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      userId: req.user.userId,
    }).populate("userId", "name email role");

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    res.status(200).json({
      patientId: patient._id,
      name: patient.userId ? patient.userId.name : "Unknown",
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching patient profile" });
  }
};

// 3) Get patient by id - Admin, Doctor, Receptionist
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate(
      "userId",
      "name email role"
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({
      patientId: patient._id,
      name: patient.userId ? patient.userId.name : "Unknown",
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching patient" });
  }
};

module.exports = { getAllPatients, getMyPatientProfile, getPatientById };
