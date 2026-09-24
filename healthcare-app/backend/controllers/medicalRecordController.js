// Medical Record controller - handles creating and viewing medical records.

const MedicalRecord = require("../models/MedicalRecord");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// Populate options: bring in names only, never passwords.
const RECORD_POPULATE = [
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

// 1) Create a medical record - Doctor only
const createMedicalRecord = async (req, res) => {
  try {
    const { patientId, diagnosis, notes, date } = req.body;

    // Validate required fields
    if (!patientId || !diagnosis || !notes || !date) {
      return res.status(400).json({
        message: "patientId, diagnosis, notes and date are required",
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

    // Create the record using the logged-in doctor's id
    const record = await MedicalRecord.create({
      patientId,
      doctorId: doctor._id,
      diagnosis,
      notes,
      date,
    });

    const populated = await record.populate(RECORD_POPULATE);

    res.status(201).json({
      message: "Medical record created successfully",
      record: populated,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while creating medical record" });
  }
};

// 2) Get my medical records - Patient only
const getPatientMedicalRecords = async (req, res) => {
  try {
    // Identity from JWT, never from query/body.
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const records = await MedicalRecord.find({
      patientId: patient._id,
    }).populate(RECORD_POPULATE);

    res.status(200).json(records);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching medical records" });
  }
};

// 3) Get records I created - Doctor only
const getDoctorMedicalRecords = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const records = await MedicalRecord.find({
      doctorId: doctor._id,
    }).populate(RECORD_POPULATE);

    res.status(200).json(records);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching medical records" });
  }
};

// 4) Get all medical records - Admin only
const getAllMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find().populate(RECORD_POPULATE);

    res.status(200).json(records);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching medical records" });
  }
};

module.exports = {
  createMedicalRecord,
  getPatientMedicalRecords,
  getDoctorMedicalRecords,
  getAllMedicalRecords,
};
