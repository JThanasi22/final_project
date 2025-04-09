import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import BellIcon from '../../icons/bell.png';
import MessengerIcon from '../../icons/messenger.png';
import CaretIcon from '../../icons/caret.png';
import CogIcon from '../../icons/cog.png';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState('User');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.name || decoded.sub);
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('token');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, []);

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
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
            className={`nav-item ${isActiveRoute('/tasks') ? 'active' : ''}`}
            onClick={() => handleNavigation('/tasks')}
          >
            <span className="nav-label">Tasks</span>
          </div>
          <div 
            className={`nav-item ${isActiveRoute('/portfolio') ? 'active' : ''}`}
            onClick={() => handleNavigation('/portfolio')}
          >
            <span className="nav-label">Portfolio</span>
          </div>
          <div 
            className={`nav-item ${isActiveRoute('/invoices') ? 'active' : ''}`}
            onClick={() => handleNavigation('/invoices')}
          >
            <span className="nav-label">Invoices</span>
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
        </div>
      </div>

      <div className="main-content">
        <div className="top-navbar">
          <div className="navbar-left">
            <button className="menu-toggle" onClick={toggleSidebar}>
              <span className="icon-menu">☰</span>
            </button>
            <div className="navbar-logo"><h2>Studio</h2></div>
            <div className="search-bar">
              <input type="text" placeholder="Search..." />
            </div>
          </div>

          <div className="navbar-right">
            <div className="nav-icons">
              <IconButton onClick={() => handleNavigation('/notifications')}>
                <img src={BellIcon} alt="Notifications" style={{ width: 20, height: 20 }} />
              </IconButton>
              <IconButton onClick={() => handleNavigation('/messages')}>
                <img src={MessengerIcon} alt="Messages" style={{ width: 20, height: 20 }} />
              </IconButton>
              <IconButton onClick={() => setShowUserMenu(!showUserMenu)}>
                <img src={CaretIcon} alt="User Menu" style={{ width: 20, height: 20 }} />
              </IconButton>
            </div>
            {showUserMenu && (
              <div className="user-menu">
                <div className="menu-item" onClick={() => handleNavigation('/settings')}>
                  <img src={CogIcon} alt="Settings" style={{ width: 20, height: 20 }} />
                  <span>Settings</span>
                </div>
                <div className="menu-item" onClick={handleLogout}>
                  <span>🚪</span>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const IconButton = ({ children, onClick }) => (
  <button className="icon-button" onClick={onClick}>
    {children}
  </button>
);

export default DashboardLayout; 