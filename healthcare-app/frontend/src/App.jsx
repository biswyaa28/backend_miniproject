// App.jsx is the root component of the frontend.
// It defines which page shows for which URL using React Router.

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import Prescriptions from "./pages/Prescriptions";
import Patients from "./pages/Patients";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

// Layout for pages that need the Navbar (i.e. logged-in pages)
function WithNav({ children }) {
  return (
    <>
      <Navbar />
      <div className="container">{children}</div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* "/" redirects to the dashboard (ProtectedRoute sends you to /login if needed) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public pages - no Navbar needed */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected pages - require a token, show the Navbar */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <WithNav>
                <Dashboard />
              </WithNav>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <WithNav>
                <Doctors />
              </WithNav>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <WithNav>
                <Patients />
              </WithNav>
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <WithNav>
                <Appointments />
              </WithNav>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-records"
          element={
            <ProtectedRoute>
              <WithNav>
                <MedicalRecords />
              </WithNav>
            </ProtectedRoute>
          }
        />
        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute>
              <WithNav>
                <Prescriptions />
              </WithNav>
            </ProtectedRoute>
          }
        />

        {/* Any unknown URL goes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
