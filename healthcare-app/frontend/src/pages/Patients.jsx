// Patients page - lists all registered patients for admin and receptionist.
// GET /api/patients is allowed only for admin and receptionist on the backend.

import { useEffect, useState } from "react";
import api from "../api/axios";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await api.get("/patients");
        setPatients(response.data);
      } catch (err) {
        setError(err.message || "Failed to load patients");
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  if (loading) {
    return <p className="dash-info">Loading patients...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (patients.length === 0) {
    return <p className="dash-info">No patients found.</p>;
  }

  return (
    <div>
      <h2>All Patients</h2>

      <div className="record-list">
        {patients.map((patient) => (
          <div className="record-card" key={patient.patientId}>
            <div className="record-card-body">
              <p>
                <strong>Name:</strong> {patient.name}
              </p>
              <p>
                <strong>Age:</strong> {patient.age}
              </p>
              <p>
                <strong>Gender:</strong> {patient.gender}
              </p>
              <p>
                <strong>Phone:</strong> {patient.phone}
              </p>
              <p>
                <strong>Address:</strong> {patient.address}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Patients;
