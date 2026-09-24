// Appointments page - role-based appointment management.
//
// Patient     -> booking form + own appointments + cancel
// Doctor      -> own appointments + confirm / complete
// Admin       -> all appointments (view only)
// Receptionist-> all appointments (view only)
//
// All data comes from the real backend via the shared Axios instance.

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import AppointmentCard from "../components/AppointmentCard";

// Fixed time slots - patients pick from this list, they cannot type freely
const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];

function Appointments() {
  const role = localStorage.getItem("role");
  const location = useLocation();

  // List state
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Message state - one place for success/error so they never show together
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Booking form state (patient only)
  const [doctors, setDoctors] = useState([]);
  const [booking, setBooking] = useState({
    doctorId: "",
    date: "",
    timeSlot: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // If the patient arrived from the Doctors page, pre-select that doctor
  useEffect(() => {
    if (location.state && location.state.selectedDoctorId) {
      setBooking((prev) => ({
        ...prev,
        doctorId: location.state.selectedDoctorId,
      }));
    }
  }, [location.state]);

  // Load appointments for the current role
  // Patient -> GET /appointments/patient
  // Doctor  -> GET /appointments/doctor
  // Admin / Receptionist -> GET /appointments
  const loadAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      if (role === "patient") {
        response = await api.get("/appointments/patient");
      } else if (role === "doctor") {
        response = await api.get("/appointments/doctor");
      } else {
        response = await api.get("/appointments");
      }
      setAppointments(response.data);
    } catch (err) {
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  // Load available doctors for the booking dropdown (patient only)
  const loadDoctors = async () => {
    try {
      const response = await api.get("/doctors/available");
      setDoctors(response.data);
    } catch (err) {
      // If loading doctors fails, the booking form still works but the
      // dropdown will be empty - show the error near the form.
      setError(err.message || "Failed to load doctors");
    }
  };

  // useEffect: load data when the page first renders
  useEffect(() => {
    loadAppointments();
    if (role === "patient") {
      loadDoctors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear stale success message when the user edits the form again
  const handleFormChange = (e) => {
    setBooking({ ...booking, [e.target.name]: e.target.value });
    if (success) setSuccess("");
    if (error) setError("");
  };

  // Handle booking form submit (patient only)
  // POST /appointments with { doctorId, date, timeSlot, reason }
  // NOTE: patientId is NOT sent - the backend reads it from the JWT.
  const handleBook = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await api.post("/appointments", {
        doctorId: booking.doctorId,
        date: booking.date,
        timeSlot: booking.timeSlot,
        reason: booking.reason,
      });

      // Show backend message, e.g. "Appointment booked successfully"
      setSuccess(response.data.message);

      // Reset the booking form
      setBooking({ doctorId: "", date: "", timeSlot: "", reason: "" });

      // Refresh the appointment list
      loadAppointments();
      // Also refresh available doctors (in case something changed)
      loadDoctors();
    } catch (err) {
      // Backend errors shown here:
      //  - "Doctor is already booked for this time slot"  (double-booking)
      //  - "Doctor is currently unavailable"              (availability)
      setError(err.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  // Called by AppointmentCard after cancel / confirm / complete
  // isError = true shows it as an error, otherwise as success
  const handleCardUpdate = (message, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess("");
    } else {
      setSuccess(message);
      setError("");
    }
    // Reload the list so the card shows the fresh status
    loadAppointments();
  };

  return (
    <div>
      <h1>Appointments</h1>

      {/* Page-level messages */}
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {/* ---------- PATIENT: booking form ---------- */}
      {role === "patient" && (
        <div className="info-card">
          <h3>Book an Appointment</h3>
          <form onSubmit={handleBook} className="booking-form">
            <label>Doctor</label>
            <select
              name="doctorId"
              value={booking.doctorId}
              onChange={handleFormChange}
              required
            >
              <option value="">Select a doctor</option>
              {doctors.map((doc) => (
                <option key={doc.doctorId} value={doc.doctorId}>
                  {doc.name.startsWith("Dr") ? doc.name : `Dr ${doc.name}`} -{" "}
                  {doc.specialization}
                </option>
              ))}
            </select>

            <label>Date</label>
            <input
              type="date"
              name="date"
              value={booking.date}
              onChange={handleFormChange}
              required
            />

            <label>Time Slot</label>
            <select
              name="timeSlot"
              value={booking.timeSlot}
              onChange={handleFormChange}
              required
            >
              <option value="">Select a time</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>

            <label>Reason</label>
            <input
              type="text"
              name="reason"
              placeholder="Reason for visit"
              value={booking.reason}
              onChange={handleFormChange}
              required
            />

            <button type="submit" disabled={submitting}>
              {submitting ? "Booking..." : "Book Appointment"}
            </button>
          </form>
        </div>
      )}

      {/* ---------- Appointment list ---------- */}
      <h2>
        {role === "patient"
          ? "My Appointments"
          : role === "doctor"
          ? "My Appointments"
          : "All Appointments"}
      </h2>

      {loading ? (
        <p className="dash-info">Loading...</p>
      ) : appointments.length === 0 ? (
        <p className="dash-info">No appointments found.</p>
      ) : (
        <div className="appointment-list">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              role={role}
              onUpdate={handleCardUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Appointments;
