import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../dash.css';

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-logo">
        <h2><span className="studio-text">Studio</span> <span className="studio-number">21</span></h2>
      </div>
      <div className="sidebar-menu">
        <div 
          className={`nav-item ${isActiveRoute('/dashboard') ? 'active' : ''}`}
          onClick={() => handleNavigation('/dashboard')}
        >
          <span className="nav-label">Dashboard</span>
        </div>
        <div
          className={`nav-item ${isActiveRoute('/projects') ? 'active' : ''}`}
          onClick={() => handleNavigation('/projects')}
        >
          <span className="nav-label">Projects</span>
        </div>
        <div
          className={`nav-item ${isActiveRoute('/invoices') ? 'active' : ''}`}
          onClick={() => handleNavigation('/invoices')}
        >
          <span className="nav-label">Invoices</span>
        </div>
        <div
          className={`nav-item ${isActiveRoute('/portfolio') ? 'active' : ''}`}
          onClick={() => handleNavigation('/portfolio')}
        >
          <span className="nav-label">Portfolio</span>
        </div>
        <div
          className={`nav-item ${isActiveRoute('/tasks') ? 'active' : ''}`}
          onClick={() => handleNavigation('/tasks')}
        >
          <span className="nav-label">Tasks</span>
        </div>
        <div
          className={`nav-item ${isActiveRoute('/messages') ? 'active' : ''}`}
          onClick={() => handleNavigation('/messages')}
        >
          <span className="nav-label">Messages</span>
        </div>
        <div
          className={`nav-item ${isActiveRoute('/feedback') ? 'active' : ''}`}
          onClick={() => handleNavigation('/feedback')}
        >
          <span className="nav-label">Feedback</span>
        </div>
        <div
          className={`nav-item ${isActiveRoute('/notifications') ? 'active' : ''}`}
          onClick={() => handleNavigation('/notifications')}
        >
          <span className="nav-label">Notifications</span>
        </div>
        <div
          className={`nav-item ${isActiveRoute('/settings') ? 'active' : ''}`}
          onClick={() => handleNavigation('/settings')}
        >
          <span className="nav-label">Settings</span>
        </div>
        <div
          className={`nav-item ${isActiveRoute('/admin') ? 'active' : ''}`}
          onClick={() => handleNavigation('/admin')}
        >
          <span className="nav-label">Admin</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 