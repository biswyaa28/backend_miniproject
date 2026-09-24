// Auth controller - handles patient registration and login.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Patient = require("../models/Patient");

// Register a new patient (public route - role is always "patient")
const registerPatient = async (req, res) => {
  try {
    // The public form must NOT send a role - we force "patient" here
    const { name, email, password, age, gender, phone, address } = req.body;

    // 1) Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 2) Hash the password before saving (never store plain password)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3) Create the User with role "patient" (not taken from request body)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "patient",
    });

    // 4) Create a Patient profile linked to this User
    await Patient.create({
      userId: user._id,
      age,
      gender,
      phone,
      address,
    });

    // 5) Success response
    res.status(201).json({
      message: "Patient registered successfully",
      userId: user._id,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Login for all roles (admin, doctor, patient, receptionist)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // 1) Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2) Compare the entered password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3) Create a JWT containing userId and role
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 4) Return token and basic user info
    res.json({
      message: "Login successful",
      token,
      role: user.role,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
};

module.exports = { registerPatient, login };
