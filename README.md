# Healthcare Appointment & Digital Patient Management System

A beginner-friendly full-stack mini-project for first-year B.Tech students.  
Patients can register, find available doctors, and book appointments. Doctors can manage availability, confirm/complete visits, and write medical records and prescriptions. Admins and receptionists can oversee doctors, patients, and appointments.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Setup Instructions](#6-setup-instructions)
7. [Environment Variables](#7-environment-variables)
8. [Database Models](#8-database-models)
9. [API Endpoints](#9-api-endpoints)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Role-wise Access](#11-role-wise-access)
12. [Unique Features](#12-unique-features)
13. [How to Run the Project](#13-how-to-run-the-project)
14. [Demo Credentials](#14-demo-credentials)
15. [Screenshots](#15-screenshots)
16. [Testing](#16-testing)
17. [Security Features](#17-security-features)
18. [Future Scope](#18-future-scope)
19. [Author](#19-author)
20. [License](#20-license)

---

## 1. Project Overview

This system digitizes basic hospital outpatient workflows:

- Patient self-registration and appointment booking
- Doctor availability control and visit status tracking
- Digital medical records and prescriptions
- Role-based access for admin and reception staff

It is intentionally simple: plain JavaScript, React hooks (`useState` / `useEffect`), Express, and MongoDB — no Redux, TypeScript, or WebSockets.

---

## 2. Features

### Patient
- Register and login
- View available doctors
- Book appointments (fixed time slots)
- Cancel own appointments
- View medical records and prescriptions

### Doctor
- Login and view own appointments
- Toggle availability (available / unavailable)
- Confirm and complete appointments (status timeline)
- Create medical records and prescriptions for appointment patients

### Admin
- Add doctors
- View all doctors, patients, appointments
- View all medical records and prescriptions (read-only)
- Summary dashboard

### Receptionist
- View doctors, patients, appointments
- Cannot access medical records or prescriptions modules

---

## 3. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router 7, Axios, Vite |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose 8 |
| Auth | JWT (`jsonwebtoken`), bcryptjs |
| Lint | oxlint |

---

## 4. Architecture

```
Browser (React SPA)
      │  HTTP + JWT Bearer token
      ▼
Express API  (http://localhost:5001/api)
      │  Mongoose
      ▼
MongoDB      (healthcare-app)
```

- Frontend uses one shared Axios instance (`src/api/axios.js`) that attaches `Authorization: Bearer <token>` from `localStorage`.
- Backend protects routes with `authMiddleware` (JWT) then `roleMiddleware` (role whitelist).
- Identity for booking/cancel/status always comes from the JWT — never from the request body.

---

## 5. Folder Structure

```
healthcare-app/
├── backend/
│   ├── config/db.js
│   ├── controllers/          # auth, doctor, patient, appointment, medicalRecord, prescription
│   ├── middleware/           # authMiddleware, roleMiddleware
│   ├── models/               # User, Doctor, Patient, Appointment, MedicalRecord, Prescription
│   ├── routes/               # one router per module
│   ├── .env.example
│   ├── seed.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/axios.js
│   │   ├── components/       # Navbar, ProtectedRoute, AppointmentCard
│   │   ├── pages/            # Login, Register, Dashboard, Doctors, Patients,
│   │   │                     # Appointments, MedicalRecords, Prescriptions
│   │   ├── App.jsx
│   │   └── App.css
│   ├── index.html
│   └── package.json
├── .gitignore
└── README.md
```

---

## 6. Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`)

### Backend

```bash
cd backend
cp .env.example .env    # then edit values if needed
npm install
npm run seed            # creates demo accounts
npm start               # http://localhost:5001
```

### Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

---

## 7. Environment Variables

Create `backend/.env` (never commit this file):

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/healthcare-app
JWT_SECRET=change_this_to_a_long_random_secret
```

| Variable | Purpose |
|----------|---------|
| `PORT` | API server port (default 5001) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign/verify JWTs |

`.env` is listed in `.gitignore`. Only `.env.example` is committed.

---

## 8. Database Models

| Model | Key fields |
|-------|------------|
| **User** | name, email (unique), password (bcrypt hash), role (`admin` / `doctor` / `patient` / `receptionist`) |
| **Doctor** | userId → User, specialization, phone, isAvailable (bool) |
| **Patient** | userId → User, age, gender, phone, address |
| **Appointment** | patientId → Patient, doctorId → Doctor, date, timeSlot, reason, status (`Booked` \| `Confirmed` \| `Completed` \| `Cancelled`) |
| **MedicalRecord** | patientId, doctorId, diagnosis, notes, date |
| **Prescription** | patientId, doctorId, medicines, instructions, date |

Relationships: one User → one Doctor **or** one Patient profile. Appointments, records, and prescriptions reference those profile ids.

---

## 9. API Endpoints

Base URL: `http://localhost:5001/api`

### Auth
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/auth/register` | Public | Register patient (role forced to `patient`) |
| POST | `/auth/login` | Public | Login any role → `{ token, role, userId }` |
| GET | `/auth/me` | Any logged-in | Echo userId + role |
| GET | `/auth/admin-test` | Admin | Role demo endpoint |

### Doctors
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/doctors` | Admin | Add doctor (creates User + Doctor) |
| GET | `/doctors` | Admin, Patient, Receptionist | List all doctors |
| GET | `/doctors/available` | Patient, Admin, Receptionist | Available doctors only |
| PATCH | `/doctors/availability` | Doctor | Toggle own `isAvailable` |
| GET | `/doctors/me` | Doctor | Own profile |

### Patients
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/patients` | Admin, Receptionist | List all patients (no passwords) |
| GET | `/patients/me` | Patient | Own profile |
| GET | `/patients/:id` | Admin, Doctor, Receptionist | Patient by id |

### Appointments
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/appointments` | Patient | Book (patient from JWT) |
| GET | `/appointments/patient` | Patient | Own appointments |
| GET | `/appointments/doctor` | Doctor | Own appointments |
| GET | `/appointments` | Admin, Receptionist | All appointments |
| PATCH | `/appointments/:id/cancel` | Patient | Cancel **own** appointment |
| PATCH | `/appointments/:id/status` | Doctor | Confirm/Complete **assigned** appointment |

### Medical Records
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/medical-records` | Doctor | Create (doctor from JWT) |
| GET | `/medical-records/patient` | Patient | Own records |
| GET | `/medical-records/doctor` | Doctor | Records they created |
| GET | `/medical-records` | Admin | All records |

### Prescriptions
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/prescriptions` | Doctor | Create (doctor from JWT) |
| GET | `/prescriptions/patient` | Patient | Own prescriptions |
| GET | `/prescriptions/doctor` | Doctor | Prescriptions they created |
| GET | `/prescriptions` | Admin | All prescriptions |

### Health
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/health` | Public | API liveness check |

---

## 10. Authentication & Authorization

1. **Login** → server verifies bcrypt password, signs JWT `{ userId, role }` (expires 1d).
2. **Frontend** stores `token`, `role`, `userId` in `localStorage`; Axios interceptor sends `Authorization: Bearer <token>`.
3. **authMiddleware** verifies JWT → sets `req.user`.
4. **roleMiddleware** checks `req.user.role` against the route whitelist → 403 if wrong.
5. Controllers re-resolve profile ids from `req.user.userId` (never trust body ids for identity).

Missing/invalid token → **401**. Wrong role → **403**.

---

## 11. Role-wise Access

| Capability | Patient | Doctor | Admin | Receptionist |
|------------|:-------:|:------:|:-----:|:------------:|
| Book / cancel own appointment | ✓ | | | |
| Confirm / complete appointment | | ✓ | | |
| Toggle availability | | ✓ | | |
| View available doctors | ✓ | | ✓ | ✓ |
| Add doctor | | | ✓ | |
| View all appointments | | | ✓ | ✓ |
| View all patients | | | ✓ | ✓ |
| Create medical record / prescription | | ✓ | | |
| View own records / prescriptions | ✓ | ✓ | | |
| View all records / prescriptions | | | ✓ | |
| Access Records/Prescriptions UI | ✓ | ✓ | ✓ | message only |

Frontend hides links for usability; **backend role middleware is the real security layer**.

---

## 12. Unique Features

### 1. Double-booking prevention
Before creating an appointment, the backend checks for an existing appointment with the same `doctorId + date + timeSlot` where status ≠ `Cancelled`.  
Conflict → **400** `"Doctor is already booked for this time slot"`.  
Cancelled appointments free the slot for rebooking.

### 2. Doctor availability control
Each doctor has `isAvailable`.  
- Doctor toggles it from the Dashboard (`PATCH /doctors/availability`).  
- Booking while unavailable → **400** `"Doctor is currently unavailable"`.  
- Patient booking dropdown uses `GET /doctors/available` (filtered server-side).

### 3. Appointment status timeline
Statuses: `Booked → Confirmed → Completed` (plus final `Cancelled`).  
Invalid jumps (e.g. Booked → Completed) are rejected with **400**.  
The UI shows a visual timeline: `✓ Booked ↓ ✓ Confirmed ↓ ✓ Completed` or `✕ Cancelled`.

---

## 13. How to Run the Project

```bash
# Terminal 1 — MongoDB must already be running
cd healthcare-app/backend
npm install
npm run seed
npm start

# Terminal 2
cd healthcare-app/frontend
npm install
npm run dev
```

Open **http://localhost:5173** and log in with a demo account below.

---

## 14. Demo Credentials

Password for all seed accounts: **`demo123`**

| Role | Email |
|------|-------|
| Admin | `admin@demo.com` |
| Doctor | `doctor@demo.com` |
| Receptionist | `receptionist@demo.com` |
| Patient | `patient@demo.com` |

Extra seed accounts (multi-user demos):

| Role | Email | Notes |
|------|-------|-------|
| Doctor | `doctor2@demo.com` | Second doctor (Dermatology) |
| Patient | `patient2@demo.com` | Second patient |
| Doctor | `drtest@example.com` | Extra doctor (Cardiology) |

Re-seed anytime with `npm run seed` (idempotent — skips existing emails).

---

## 15. Screenshots

Add screenshots of:

1. Login page  
2. Patient dashboard  
3. Doctor availability toggle  
4. Appointment booking + double-booking error  
5. Status timeline (Booked → Confirmed → Completed)  
6. Patients list (admin)  
7. Medical records / prescriptions  

*(Capture from the running app and place images under `docs/screenshots/`.)*

---

## 16. Testing

### Quality gates (verified for this build)
| Check | Command | Result |
|-------|---------|--------|
| Backend syntax | `node --check` on all backend `.js` | Pass |
| Frontend lint | `npx oxlint src` | Exit 0 |
| Frontend build | `npm run build` | Success |

### Manual / browser test matrix (verified)
- **Patient flow:** login → doctors → book → cancel → view records/prescriptions  
- **Doctor flow:** login → availability toggle → confirm/complete → create record + prescription  
- **Admin flow:** login → add doctor → patients → all appointments → all records  
- **Receptionist flow:** login → doctors/patients/appointments; Records/Prescriptions hidden + unavailable-role message  

### Unique feature checks
- Double-booking → 400 + UI error message  
- Unavailable doctor → 400 + filtered list  
- Invalid status transition → 400; valid path Booked→Confirmed→Completed works  

### Security regression (API)
| Case | Expected | Result |
|------|----------|--------|
| No token | 401 | ✓ |
| Patient POST `/doctors` | 403 | ✓ |
| Patient GET all appointments | 403 | ✓ |
| Doctor POST `/appointments` | 403 | ✓ |
| Receptionist POST `/doctors` | 403 | ✓ |
| Patient POST records/prescriptions | 403 | ✓ |
| Receptionist GET records/prescriptions | 403 | ✓ |
| Patient GET `/patients` | 403 | ✓ |
| Cancel another patient’s appointment | 403 | ✓ |
| Patient PATCH status | 403 | ✓ |
| Password fields in API responses | Absent | ✓ |

---

## 17. Security Features

- Passwords hashed with **bcrypt** (never stored/returned in plain text)
- **JWT** authentication with expiry (1 day)
- **Role-based authorization** on every protected route
- **IDOR prevention:** booking/cancel/status/records derive identity from JWT, not body ids
- Patients can cancel **only their own** appointments
- Doctors can update status **only for assigned** appointments
- Public register always forces role `patient`
- `.env` git-ignored; secrets never committed
- API list endpoints use field `select` / explicit mappers — **no password leakage**

---

## 18. Future Scope

- Email / SMS appointment reminders  
- Online payment integration  
- File uploads for reports (PDF/images)  
- Real-time chat between doctor and patient  
- Admin analytics dashboard (charts)  
- Password reset flow  
- Pagination and search for large lists  
- Docker-based one-command deployment  

---

## 19. Author

**Name:** _(your name)_  
**Course:** B.Tech — First Year Mini Project  
**Year:** 2026  

---

## 20. License

This project is released for educational use.  
You may adapt it for coursework and learning.
