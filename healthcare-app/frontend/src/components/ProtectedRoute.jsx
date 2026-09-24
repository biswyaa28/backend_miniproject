// ProtectedRoute wraps pages that only logged-in users should see.
// If no token exists in localStorage, redirect to /login.
// If a token exists, render the page.
// NOTE: the backend is still the real security layer - hiding a
// React route is only a nicer user experience, not real protection.

import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // No token -> send the user to the login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token exists -> show the requested page
  return children;
}

export default ProtectedRoute;
