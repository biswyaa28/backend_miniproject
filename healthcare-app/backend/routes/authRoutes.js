// Auth routes - connects URL paths to controller functions.

const express = require("express");
const router = express.Router();
const { registerPatient, login } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// POST /api/auth/register  -> register a new patient
router.post("/register", registerPatient);

// POST /api/auth/login     -> login for any role
router.post("/login", login);

// GET /api/auth/me -> protected test route (any logged-in user)
// authMiddleware verifies the JWT and sets req.user
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    message: "You are authenticated",
    userId: req.user.userId,
    role: req.user.role,
  });
});

// GET /api/auth/admin-test -> protected test route (admin only)
// roleMiddleware allows only the "admin" role (others get 403)
router.get(
  "/admin-test",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

module.exports = router;
