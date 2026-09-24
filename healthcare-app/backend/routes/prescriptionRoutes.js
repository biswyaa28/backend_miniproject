// Prescription routes - connects URL paths to prescription controller functions.

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getAllPrescriptions,
} = require("../controllers/prescriptionController");

// POST /api/prescriptions -> Doctor only
router.post(
  "/",
  authMiddleware,
  roleMiddleware("doctor"),
  createPrescription
);

// GET /api/prescriptions/patient -> Patient only
router.get(
  "/patient",
  authMiddleware,
  roleMiddleware("patient"),
  getPatientPrescriptions
);

// GET /api/prescriptions/doctor -> Doctor only
router.get(
  "/doctor",
  authMiddleware,
  roleMiddleware("doctor"),
  getDoctorPrescriptions
);

// GET /api/prescriptions -> Admin only
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getAllPrescriptions
);

module.exports = router;
