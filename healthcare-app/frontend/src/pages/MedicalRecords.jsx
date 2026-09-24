// Medical Records page - role-based medical record management.
//
// Patient     -> view own medical records
// Doctor      -> view own records + create new record for appointment patients
// Admin       -> view all medical records (read only)
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

function MedicalRecords() {
  const role = localStorage.getItem("role");

  // List state
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create form state (doctor only)
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patientId: "",
    diagnosis: "",
    notes: "",
    date: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Receptionist has no backend access to this module
  const isReceptionist = role === "receptionist";
  const isDoctor = role === "doctor";

  // Load records for the current role
  // Patient -> GET /medical-records/patient
  // Doctor  -> GET /medical-records/doctor
  // Admin   -> GET /medical-records
  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      if (role === "patient") {
        response = await api.get("/medical-records/patient");
      } else if (role === "doctor") {
        response = await api.get("/medical-records/doctor");
      } else if (role === "admin") {
        response = await api.get("/medical-records");
      } else {
        // Receptionist (or unknown role) - no API call
        setRecords([]);
        setLoading(false);
        return;
      }
      setRecords(response.data);
    } catch (err) {
      setError(err.message || "Failed to load medical records");
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
    loadRecords();
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
  // POST /medical-records with { patientId, diagnosis, notes, date }
  // NOTE: doctorId is NOT sent - backend reads it from the JWT.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side convenience validation (backend is the final validator)
    if (!form.patientId || !form.diagnosis || !form.notes || !form.date) {
      setError("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/medical-records", {
        patientId: form.patientId,
        diagnosis: form.diagnosis,
        notes: form.notes,
        date: form.date,
      });

      // Show backend message, e.g. "Medical record created successfully"
      setSuccess(response.data.message);

      // Clear the form
      setForm({ patientId: "", diagnosis: "", notes: "", date: "" });

      // Refresh the records list
      loadRecords();
    } catch (err) {
      setError(err.message || "Unable to create medical record");
    } finally {
      setSubmitting(false);
    }
  };

  // Receptionist: no backend access - show simple message
  if (isReceptionist) {
    return (
      <div>
        <h1>Medical Records</h1>
        <p className="dash-info">This module is not available for your role.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Medical Records</h1>

      {/* Page-level messages */}
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {/* Doctor: create medical record form */}
      {isDoctor && (
        <div className="info-card">
          <h3>Create Medical Record</h3>
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

            <label>Diagnosis</label>
            <input
              type="text"
              name="diagnosis"
              placeholder="Diagnosis"
              value={form.diagnosis}
              onChange={handleChange}
              required
            />

            <label>Notes</label>
            <textarea
              name="notes"
              placeholder="Notes"
              value={form.notes}
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
              {submitting ? "Saving..." : "Create Medical Record"}
            </button>
          </form>
        </div>
      )}

      {/* List heading */}
      <h2>
        {role === "patient"
          ? "My Medical Records"
          : role === "doctor"
          ? "My Medical Records"
          : "All Medical Records"}
      </h2>

      {/* Records list */}
      {loading ? (
        <p className="dash-info">Loading...</p>
      ) : records.length === 0 ? (
        <p className="dash-info">No medical records found.</p>
      ) : (
        <div className="record-list">
          {records.map((record) => {
            const doctorName = formatDoctorName(
              record.doctorId?.userId?.name
            );
            const specialization = record.doctorId?.specialization || "";
            const patientName =
              record.patientId?.userId?.name || "Unknown Patient";

            return (
              <div className="record-card" key={record._id}>
                <p className="appt-name">Medical Record</p>

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
                <p className="appt-sub">Date: {formatDate(record.date)}</p>

                <div className="record-card-body">
                  <p>
                    <strong>Diagnosis:</strong>
                  </p>
                  <p>{record.diagnosis}</p>
                  <p>
                    <strong>Notes:</strong>
                  </p>
                  <p>{record.notes}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MedicalRecords;
