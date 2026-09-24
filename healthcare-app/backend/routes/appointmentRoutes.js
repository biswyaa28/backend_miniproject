// Appointment routes - connects URL paths to appointment controller functions.

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAllAppointments,
  cancelAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");

// POST /api/appointments -> Patient only
router.post(
  "/",
  authMiddleware,
  roleMiddleware("patient"),
  bookAppointment
);

// GET /api/appointments/patient -> Patient only
router.get(
  "/patient",
  authMiddleware,
  roleMiddleware("patient"),
  getPatientAppointments
);

// GET /api/appointments/doctor -> Doctor only
router.get(
  "/doctor",
  authMiddleware,
  roleMiddleware("doctor"),
  getDoctorAppointments
);

// GET /api/appointments -> Admin, Receptionist
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "receptionist"]),
  getAllAppointments
);

// PATCH /api/appointments/:id/cancel -> Patient only
router.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("patient"),
  cancelAppointment
);

// PATCH /api/appointments/:id/status -> Doctor only
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("doctor"),
  updateAppointmentStatus
);

module.exports = router;
