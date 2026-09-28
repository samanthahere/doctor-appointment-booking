import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState(false);

  // New slot form
  const [newSlot, setNewSlot] = useState({
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '12:00',
  });

  const [slotMessage, setSlotMessage] = useState({ type: '', text: '' });
  const [apptMessage, setApptMessage] = useState({ type: '', text: '' });

  // Redirect if not doctor
  useEffect(() => {
    if (user && user.role !== 'doctor') {
      navigate('/');
    }
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slotsRes, apptsRes] = await Promise.all([
        api.get('/doctor/slots/my'),
        api.get('/appointments/my'),
      ]);
      setSlots(slotsRes.data);
      setAppointments(apptsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setSavingSlot(true);
    setSlotMessage({ type: '', text: '' });

    try {
      const res = await api.post('/doctor/slots', newSlot);
      setSlotMessage({ type: 'success', text: 'Slot added successfully!' });
      setSlots((prev) => [...prev, res.data.slot]);
      // Reset times slightly
      setNewSlot((prev) => ({ ...prev, start_time: '14:00', end_time: '17:00' }));
    } catch (err) {
      console.error(err);
      setSlotMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add availability slot.',
      });
    } finally {
      setSavingSlot(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Delete this availability slot?')) return;
    try {
      await api.delete(`/doctor/slots/${id}`);
      setSlots((prev) => prev.filter((s) => s.id !== id));
      setSlotMessage({ type: 'success', text: 'Slot removed.' });
    } catch (err) {
      console.error(err);
      setSlotMessage({ type: 'error', text: 'Failed to delete slot.' });
    }
  };

  const handleUpdateApptStatus = async (id, status) => {
    setApptMessage({ type: '', text: '' });
    try {
      const res = await api.put(`/appointments/${id}/status`, { status });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      setApptMessage({ type: 'success', text: `Appointment #${id} marked as ${status}.` });
    } catch (err) {
      console.error(err);
      setApptMessage({ type: 'error', text: 'Failed to update appointment status.' });
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'confirmed':
        return <span className="status-badge status-confirmed">Confirmed</span>;
      case 'pending':
        return <span className="status-badge status-pending">Pending</span>;
      case 'completed':
        return <span className="status-badge status-completed">Completed</span>;
      case 'cancelled':
        return <span className="status-badge status-cancelled">Cancelled</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      {/* Doctor Header Banner */}
      <div className="doctor-dashboard-hero">
        <div className="doctor-hero-content">
          <div className="doctor-hero-avatar">🩺</div>
          <div>
            <h2>Doctor Portal: {user?.name}</h2>
            <p className="hero-specialty">
              <strong>Specialty:</strong> {user?.doctor?.specialty || 'General Practitioner'}
            </p>
            {user?.doctor?.bio && (
              <p className="hero-bio">{user.doctor.bio}</p>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Availability Slots Management */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>⏰ Manage Availability Slots</h3>
            <p className="text-muted text-sm">
              Define recurring consultation hours when patients can book appointments.
            </p>
          </div>

          {slotMessage.text && (
            <div className={`alert alert-${slotMessage.type}`}>
              {slotMessage.text}
            </div>
          )}

          {/* Add Slot Form */}
          <form onSubmit={handleAddSlot} className="add-slot-form">
            <div className="slot-inputs-row">
              <div className="form-group flex-1">
                <label>Day of Week</label>
                <select
                  value={newSlot.day_of_week}
                  onChange={(e) => setNewSlot({ ...newSlot, day_of_week: e.target.value })}
                  className="form-control"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Start Time</label>
                <input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group flex-1">
                <label>End Time</label>
                <input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  required
                  className="form-control"
                />
              </div>

              <div className="slot-submit-container">
                <button
                  type="submit"
                  disabled={savingSlot}
                  className="btn btn-primary"
                >
                  {savingSlot ? 'Adding...' : '+ Add Slot'}
                </button>
              </div>
            </div>
          </form>

          {/* Slots List */}
          <div className="slots-container">
            <h4>Your Active Slots:</h4>
            {loading ? (
              <p>Loading slots...</p>
            ) : slots.length === 0 ? (
              <p className="text-muted">No availability slots added yet. Add one above!</p>
            ) : (
              <div className="slots-grid">
                {slots.map((s) => (
                  <div key={s.id} className="slot-item-card">
                    <div>
                      <strong>{s.day_of_week}</strong>
                      <p className="slot-time-range">
                        {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSlot(s.id)}
                      className="btn-delete-slot"
                      title="Delete Slot"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patient Appointments Management */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>📋 Patient Appointments</h3>
            <p className="text-muted text-sm">
              Review and manage bookings made by patients.
            </p>
          </div>

          {apptMessage.text && (
            <div className={`alert alert-${apptMessage.type}`}>
              {apptMessage.text}
            </div>
          )}

          {loading ? (
            <p>Loading bookings...</p>
          ) : appointments.length === 0 ? (
            <div className="empty-state-sm">
              <p>No booked appointments yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="appointments-table table-compact">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <strong>{appt.patient?.name}</strong>
                        <br />
                        <small className="text-muted">{appt.patient?.email}</small>
                      </td>
                      <td>
                        <strong>{appt.appointment_date}</strong>
                        <br />
                        <small>{appt.appointment_time?.substring(0, 5)}</small>
                      </td>
                      <td>{getStatusBadge(appt.status)}</td>
                      <td className="notes-cell-sm">
                        {appt.notes || <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <div className="action-button-group">
                          {appt.status !== 'confirmed' && appt.status !== 'completed' && appt.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateApptStatus(appt.id, 'confirmed')}
                              className="btn btn-xs btn-success"
                            >
                              Confirm
                            </button>
                          )}
                          {appt.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateApptStatus(appt.id, 'completed')}
                              className="btn btn-xs btn-outline"
                            >
                              Complete
                            </button>
                          )}
                          {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateApptStatus(appt.id, 'cancelled')}
                              className="btn btn-xs btn-danger"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
