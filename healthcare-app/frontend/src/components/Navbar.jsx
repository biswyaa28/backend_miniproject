// Navbar shows the app title, navigation links, current role, and Logout.
// Links are role-aware for a cleaner UX, but remember:
// the backend roleMiddleware is still the real security layer.
// Hiding a link is NOT security - it only improves usability.

import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  // Logout: remove all auth data from localStorage, then go to /login
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // Role-aware links: each role only sees the pages that make sense for them
  let links = [{ to: "/dashboard", label: "Dashboard" }];

  if (role === "patient") {
    links = links.concat([
      { to: "/doctors", label: "Doctors" },
      { to: "/appointments", label: "Appointments" },
      { to: "/medical-records", label: "Medical Records" },
      { to: "/prescriptions", label: "Prescriptions" },
    ]);
  } else if (role === "doctor") {
    links = links.concat([
      { to: "/appointments", label: "Appointments" },
      { to: "/medical-records", label: "Medical Records" },
      { to: "/prescriptions", label: "Prescriptions" },
    ]);
  } else if (role === "admin") {
    links = links.concat([
      { to: "/doctors", label: "Doctors" },
      { to: "/patients", label: "Patients" },
      { to: "/appointments", label: "Appointments" },
      { to: "/medical-records", label: "Medical Records" },
      { to: "/prescriptions", label: "Prescriptions" },
    ]);
  } else if (role === "receptionist") {
    links = links.concat([
      { to: "/doctors", label: "Doctors" },
      { to: "/patients", label: "Patients" },
      { to: "/appointments", label: "Appointments" },
    ]);
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">Healthcare Management System</div>

      <div className="navbar-links">
        {links.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="navbar-right">
        {role && <span className="role-badge">Role: {role}</span>}
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
