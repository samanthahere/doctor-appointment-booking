import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId || '');
  const [doctorDetails, setDoctorDetails] = useState(location.state?.doctor || null);
  const [slots, setSlots] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all doctors for the dropdown if needed
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        setDoctors(res.data);
        if (!selectedDoctorId && res.data.length > 0) {
          setSelectedDoctorId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load doctors', err);
      }
    };
    loadDoctors();
  }, []);

  // Fetch specific doctor details & slots when selectedDoctorId changes
  useEffect(() => {
    if (!selectedDoctorId) return;

    const loadDoctorAndSlots = async () => {
      setLoading(true);
      setError('');
      try {
        const [docRes, slotsRes] = await Promise.all([
          api.get(`/doctors/${selectedDoctorId}`),
          api.get(`/doctors/${selectedDoctorId}/slots`),
        ]);
        setDoctorDetails(docRes.data);
        setSlots(slotsRes.data);
      } catch (err) {
        console.error(err);
        setError('Could not load doctor details or availability schedule.');
      } finally {
        setLoading(false);
      }
    };

    loadDoctorAndSlots();
  }, [selectedDoctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!selectedDoctorId) {
      setError('Please select a doctor.');
      return;
    }

    if (!appointmentDate) {
      setError('Please select an appointment date.');
      return;
    }

    if (!appointmentTime) {
      setError('Please select an appointment time.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        doctor_id: selectedDoctorId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        notes: notes.trim() || undefined,
      };

      const res = await api.post('/appointments', payload);
      setSuccess('Appointment booked successfully! Redirecting to your appointments...');
      setTimeout(() => {
        navigate('/appointments');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Failed to book appointment. Please verify details and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container page-container-narrow">
      <div className="form-card">
        <div className="form-card-header">
          <Link to="/" className="back-link">← Back to Doctors</Link>
          <h1 className="form-title">Schedule an Appointment</h1>
          <p className="form-subtitle">Choose your preferred doctor, date, and consultation time</p>
        </div>

        {!user && (
          <div className="alert alert-info">
            ℹ️ You are not logged in. Please{' '}
            <Link to="/login" state={{ from: location }} className="alert-link">
              Log in
            </Link>{' '}
            or{' '}
            <Link to="/register" className="alert-link">
              Register
            </Link>{' '}
            to complete your booking.
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="booking-form">
          {/* Doctor Selection */}
          <div className="form-group">
            <label htmlFor="doctor_select">Select Specialist *</label>
            <select
              id="doctor_select"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              required
              className="form-control"
            >
              <option value="">-- Choose a doctor --</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.user?.name || 'Doctor'} - {doc.specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Doctor Summary & Slots */}
          {doctorDetails && (
            <div className="doctor-summary-box">
              <div className="doctor-summary-info">
                <h4>{doctorDetails.user?.name}</h4>
                <span className="specialty-badge">{doctorDetails.specialty}</span>
                <p className="summary-bio">{doctorDetails.bio}</p>
              </div>

              <div className="doctor-schedule-box">
                <h5>Doctor's Working Schedule:</h5>
                {slots.length === 0 ? (
                  <p className="text-muted text-sm">General hours (flexible booking available)</p>
                ) : (
                  <div className="schedule-pills">
                    {slots.map((s) => (
                      <span key={s.id} className="schedule-tag">
                        📅 {s.day_of_week}: {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div className="form-group">
            <label htmlFor="appointment_date">Appointment Date *</label>
            <input
              id="appointment_date"
              type="date"
              min={todayStr}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
              className="form-control"
            />
          </div>

          {/* Time Picker */}
          <div className="form-group">
            <label htmlFor="appointment_time">Appointment Time *</label>
            <input
              id="appointment_time"
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              required
              className="form-control"
            />
            <small className="form-hint">E.g., 09:00, 10:30, 14:00</small>
          </div>

          {/* Reason / Notes */}
          <div className="form-group">
            <label htmlFor="notes">Reason for Visit / Symptoms (Optional)</label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your symptoms, reason for consultation, or any existing conditions..."
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !user}
            className="btn btn-primary btn-block btn-lg"
          >
            {submitting ? 'Confirming Booking...' : 'Confirm & Book Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
