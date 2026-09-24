// Seed script - creates demo accounts for the viva/demo.
// Run with: npm run seed
// Safe to run multiple times - it will not create duplicate emails.

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Doctor = require("./models/Doctor");
const Patient = require("./models/Patient");

// Demo password used by all seed accounts (only in this demo script)
const DEMO_PASSWORD = "demo123";

async function seed() {
  try {
    // 1) Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding...");

    // Hash the demo password once
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, salt);

    // 2) Helper: create user only if email does not exist already
    const createUserIfMissing = async (userData) => {
      const exists = await User.findOne({ email: userData.email });
      if (exists) {
        console.log(`Skipped (already exists): ${userData.email}`);
        return exists;
      }
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });
      console.log(`Created user: ${userData.email} (${userData.role})`);
      return user;
    };

    // 3) Admin account
    const admin = await createUserIfMissing({
      name: "Demo Admin",
      email: "admin@demo.com",
      role: "admin",
    });

    // 4) Doctor account + Doctor profile
    const doctorUser = await createUserIfMissing({
      name: "Demo Doctor",
      email: "doctor@demo.com",
      role: "doctor",
    });
    const doctorExists = await Doctor.findOne({ userId: doctorUser._id });
    if (!doctorExists) {
      await Doctor.create({
        userId: doctorUser._id,
        specialization: "General Medicine",
        phone: "9876543210",
        isAvailable: true,
      });
      console.log("Created Doctor profile for doctor@demo.com");
    } else {
      console.log("Skipped Doctor profile (already exists)");
    }

    // 5) Receptionist account
    const receptionist = await createUserIfMissing({
      name: "Demo Receptionist",
      email: "receptionist@demo.com",
      role: "receptionist",
    });

    // 6) Patient account + Patient profile
    const patientUser = await createUserIfMissing({
      name: "Demo Patient",
      email: "patient@demo.com",
      role: "patient",
    });
    const patientExists = await Patient.findOne({ userId: patientUser._id });
    if (!patientExists) {
      await Patient.create({
        userId: patientUser._id,
        age: 25,
        gender: "Male",
        phone: "9876543211",
        address: "123 Demo Street, Demo City",
      });
      console.log("Created Patient profile for patient@demo.com");
    } else {
      console.log("Skipped Patient profile (already exists)");
    }

    // 7) Print demo login credentials for the viva
    console.log("\n========== DEMO LOGIN CREDENTIALS ==========");
    console.log(`Admin       -> admin@demo.com / ${DEMO_PASSWORD}`);
    console.log(`Doctor      -> doctor@demo.com / ${DEMO_PASSWORD}`);
    console.log(`Receptionist-> receptionist@demo.com / ${DEMO_PASSWORD}`);
    console.log(`Patient     -> patient@demo.com / ${DEMO_PASSWORD}`);
    console.log("============================================\n");

    await mongoose.disconnect();
    console.log("Seeding finished. MongoDB disconnected.");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
