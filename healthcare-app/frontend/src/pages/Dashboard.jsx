// Dashboard - shows a different simple dashboard for each role.
// Role is read from localStorage (saved at login).
// If no valid role exists, redirect to /login.

import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../api/axios";

// ---------- Patient Dashboard (simple action cards, no API yet) ----------
function PatientDashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Welcome, Patient</h2>
      <p className="dash-info">
        You can view doctors, book appointments, cancel appointments, and view
        your medical information.
      </p>

      <div className="action-cards">
        <button className="action-card" onClick={() => navigate("/doctors")}>
          Find Doctors
        </button>
        <button className="action-card" onClick={() => navigate("/appointments")}>
          Book Appointment
        </button>
        <button className="action-card" onClick={() => navigate("/appointments")}>
          My Appointments
        </button>
        <button
          className="action-card"
          onClick={() => navigate("/medical-records")}
        >
          Medical Records
        </button>
        <button
          className="action-card"
          onClick={() => navigate("/prescriptions")}
        >
          Prescriptions
        </button>
      </div>
    </div>
  );
}

// ---------- Doctor Dashboard (real API: profile + availability toggle) ----------
function DoctorDashboard() {
  const navigate = useNavigate();

  // useState: stores the doctor profile, loading flag, error, and success message
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [toggling, setToggling] = useState(false);

  // useEffect: load the doctor profile ONCE when the component first renders
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // GET /api/doctors/me - backend finds the doctor from the JWT
        const response = await api.get("/doctors/me");
        setProfile(response.data);
      } catch (err) {
        setError(err.message || "Failed to load doctor profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Toggle availability - PATCH /api/doctors/availability
  // NOTE: we do NOT send doctorId. The backend uses req.user.userId from JWT.
  const handleToggle = async () => {
    setToggling(true);
    setError("");
    setMessage("");

    try {
      const response = await api.patch("/doctors/availability", {});
      // Update the UI with the fresh value returned by the backend
      setProfile((prev) => ({ ...prev, isAvailable: response.data.isAvailable }));
      // Display the backend notification message
      setMessage(response.data.message);
    } catch (err) {
      setError(err.message || "Failed to change availability");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <p className="dash-info">Loading doctor profile...</p>;
  }

  if (error && !profile) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div>
      <h2>Doctor Dashboard</h2>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      {profile && (
        <div className="info-card">
          <p>
            <strong>Name:</strong> Dr {profile.name}
          </p>
          <p>
            <strong>Specialization:</strong> {profile.specialization}
          </p>
          <p>
            <strong>Phone:</strong> {profile.phone}
          </p>
          <p className="availability-line">
            <strong>Availability:</strong>{" "}
            <span
              className={
                profile.isAvailable ? "status-available" : "status-unavailable"
              }
            >
              {profile.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
            </span>
          </p>

          <button
            className="btn-toggle"
            onClick={handleToggle}
            disabled={toggling}
          >
            {toggling
              ? "Saving..."
              : profile.isAvailable
              ? "Mark Unavailable"
              : "Mark Available"}
          </button>
        </div>
      )}

      <div className="action-cards">
        <button className="action-card" onClick={() => navigate("/appointments")}>
          My Appointments
        </button>
        <button
          className="action-card"
          onClick={() => navigate("/medical-records")}
        >
          Medical Records
        </button>
        <button
          className="action-card"
          onClick={() => navigate("/prescriptions")}
        >
          Prescriptions
        </button>
      </div>
    </div>
  );
}

// ---------- Admin Dashboard (counts from real API) ----------
function AdminDashboard() {
  const navigate = useNavigate();

  // useState: counts + loading/error
  const [counts, setCounts] = useState({ doctors: null, appointments: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // useEffect: load summary counts when the dashboard first renders
  useEffect(() => {
    const loadCounts = async () => {
      try {
        // GET /api/doctors and GET /api/appointments (admin is allowed)
        const [doctorsRes, appointmentsRes] = await Promise.all([
          api.get("/doctors"),
          api.get("/appointments"),
        ]);
        setCounts({
          doctors: doctorsRes.data.length,
          appointments: appointmentsRes.data.length,
        });
      } catch (err) {
        setError(err.message || "Failed to load summary");
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
  }, []);

  return (
    <div>
      <h2>Welcome, Admin</h2>

      {error && <p className="error-message">{error}</p>}

      <div className="action-cards">
        <button className="action-card" onClick={() => navigate("/doctors")}>
          Add Doctor
        </button>
        <button className="action-card" onClick={() => navigate("/doctors")}>
          View Doctors
        </button>
        <button className="action-card" onClick={() => navigate("/appointments")}>
          View All Appointments
        </button>
        <button className="action-card" onClick={() => navigate("/patients")}>
          View All Patients
        </button>
      </div>

      <div className="info-card">
        <h3>Summary</h3>
        {loading ? (
          <p className="dash-info">Loading summary...</p>
        ) : (
          <div className="count-row">
            <div className="count-box">
              <span className="count-number">{counts.doctors}</span>
              <span className="count-label">Total Doctors</span>
            </div>
            <div className="count-box">
              <span className="count-number">{counts.appointments}</span>
              <span className="count-label">Total Appointments</span>
            </div>
          </div>
        )}
      </div>

      <p className="dash-note">
        Patient details are available on the Patients page.
      </p>
    </div>
  );
}

// ---------- Receptionist Dashboard (counts from real API) ----------
function ReceptionistDashboard() {
  const navigate = useNavigate();

  // useState: counts + loading/error
  const [counts, setCounts] = useState({
    patients: null,
    appointments: null,
    doctors: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // useEffect: load summary counts when the dashboard first renders
  useEffect(() => {
    const loadCounts = async () => {
      try {
        // GET /api/patients, /api/appointments, /api/doctors (receptionist is allowed)
        const [patientsRes, appointmentsRes, doctorsRes] = await Promise.all([
          api.get("/patients"),
          api.get("/appointments"),
          api.get("/doctors"),
        ]);
        setCounts({
          patients: patientsRes.data.length,
          appointments: appointmentsRes.data.length,
          doctors: doctorsRes.data.length,
        });
      } catch (err) {
        setError(err.message || "Failed to load summary");
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
  }, []);

  return (
    <div>
      <h2>Welcome, Receptionist</h2>

      {error && <p className="error-message">{error}</p>}

      <div className="action-cards">
        <button className="action-card" onClick={() => navigate("/patients")}>
          View Patients
        </button>
        <button className="action-card" onClick={() => navigate("/appointments")}>
          View Appointments
        </button>
        <button className="action-card" onClick={() => navigate("/doctors")}>
          View Doctors
        </button>
      </div>

      <div className="info-card">
        <h3>Summary</h3>
        {loading ? (
          <p className="dash-info">Loading summary...</p>
        ) : (
          <div className="count-row">
            <div className="count-box">
              <span className="count-number">{counts.patients}</span>
              <span className="count-label">Total Patients</span>
            </div>
            <div className="count-box">
              <span className="count-number">{counts.appointments}</span>
              <span className="count-label">Total Appointments</span>
            </div>
            <div className="count-box">
              <span className="count-number">{counts.doctors}</span>
              <span className="count-label">Total Doctors</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Main Dashboard: pick the right one based on role ----------
function Dashboard() {
  // Read the role saved at login time from localStorage
  const role = localStorage.getItem("role");

  // No token / no role -> send the user to login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard">
      <h1>Healthcare Management System</h1>
      <p className="dashboard-role">Welcome, {role}</p>

      {/* Render only the dashboard for the current role */}
      {role === "patient" && <PatientDashboard />}
      {role === "doctor" && <DoctorDashboard />}
      {role === "admin" && <AdminDashboard />}
      {role === "receptionist" && <ReceptionistDashboard />}

      {/* Unknown role value -> also go to login */}
      {!["patient", "doctor", "admin", "receptionist"].includes(role) && (
        <Navigate to="/login" replace />
      )}
    </div>
  );
}

export default Dashboard;
