// Doctor routes - connects URL paths to doctor controller functions.

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  addDoctor,
  getAllDoctors,
  getAvailableDoctors,
  toggleAvailability,
  getMyDoctorProfile,
} = require("../controllers/doctorController");

// POST /api/doctors -> Admin only
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  addDoctor
);

// GET /api/doctors -> Admin, Patient, Receptionist
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "patient", "receptionist"]),
  getAllDoctors
);

// GET /api/doctors/available -> Patient, Admin, Receptionist
// (must be declared before other GET /:id style routes if added later)
router.get(
  "/available",
  authMiddleware,
  roleMiddleware(["patient", "admin", "receptionist"]),
  getAvailableDoctors
);

// PATCH /api/doctors/availability -> Doctor only
router.patch(
  "/availability",
  authMiddleware,
  roleMiddleware("doctor"),
  toggleAvailability
);

// GET /api/doctors/me -> Doctor only
router.get(
  "/me",
  authMiddleware,
  roleMiddleware("doctor"),
  getMyDoctorProfile
);

module.exports = router;
