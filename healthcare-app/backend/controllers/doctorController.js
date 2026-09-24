// Doctor controller - handles doctor management functions.

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Doctor = require("../models/Doctor");

// 1) Add a new doctor - Admin only
// Creates a User (role "doctor") and a linked Doctor profile.
const addDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    // Check whether the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User with role "doctor" (never taken from the client)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "doctor",
    });

    // Create the linked Doctor profile
    const doctor = await Doctor.create({
      userId: user._id,
      specialization,
      phone,
      isAvailable: true, // default availability
    });

    res.status(201).json({
      message: "Doctor added successfully",
      doctorId: doctor._id,
      userId: user._id,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while adding doctor" });
  }
};

// 2) Get all doctors - Admin, Patient, Receptionist
// Returns doctor id, name, specialization, phone, availability.
const getAllDoctors = async (req, res) => {
  try {
    // populate("userId") brings in the User so we can read name/email
    const doctors = await Doctor.find().populate("userId", "name email role");

    // Build a safe response (never include password)
    const result = doctors.map((doc) => ({
      doctorId: doc._id,
      name: doc.userId ? doc.userId.name : "Unknown",
      email: doc.userId ? doc.userId.email : "",
      specialization: doc.specialization,
      phone: doc.phone,
      isAvailable: doc.isAvailable,
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching doctors" });
  }
};

// 3) Get available doctors only - Patient, Admin, Receptionist
// Used later by the patient booking page.
const getAvailableDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isAvailable: true }).populate(
      "userId",
      "name email role"
    );

    const result = doctors.map((doc) => ({
      doctorId: doc._id,
      name: doc.userId ? doc.userId.name : "Unknown",
      specialization: doc.specialization,
      phone: doc.phone,
      isAvailable: doc.isAvailable,
    }));

    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching available doctors" });
  }
};

// 4) Toggle availability - Doctor only
// Uses req.user.userId from the JWT - never trusts a doctorId from the body.
const toggleAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.userId });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    // true -> false, false -> true
    doctor.isAvailable = !doctor.isAvailable;
    await doctor.save();

    const statusText = doctor.isAvailable ? "available" : "unavailable";

    res.status(200).json({
      message: `Availability changed to ${statusText}`,
      isAvailable: doctor.isAvailable,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while toggling availability" });
  }
};

// 5) Get my doctor profile - Doctor only
const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.userId }).populate(
      "userId",
      "name email role"
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    res.status(200).json({
      doctorId: doctor._id,
      name: doctor.userId ? doctor.userId.name : "Unknown",
      specialization: doctor.specialization,
      phone: doctor.phone,
      isAvailable: doctor.isAvailable,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching doctor profile" });
  }
};

module.exports = {
  addDoctor,
  getAllDoctors,
  getAvailableDoctors,
  toggleAvailability,
  getMyDoctorProfile,
};
