import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const MyAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/my');
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load your appointments.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    setActionLoading(id);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put(`/appointments/${id}/cancel`);
      setMessage({ type: 'success', text: res.data.message || 'Appointment cancelled.' });
      // Update locally
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: 'cancelled' } : app))
      );
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Could not cancel appointment.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setActionLoading(id);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put(`/appointments/${id}/status`, { status: newStatus });
      setMessage({ type: 'success', text: res.data.message || 'Status updated.' });
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update status.',
      });
    } finally {
      setActionLoading(null);
    }
  };

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

  const isDoctor = user?.role === 'doctor';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isDoctor ? 'Doctor Schedule & Booked Appointments' : 'My Appointments'}
          </h1>
          <p className="page-subtitle">
            {isDoctor
              ? 'View all consultations scheduled with your patients'
              : 'Review your upcoming and past doctor appointments'}
          </p>
        </div>

        {!isDoctor && (
          <Link to="/" className="btn btn-primary">
            + Book New Appointment
          </Link>
        )}
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Fetching appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <h3>No appointments scheduled</h3>
          <p>
            {isDoctor
              ? 'No patients have booked appointments with you yet.'
              : 'You have not booked any appointments yet.'}
          </p>
          {!isDoctor && (
            <Link to="/" className="btn btn-primary">
              Browse Doctors Now
            </Link>
          )}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{isDoctor ? 'Patient' : 'Doctor & Specialty'}</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => {
                const canCancel = appt.status === 'pending' || appt.status === 'confirmed';
                return (
                  <tr key={appt.id}>
                    <td>#{appt.id}</td>
                    <td>
                      {isDoctor ? (
                        <div className="person-cell">
                          <strong>{appt.patient?.name || 'Patient'}</strong>
                          <small className="text-muted">{appt.patient?.email}</small>
                        </div>
                      ) : (
                        <div className="person-cell">
                          <strong>{appt.doctor?.user?.name || 'Doctor'}</strong>
                          <span className="specialty-subtag">
                            {appt.doctor?.specialty || 'General'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{appt.appointment_date}</strong>
                    </td>
                    <td>{appt.appointment_time?.substring(0, 5)}</td>
                    <td>{getStatusBadge(appt.status)}</td>
                    <td className="notes-cell">
                      {appt.notes ? appt.notes : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {/* Doctor controls: confirm / complete */}
                        {isDoctor && appt.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'confirmed')}
                            disabled={actionLoading === appt.id}
                            className="btn btn-outline btn-xs btn-success"
                          >
                            Confirm
                          </button>
                        )}

                        {isDoctor && appt.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'completed')}
                            disabled={actionLoading === appt.id}
                            className="btn btn-outline btn-xs"
                          >
                            Complete
                          </button>
                        )}

                        {/* Cancel button */}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(appt.id)}
                            disabled={actionLoading === appt.id}
                            className="btn btn-danger btn-xs"
                          >
                            {actionLoading === appt.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}

                        {!canCancel && (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
