// Prescription controller - handles creating and viewing prescriptions.

const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// Populate options: bring in names only, never passwords.
const PRESCRIPTION_POPULATE = [
  {
    path: "patientId",
    select: "age gender phone address userId",
    populate: { path: "userId", select: "name" },
  },
  {
    path: "doctorId",
    select: "specialization phone userId",
    populate: { path: "userId", select: "name" },
  },
];

// 1) Create a prescription - Doctor only
const createPrescription = async (req, res) => {
  try {
    const { patientId, medicines, instructions, date } = req.body;

    // Validate required fields
    if (!patientId || !medicines || !instructions || !date) {
      return res.status(400).json({
        message: "patientId, medicines, instructions and date are required",
      });
    }

    // Doctor identity comes from the JWT, never from the request body.
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    // Verify the patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Create the prescription using the logged-in doctor's id
    const prescription = await Prescription.create({
      patientId,
      doctorId: doctor._id,
      medicines,
      instructions,
      date,
    });

    const populated = await prescription.populate(PRESCRIPTION_POPULATE);

    res.status(201).json({
      message: "Prescription created successfully",
      prescription: populated,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while creating prescription" });
  }
};

// 2) Get my prescriptions - Patient only
const getPatientPrescriptions = async (req, res) => {
  try {
    // Identity from JWT, never from query/body.
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const prescriptions = await Prescription.find({
      patientId: patient._id,
    }).populate(PRESCRIPTION_POPULATE);

    res.status(200).json(prescriptions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching prescriptions" });
  }
};

// 3) Get prescriptions I created - Doctor only
const getDoctorPrescriptions = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const prescriptions = await Prescription.find({
      doctorId: doctor._id,
    }).populate(PRESCRIPTION_POPULATE);

    res.status(200).json(prescriptions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching prescriptions" });
  }
};

// 4) Get all prescriptions - Admin only
const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find().populate(
      PRESCRIPTION_POPULATE
    );

    res.status(200).json(prescriptions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching prescriptions" });
  }
};

module.exports = {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getAllPrescriptions,
};
