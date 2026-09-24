// Role middleware - checks whether the logged-in user's role is allowed.
// Usage: roleMiddleware("admin") or roleMiddleware(["admin", "doctor"])

const roleMiddleware = (allowedRoles) => {
  // Allow a single role string OR an array of roles
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    // authMiddleware must run first, so req.user exists
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Allow only if the user's role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: you do not have permission for this action",
      });
    }

    // Role is allowed - continue
    next();
  };
};

module.exports = roleMiddleware;
