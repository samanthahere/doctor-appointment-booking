import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🩺</span>
          <span className="logo-text">MediBook</span>
        </Link>

        <nav className="navbar-links">
          <Link to="/" className="nav-link">Doctors</Link>

          {user ? (
            <>
              {user.role === 'doctor' && (
                <Link to="/doctor-dashboard" className="nav-link nav-highlight">
                  Doctor Dashboard
                </Link>
              )}
              
              <Link to="/appointments" className="nav-link">
                My Appointments
              </Link>

              <div className="nav-user-info">
                <span className="user-badge">
                  {user.name} <span className="role-tag">({user.role})</span>
                </span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth-buttons">
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
