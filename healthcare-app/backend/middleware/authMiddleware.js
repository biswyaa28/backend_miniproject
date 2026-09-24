// Auth middleware - checks that the request has a valid JWT.
// Place this before any protected route.

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // 1) Read the Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  // 2) Extract the token (remove "Bearer " prefix)
  const token = authHeader.split(" ")[1];

  try {
    // 3) Verify the token using the same secret used at login
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4) Attach decoded info (userId, role) to the request
    req.user = decoded;

    // 5) Continue to the next middleware/route
    next();
  } catch (error) {
    // 6) Token is missing, expired, or tampered with
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
