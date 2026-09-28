import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctorSlots, setSelectedDoctorSlots] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const { user } = useAuth();

  const fetchDoctors = async (specialty = '') => {
    setLoading(true);
    setError('');
    try {
      const url = specialty ? `/doctors?specialty=${encodeURIComponent(specialty)}` : '/doctors';
      const res = await api.get(url);
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load doctors list. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors(specialtyFilter);
  }, [specialtyFilter]);

  const handleViewSlots = async (doctorId) => {
    if (selectedDoctorSlots?.doctorId === doctorId) {
      setSelectedDoctorSlots(null);
      return;
    }
    setSlotsLoading(true);
    try {
      const res = await api.get(`/doctors/${doctorId}/slots`);
      setSelectedDoctorSlots({ doctorId, slots: res.data });
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const specialties = [
    'All Specialties',
    'Cardiology',
    'Dermatology',
    'General Medicine',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Ophthalmology',
    'Dentistry',
    'ENT Specialist',
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Find & Book a Doctor</h1>
          <p className="page-subtitle">
            Browse verified healthcare specialists and book an appointment online
          </p>
        </div>

        <div className="filter-box">
          <label htmlFor="filter-specialty" className="filter-label">Filter by Specialty:</label>
          <select
            id="filter-specialty"
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value === 'All Specialties' ? '' : e.target.value)}
            className="filter-select"
          >
            {specialties.map((spec) => (
              <option key={spec} value={spec === 'All Specialties' ? '' : spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading available doctors...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>No doctors found</h3>
          <p>
            {specialtyFilter
              ? `No approved doctors found in "${specialtyFilter}". Try selecting a different specialty.`
              : 'There are no doctors registered yet. Register as a doctor to test!'}
          </p>
          {specialtyFilter && (
            <button onClick={() => setSpecialtyFilter('')} className="btn btn-secondary">
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <div className="doctor-grid">
          {doctors.map((doctor) => {
            const isSlotsOpen = selectedDoctorSlots?.doctorId === doctor.id;
            return (
              <div key={doctor.id} className="doctor-card">
                <div className="doctor-card-header">
                  <div className="doctor-avatar">👨‍⚕️</div>
                  <div className="doctor-meta">
                    <h3 className="doctor-name">{doctor.user?.name || 'Doctor'}</h3>
                    <span className="specialty-badge">{doctor.specialty}</span>
                  </div>
                </div>

                <div className="doctor-card-body">
                  <p className="doctor-bio">
                    {doctor.bio || 'Experienced medical professional dedicated to providing compassionate patient care.'}
                  </p>
                  <p className="doctor-contact">
                    📧 {doctor.user?.email}
                  </p>

                  {isSlotsOpen && (
                    <div className="slots-panel">
                      <h4 className="slots-title">Available Consultation Slots:</h4>
                      {slotsLoading ? (
                        <p className="text-muted">Loading schedule...</p>
                      ) : selectedDoctorSlots.slots.length === 0 ? (
                        <p className="text-muted">No specific recurring slots posted yet. You can still request an appointment.</p>
                      ) : (
                        <ul className="slots-list">
                          {selectedDoctorSlots.slots.map((slot) => (
                            <li key={slot.id} className="slot-pill">
                              <span className="slot-day">{slot.day_of_week}:</span>{' '}
                              <span className="slot-time">
                                {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="doctor-card-footer">
                  <button
                    onClick={() => handleViewSlots(doctor.id)}
                    className="btn btn-outline btn-sm"
                  >
                    {isSlotsOpen ? 'Hide Schedule' : 'View Schedule'}
                  </button>

                  <Link
                    to={`/book/${doctor.id}`}
                    state={{ doctor }}
                    className="btn btn-primary btn-sm"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorList;
