// Doctors page - shows different content based on the logged-in role.
//
// Patient     -> available doctors only + Book Appointment button
// Admin       -> all doctors + Add Doctor form
// Receptionist-> all doctors (view only)
// Doctor      -> simple message pointing to the Dashboard

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Doctors() {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  // Shared state
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add Doctor form state (admin only)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    phone: "",
  });
  const [adding, setAdding] = useState(false);

  // Load the doctor list based on role
  // Patient  -> GET /doctors/available (backend filters isAvailable === true)
  // Admin/Receptionist -> GET /doctors (all doctors)
  const loadDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      if (role === "patient") {
        response = await api.get("/doctors/available");
      } else {
        response = await api.get("/doctors");
      }
      setDoctors(response.data);
    } catch (err) {
      setError(err.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  // useEffect: load doctors when the page first renders
  useEffect(() => {
    if (role === "doctor") {
      setLoading(false);
      return;
    }
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle input changes in the Add Doctor form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle Add Doctor form submit (admin only)
  // POST /doctors - role is forced to "doctor" by the backend
  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setAdding(true);

    try {
      const response = await api.post("/doctors", form);
      setSuccess(response.data.message || "Doctor added successfully");
      // Clear the form
      setForm({
        name: "",
        email: "",
        password: "",
        specialization: "",
        phone: "",
      });
      // Refresh the doctor list so the new doctor appears
      loadDoctors();
    } catch (err) {
      // e.g. duplicate email -> "Email already registered"
      setError(err.message || "Failed to add doctor");
    } finally {
      setAdding(false);
    }
  };

  // Patient clicks Book Appointment -> go to appointments page
  const handleBook = (doctor) => {
    // Pass the selected doctor via navigation state so the booking form
    // can pre-select this doctor on the Appointments page.
    navigate("/appointments", { state: { selectedDoctorId: doctor.doctorId } });
  };

  // Doctor role: simple message
  if (role === "doctor") {
    return (
      <div>
        <h1>Doctors</h1>
        <p className="dash-info">
          Your doctor profile and availability are available on the Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Doctors</h1>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {/* Admin: Add Doctor form */}
      {role === "admin" && (
        <div className="info-card">
          <h3>Add Doctor</h3>
          <form onSubmit={handleAdd} className="inline-form">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="specialization"
              placeholder="Specialization"
              value={form.specialization}
              onChange={handleChange}
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
            />
            <button type="submit" disabled={adding}>
              {adding ? "Adding..." : "Add Doctor"}
            </button>
          </form>
        </div>
      )}

      {/* Doctor list */}
      {loading ? (
        <p className="dash-info">Loading...</p>
      ) : doctors.length === 0 ? (
        <p className="dash-info">No doctors found.</p>
      ) : (
        <div className="doctor-list">
          {doctors.map((doc) => (
            <div className="doctor-card" key={doc.doctorId}>
              <p className="appt-name">
                {doc.name.startsWith("Dr") ? doc.name : `Dr ${doc.name}`}
              </p>
              <p className="appt-sub">{doc.specialization}</p>
              <p>
                <strong>Phone:</strong> {doc.phone}
              </p>
              <p className="availability-line">
                <strong>Status:</strong>{" "}
                <span
                  className={
                    doc.isAvailable ? "status-available" : "status-unavailable"
                  }
                >
                  {doc.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                </span>
              </p>

              {/* Patient sees Book Appointment for available doctors */}
              {role === "patient" && (
                <button
                  className="action-card btn-book"
                  onClick={() => handleBook(doc)}
                >
                  Book Appointment
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Doctors;
