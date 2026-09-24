// Patient routes - connects URL paths to patient controller functions.

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getAllPatients,
  getMyPatientProfile,
  getPatientById,
} = require("../controllers/patientController");

// GET /api/patients -> Admin, Receptionist
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "receptionist"]),
  getAllPatients
);

// GET /api/patients/me -> Patient only
// (declared before /:id so "me" is not treated as an id)
router.get(
  "/me",
  authMiddleware,
  roleMiddleware("patient"),
  getMyPatientProfile
);

// GET /api/patients/:id -> Admin, Doctor, Receptionist
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "doctor", "receptionist"]),
  getPatientById
);

module.exports = router;
