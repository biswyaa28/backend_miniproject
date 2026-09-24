// AppointmentCard - reusable card that shows one appointment.
// Props:
//   appointment - one appointment object from the backend
//   role        - current user role (patient / doctor / admin / receptionist)
//   onUpdate    - callback to refresh the list after an action
//
// It shows appointment info, the status, a simple visual timeline,
// and the action button that fits the current role + status.

import api from "../api/axios";

function AppointmentCard({ appointment, role, onUpdate }) {
  // Read populated fields using the ACTUAL backend response shape:
  //   appointment.doctorId.userId.name
  //   appointment.doctorId.specialization
  //   appointment.patientId.userId.name
  const doctorName = appointment.doctorId?.userId?.name || "Unknown Doctor";
  const specialization = appointment.doctorId?.specialization || "";
  const patientName = appointment.patientId?.userId?.name || "Unknown Patient";
  const status = appointment.status;

  // Format date as DD-MM-YYYY for display (backend stores YYYY-MM-DD)
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // Simple visual timeline for the status lifecycle:
  // Booked -> Confirmed -> Completed  (or Cancelled)
  const renderTimeline = () => {
    if (status === "Cancelled") {
      return (
        <div className="timeline timeline-cancelled">
          <span className="timeline-step cancelled">✕ Cancelled</span>
        </div>
      );
    }

    // Step is "done" if the current status has already passed that step
    const bookedDone = true; // Booked is always the starting point
    const confirmedDone = status === "Confirmed" || status === "Completed";
    const completedDone = status === "Completed";

    return (
      <div className="timeline">
        <span className={`timeline-step ${bookedDone ? "done" : ""}`}>
          {bookedDone ? "✓" : "○"} Booked
        </span>
        <span className="timeline-arrow">↓</span>
        <span className={`timeline-step ${confirmedDone ? "done" : ""}`}>
          {confirmedDone ? "✓" : "○"} Confirmed
        </span>
        <span className="timeline-arrow">↓</span>
        <span className={`timeline-step ${completedDone ? "done" : ""}`}>
          {completedDone ? "✓" : "○"} Completed
        </span>
      </div>
    );
  };

  // Handle Cancel button click (patient only)
  // PATCH /api/appointments/:id/cancel - no patientId sent, backend uses JWT
  const handleCancel = async () => {
    try {
      await api.patch(`/appointments/${appointment._id}/cancel`);
      // Tell the parent page to reload the list
      if (onUpdate) onUpdate("Appointment cancelled successfully");
    } catch (err) {
      if (onUpdate) onUpdate(err.message || "Failed to cancel", true);
    }
  };

  // Handle Confirm / Complete button click (doctor only)
  // PATCH /api/appointments/:id/status with { status: "Confirmed" | "Completed" }
  const handleStatus = async (newStatus) => {
    try {
      await api.patch(`/appointments/${appointment._id}/status`, {
        status: newStatus,
      });
      if (onUpdate) {
        const msg =
          newStatus === "Confirmed"
            ? "Appointment confirmed successfully"
            : "Appointment completed successfully";
        onUpdate(msg);
      }
    } catch (err) {
      if (onUpdate) onUpdate(err.message || "Failed to update status", true);
    }
  };

  // Decide which action button (if any) to show
  const renderAction = () => {
    // Patient: cancel button only for active appointments
    if (role === "patient") {
      if (status === "Booked" || status === "Confirmed") {
        return (
          <button className="btn-cancel" onClick={handleCancel}>
            Cancel Appointment
          </button>
        );
      }
      if (status === "Cancelled") {
        return <p className="cancelled-note">This appointment was cancelled.</p>;
      }
      return null; // Completed - no action
    }

    // Doctor: confirm / complete based on current status
    if (role === "doctor") {
      if (status === "Booked") {
        return (
          <button
            className="btn-confirm"
            onClick={() => handleStatus("Confirmed")}
          >
            Confirm Appointment
          </button>
        );
      }
      if (status === "Confirmed") {
        return (
          <button
            className="btn-complete"
            onClick={() => handleStatus("Completed")}
          >
            Complete Appointment
          </button>
        );
      }
      return null; // Completed or Cancelled - no action
    }

    // Admin / Receptionist: view only, no action buttons
    return null;
  };

  return (
    <div className="appointment-card">
      {/* Patient view focuses on doctor; admin/receptionist/doctor also show patient */}
      <div className="appointment-card-header">
        <div>
          {role === "patient" ? (
            <>
              <p className="appt-name">
                {doctorName.startsWith("Dr")
                  ? doctorName
                  : `Dr ${doctorName}`}
              </p>
              <p className="appt-sub">{specialization}</p>
            </>
          ) : (
            <>
              <p className="appt-name">{patientName}</p>
              <p className="appt-sub">
                {doctorName.startsWith("Dr")
                  ? doctorName
                  : `Dr ${doctorName}`}{" "}
                - {specialization}
              </p>
            </>
          )}
        </div>
        <span className={`appt-status status-${status.toLowerCase()}`}>
          {status}
        </span>
      </div>

      <div className="appointment-card-body">
        <p>
          <strong>Date:</strong> {formatDate(appointment.date)}
        </p>
        <p>
          <strong>Time:</strong> {appointment.timeSlot}
        </p>
        <p>
          <strong>Reason:</strong> {appointment.reason}
        </p>
      </div>

      {renderTimeline()}
      {renderAction()}
    </div>
  );
}

export default AppointmentCard;
