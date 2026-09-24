// Main entry point of the backend application.
// This file starts the Express server, connects to MongoDB, and sets up middleware and routes.

// 1) Load environment variables from the .env file (PORT, MONGO_URI, JWT_SECRET)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");

const app = express();

// 2) Middleware setup
// cors() allows the React frontend (running on another port) to call this API.
app.use(cors());
// express.json() lets Express understand JSON request bodies (e.g. login form data).
app.use(express.json());

// 3) MongoDB connection
connectDB();

// 4) Route setup
// Simple health check route to confirm the server is running.
app.get("/api/health", (req, res) => {
  res.json({ message: "Healthcare API is running successfully" });
});

// Auth routes: /api/auth/register and /api/auth/login
app.use("/api/auth", authRoutes);

// Doctor routes: /api/doctors...
app.use("/api/doctors", doctorRoutes);

// Patient routes: /api/patients...
app.use("/api/patients", patientRoutes);

// Appointment routes: /api/appointments...
app.use("/api/appointments", appointmentRoutes);

// Medical record routes: /api/medical-records...
app.use("/api/medical-records", medicalRecordRoutes);

// Prescription routes: /api/prescriptions...
app.use("/api/prescriptions", prescriptionRoutes);

// 5) Server start
// Use PORT from .env, fallback to 5001 if not set.
// (Port 5000 is often already used by macOS AirPlay, so we use 5001.)
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
