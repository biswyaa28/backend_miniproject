// Prescriptions page - role-based prescription management.
//
// Patient     -> view own prescriptions
// Doctor      -> view own prescriptions + create new for appointment patients
// Admin       -> view all prescriptions (read only)
// Receptionist-> no backend access; show unavailable-role message
//
// Doctor patient dropdown is derived from GET /appointments/doctor
// (no GET /api/patients - doctors do not have access to that endpoint).

import { useEffect, useState } from "react";
import api from "../api/axios";

// Format YYYY-MM-DD -> DD-MM-YYYY for display
function formatDate(dateString) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Avoid double "Dr" prefix
function formatDoctorName(name) {
  if (!name) return "Unknown Doctor";
  return name.startsWith("Dr") ? name : `Dr ${name}`;
}

function Prescriptions() {
  const role = localStorage.getItem("role");

  // List state
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create form state (doctor only)
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patientId: "",
    medicines: "",
    instructions: "",
    date: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const isReceptionist = role === "receptionist";
  const isDoctor = role === "doctor";

  // Load prescriptions for the current role
  // Patient -> GET /prescriptions/patient
  // Doctor  -> GET /prescriptions/doctor
  // Admin   -> GET /prescriptions
  const loadPrescriptions = async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      if (role === "patient") {
        response = await api.get("/prescriptions/patient");
      } else if (role === "doctor") {
        response = await api.get("/prescriptions/doctor");
      } else if (role === "admin") {
        response = await api.get("/prescriptions");
      } else {
        // Receptionist (or unknown role) - no API call
        setPrescriptions([]);
        setLoading(false);
        return;
      }
      setPrescriptions(response.data);
    } catch (err) {
      setError(err.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  // Doctor only: build unique patient list from own appointments
  // GET /appointments/doctor -> appointment.patientId._id + appointment.patientId.userId.name
  const loadPatients = async () => {
    try {
      const response = await api.get("/appointments/doctor");
      const appointments = response.data;
      const seen = {};
      const uniquePatients = [];
      for (const appointment of appointments) {
        const patient = appointment.patientId;
        if (patient && patient._id && !seen[patient._id]) {
          seen[patient._id] = true;
          uniquePatients.push({
            patientId: patient._id,
            patientName: patient.userId?.name || "Unknown Patient",
          });
        }
      }
      setPatients(uniquePatients);
    } catch (err) {
      setError(err.message || "Failed to load patients");
    }
  };

  // useEffect: load data when the page first renders
  useEffect(() => {
    loadPrescriptions();
    if (isDoctor) {
      loadPatients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (success) setSuccess("");
    if (error) setError("");
  };

  // Handle create form submit (doctor only)
  // POST /prescriptions with { patientId, medicines, instructions, date }
  // NOTE: doctorId is NOT sent - backend reads it from the JWT.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side convenience validation (backend is the final validator)
    if (
      !form.patientId ||
      !form.medicines ||
      !form.instructions ||
      !form.date
    ) {
      setError("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/prescriptions", {
        patientId: form.patientId,
        medicines: form.medicines,
        instructions: form.instructions,
        date: form.date,
      });

      // Show backend message, e.g. "Prescription created successfully"
      setSuccess(response.data.message);

      // Clear the form
      setForm({ patientId: "", medicines: "", instructions: "", date: "" });

      // Refresh the prescriptions list
      loadPrescriptions();
    } catch (err) {
      setError(err.message || "Unable to create prescription");
    } finally {
      setSubmitting(false);
    }
  };

  // Receptionist: no backend access - show simple message
  if (isReceptionist) {
    return (
      <div>
        <h1>Prescriptions</h1>
        <p className="dash-info">This module is not available for your role.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Prescriptions</h1>

      {/* Page-level messages */}
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {/* Doctor: create prescription form */}
      {isDoctor && (
        <div className="info-card">
          <h3>Create Prescription</h3>
          <form onSubmit={handleSubmit} className="booking-form">
            <label>Patient</label>
            <select
              name="patientId"
              value={form.patientId}
              onChange={handleChange}
              required
            >
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.patientId} value={patient.patientId}>
                  {patient.patientName}
                </option>
              ))}
            </select>

            <label>Medicines</label>
            <textarea
              name="medicines"
              placeholder="Medicines"
              value={form.medicines}
              onChange={handleChange}
              rows={3}
              required
            />

            <label>Instructions</label>
            <textarea
              name="instructions"
              placeholder="Instructions"
              value={form.instructions}
              onChange={handleChange}
              rows={3}
              required
            />

            <label>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />

            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Create Prescription"}
            </button>
          </form>
        </div>
      )}

      {/* List heading */}
      <h2>
        {role === "patient"
          ? "My Prescriptions"
          : role === "doctor"
          ? "My Prescriptions"
          : "All Prescriptions"}
      </h2>

      {/* Prescriptions list */}
      {loading ? (
        <p className="dash-info">Loading...</p>
      ) : prescriptions.length === 0 ? (
        <p className="dash-info">No prescriptions found.</p>
      ) : (
        <div className="record-list">
          {prescriptions.map((prescription) => {
            const doctorName = formatDoctorName(
              prescription.doctorId?.userId?.name
            );
            const specialization =
              prescription.doctorId?.specialization || "";
            const patientName =
              prescription.patientId?.userId?.name || "Unknown Patient";

            return (
              <div className="record-card" key={prescription._id}>
                <p className="appt-name">Prescription</p>

                {/* Admin sees patient + doctor; patient/doctor focus on doctor info */}
                {role === "admin" && (
                  <>
                    <p className="appt-sub">Patient: {patientName}</p>
                    <p className="appt-sub">Doctor: {doctorName}</p>
                  </>
                )}
                {role !== "admin" && (
                  <p className="appt-sub">Doctor: {doctorName}</p>
                )}

                {specialization && (
                  <p className="appt-sub">Specialization: {specialization}</p>
                )}
                <p className="appt-sub">Date: {formatDate(prescription.date)}</p>

                <div className="record-card-body">
                  <p>
                    <strong>Medicines:</strong>
                  </p>
                  <p>{prescription.medicines}</p>
                  <p>
                    <strong>Instructions:</strong>
                  </p>
                  <p>{prescription.instructions}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Prescriptions;
