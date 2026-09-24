// Medical Record routes - connects URL paths to medical record controller functions.

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  createMedicalRecord,
  getPatientMedicalRecords,
  getDoctorMedicalRecords,
  getAllMedicalRecords,
} = require("../controllers/medicalRecordController");

// POST /api/medical-records -> Doctor only
router.post(
  "/",
  authMiddleware,
  roleMiddleware("doctor"),
  createMedicalRecord
);

// GET /api/medical-records/patient -> Patient only
router.get(
  "/patient",
  authMiddleware,
  roleMiddleware("patient"),
  getPatientMedicalRecords
);

// GET /api/medical-records/doctor -> Doctor only
router.get(
  "/doctor",
  authMiddleware,
  roleMiddleware("doctor"),
  getDoctorMedicalRecords
);

// GET /api/medical-records -> Admin only
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getAllMedicalRecords
);

module.exports = router;
