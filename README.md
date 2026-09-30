# 🩺 Doctor Appointment Booking System

A full-stack web application that lets patients browse doctors, book appointments, and manage their schedule — while doctors can set their availability and manage incoming bookings.

**Live Demo:** [Frontend](https://doctor-booking-frontend-q0tc.onrender.com) | [API](https://doctor-booking-api-86d0.onrender.com)

> ⚠️ Hosted on Render's free tier — the first load after inactivity may take 30–50 seconds while the server wakes up.

---

## ✨ Features

- **Role-based authentication** (Patient / Doctor) using Laravel Sanctum
- **Doctor directory** with specialty-based filtering
- **Appointment booking** with date & time selection
- **Doctor availability management** — doctors set their own weekly slots
- **Appointment management** — view, track status, and cancel appointments
- **RESTful API** built with Laravel, consumed by a React SPA

---

## 🛠️ Tech Stack

**Backend**
- Laravel 12 (PHP)
- PostgreSQL (production) / MySQL (local development)
- Laravel Sanctum (token-based API authentication)
- Deployed via Docker on Render

**Frontend**
- React (Vite)
- React Router
- Axios

---

## 📁 Project Structure

```
doctor-booking-project/
├── backend/          # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   └── Models/
│   ├── database/migrations/
│   ├── routes/api.php
│   └── Dockerfile
└── frontend/          # React SPA
    ├── src/
    │   ├── pages/
    │   └── api.js
    └── vite.config.js
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|--------------|------|
| POST | `/api/register` | Register as patient or doctor | No |
| POST | `/api/login` | Log in | No |
| POST | `/api/logout` | Log out | Yes |
| GET | `/api/doctors` | List approved doctors (filterable by specialty) | Yes |
| GET | `/api/doctors/{id}/slots` | Get a doctor's availability | Yes |
| POST | `/api/doctor/slots` | Add an availability slot (doctor only) | Yes |
| POST | `/api/appointments` | Book an appointment | Yes |
| GET | `/api/appointments/my` | Get own appointments (patient or doctor) | Yes |
| PUT | `/api/appointments/{id}/cancel` | Cancel an appointment | Yes |

---

## 🚀 Running Locally

### Prerequisites
- PHP 8.2+, Composer
- Node.js, npm
- MySQL

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Update .env with your local MySQL credentials
php artisan migrate
php artisan serve
```

Backend runs at `http://127.0.0.1:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 📌 Database Schema (simplified)

- **users** — id, name, email, password, role (patient/doctor/admin)
- **doctors** — id, user_id, specialty, bio, is_approved
- **availability_slots** — id, doctor_id, day_of_week, start_time, end_time
- **appointments** — id, patient_id, doctor_id, appointment_date, appointment_time, status, notes

---

## 🔮 Future Improvements

- Email notifications for booking confirmations and reminders
- Admin panel for doctor approval
- Doctor ratings and reviews
- Payment integration

---

## 👤 Author

Built by [Samantha] as a portfolio project.
