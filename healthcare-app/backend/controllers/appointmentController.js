// Appointment controller - handles booking, viewing, cancelling, and status updates.

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// Populate options: bring in names only, never passwords.
const APPOINTMENT_POPULATE = [
  {
    path: "patientId",
    select: "age gender phone address userId",
    populate: { path: "userId", select: "name" },
  },
  {
    path: "doctorId",
    select: "specialization phone isAvailable userId",
    populate: { path: "userId", select: "name" },
  },
];

// 1) Book an appointment - Patient only
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;

    // STEP 1: Validate input
    if (!doctorId || !date || !timeSlot || !reason) {
      return res
        .status(400)
        .json({ message: "doctorId, date, timeSlot and reason are required" });
    }

    // Patient identity comes from the JWT, not the request body.
    // Appointment stores patientId (Patient _id), so look it up first.
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    // STEP 2: Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // STEP 3: Check doctor availability (UNIQUE FEATURE #2)
    if (doctor.isAvailable !== true) {
      return res.status(400).json({ message: "Doctor is currently unavailable" });
    }

    // STEP 4: Double-booking check (UNIQUE FEATURE #1)
    // Cancelled appointments do NOT block the slot.
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      timeSlot,
      status: { $ne: "Cancelled" },
    });
    if (existingAppointment) {
      return res
        .status(400)
        .json({ message: "Doctor is already booked for this time slot" });
    }

    // STEP 5: Create appointment
    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      date,
      timeSlot,
      reason,
      status: "Booked",
    });

    const populated = await appointment.populate(APPOINTMENT_POPULATE);

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: populated,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while booking appointment" });
  }
};

// 2) Get my appointments - Patient only
const getPatientAppointments = async (req, res) => {
  try {
    // Identity from JWT, never from query/body.
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const appointments = await Appointment.find({
      patientId: patient._id,
    }).populate(APPOINTMENT_POPULATE);

    res.status(200).json(appointments);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching appointments" });
  }
};

// 3) Get my appointments - Doctor only
const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointments = await Appointment.find({
      doctorId: doctor._id,
    }).populate(APPOINTMENT_POPULATE);

    res.status(200).json(appointments);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching appointments" });
  }
};

// 4) Get all appointments - Admin, Receptionist
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().populate(
      APPOINTMENT_POPULATE
    );

    res.status(200).json(appointments);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while fetching appointments" });
  }
};

// 5) Cancel appointment - Patient only (own appointments only)
const cancelAppointment = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Ownership check: patient can cancel ONLY their own appointment.
    if (appointment.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        message: "You can only cancel your own appointment",
      });
    }

    if (appointment.status === "Cancelled") {
      return res
        .status(400)
        .json({ message: "Appointment is already cancelled" });
    }

    if (appointment.status === "Completed") {
      return res
        .status(400)
        .json({ message: "Completed appointment cannot be cancelled" });
    }

    appointment.status = "Cancelled";
    await appointment.save();

    res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while cancelling appointment" });
  }
};

// 6) Update appointment status - Doctor only (assigned doctor only)
// Allowed timeline (UNIQUE FEATURE #3): Booked -> Confirmed -> Completed
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only the assigned doctor may update this appointment.
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        message: "You can only update appointments assigned to you",
      });
    }

    // Enforce the status timeline.
    if (status === "Confirmed") {
      if (appointment.status !== "Booked") {
        return res.status(400).json({
          message: `Cannot change status from ${appointment.status} to Confirmed`,
        });
      }
      appointment.status = "Confirmed";
      await appointment.save();
      return res.status(200).json({
        message: "Appointment confirmed successfully",
        appointment,
      });
    }

    if (status === "Completed") {
      if (appointment.status !== "Confirmed") {
        return res.status(400).json({
          message: `Cannot change status from ${appointment.status} to Completed`,
        });
      }
      appointment.status = "Completed";
      await appointment.save();
      return res.status(200).json({
        message: "Appointment completed successfully",
        appointment,
      });
    }

    return res.status(400).json({
      message: "Invalid status. Allowed values are Confirmed or Completed",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while updating appointment status" });
  }
};

module.exports = {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAllAppointments,
  cancelAppointment,
  updateAppointmentStatus,
};
