import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Box, Typography, Select, MenuItem, Grid, Paper, LinearProgress } from '@mui/material';
import { CSSTransition } from 'react-transition-group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';

import BellIcon from './icons/bell.png';
import MessengerIcon from './icons/messenger.png';
import CaretIcon from './icons/caret.png';
import CogIcon from './icons/cog.png';

import './dash.css';
import * as PropTypes from "prop-types";
import PageBox from "./PageBox.jsx";

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState('User');
  const [greeting, setGreeting] = useState('Welcome back');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const justSignedUp = localStorage.getItem('justSignedUp') === 'true';

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.name || decoded.sub);
        if (justSignedUp) {
          setGreeting('Welcome');
          localStorage.removeItem('justSignedUp');
        }
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('token');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, []);

  return (
      <div className="dashboard-container">
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-logo">
            <h2><span className="studio-text">Studio</span> <span className="studio-number">21</span></h2>
          </div>
          <div className="sidebar-menu">
            <div className="nav-item active"><span className="nav-label">Dashboard</span></div>
            <div
                className={`nav-item ${isActiveRoute('/projects') ? 'active' : ''}`}
                onClick={() => handleNavigation('/projects')}
            >
              <span className="nav-label">Projects</span>
            </div>
            <div className="nav-item"><span className="nav-label">Billing</span></div>

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

            <ToggleNavbar>
              <NavItem icon={<img src={BellIcon} alt="Bell" style={{ width: 20, height: 20 }} onClick={() => handleNavigation('/notifications')}/>}>
                Notification
              </NavItem>

              <NavItem icon={<img src={MessengerIcon} alt="Messenger" style={{ width: 20, height: 20 }} onClick={() => handleNavigation('/messages')}/>}>
                Messages
              </NavItem>

              <NavItem icon={<img src={CaretIcon} alt="Caret" style={{ width: 20, height: 20 }} />}>
                <DropdownMenu onLogout={handleLogout} />
                More
              </NavItem>
            </ToggleNavbar>

          </div>

          <div className="dashboard-content">
            <div className="content-section left-section">
              <div className="welcome-card">
                <h2>{greeting}, {userEmail}!</h2>
                <p>Here's what's happening with your projects today.</p>
              </div>

              <div className="status-card">
                <h3>Project Status</h3>
                <div className="status-bars">
                  <ProjectStatus label="Wedding Shoot" percent={75} />
                  <ProjectStatus label="Corporate Event" percent={45} />
                  <ProjectStatus label="Product Photoshoot" percent={90} />
                </div>
              </div>

              <div className="appointments-card">
                <h3>Upcoming Appointments</h3>
                <div className="appointment-list">
                  <AppointmentItem time="10:00 AM" title="Client Consultation" with="John Smith" />
                  <AppointmentItem time="2:30 PM" title="Project Review" with="Emily Johnson" />
                  <AppointmentItem time="4:15 PM" title="Portfolio Review" with="Creative Team" />
                </div>
              </div>
            </div>

            <div className="content-section right-section">
              <div className="projects-card">
                <div className="card-header">
                  <h3>Your Projects</h3>
                  <select className="project-filter">
                    <option>All Projects</option>
                    <option>Active</option>
                    <option>Completed</option>
                  </select>
                </div>
                <div className="project-list">
                  <ProjectItem title="Wedding Photography" client="Rebecca & Tom" date="Oct 15, 2023" status="In Progress" statusColor="#4a6fdc" />
                  <ProjectItem title="Corporate Headshots" client="Tech Solutions Inc." date="Oct 10, 2023" status="Completed" statusColor="#50c878" />
                  <ProjectItem title="Product Launch" client="Fashion Brand" date="Oct 20, 2023" status="Pending" statusColor="#f0ad4e" />
                  <ProjectItem title="Family Portrait" client="Williams Family" date="Oct 25, 2023" status="In Progress" statusColor="#4a6fdc" />
                  <ProjectItem title="Website Redesign" client="Local Restaurant" date="Oct 30, 2023" status="Pending" statusColor="#f0ad4e" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

// Components
function ToggleNavbar({ children }) {
  const [showNavItems, setShowNavItems] = useState(false);
  const containerRef = useRef(null);

  return (
      <div className="toggle-navbar" ref={containerRef}>
        <button
            className="main-toggle-button"
            onClick={() => setShowNavItems(!showNavItems)}
        >
          More
        </button>

        {showNavItems && (
            <div className="navbar-items-exept">
              {children}
            </div>
        )}
      </div>
  );
}

function NavItem({ icon, children }) {
  const [open, setOpen] = useState(false);

  // Check if there's a DropdownMenu as a child
  const hasDropdown = React.Children.toArray(children).some(
      child => React.isValidElement(child) && child.type === DropdownMenu
  );

  const labelText = React.Children.toArray(children).filter(
      child => typeof child === 'string' || typeof child === 'number'
  );

  return (
      <li className="nav-item">
        <button className="icon-button" onClick={() => setOpen(!open)}>
          <div className="nav-icon-text">
            {icon}
            <span className="nav-text">{labelText}</span>
          </div>
        </button>

        {open && hasDropdown && React.Children.map(children, child =>
            React.isValidElement(child) && child.type === DropdownMenu ? child : null
        )}
      </li>
  );
}

function DropdownMenu({ onLogout }) {
  const [activeMenu, setActiveMenu] = useState('main');
  const [menuHeight, setMenuHeight] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (dropdownRef.current) {
      setMenuHeight(dropdownRef.current.firstChild.offsetHeight);
    }
  }, []);

  function calcHeight(el) {
    const height = el.offsetHeight;
    setMenuHeight(height);
  }

  function DropdownItem({ children, leftIcon, onClick, className = '', style = {} }) {
    return (
        <button
            className={`menu-item ${className}`}
            onClick={onClick}
            style={{ color: 'black', ...style }}
        >
          {leftIcon && <span className="icon-left">{leftIcon}</span>}
          <span className="item-text">{children}</span>
        </button>
    );
  }


  return (
      <div className="dropdown" style={{ height: menuHeight }} ref={dropdownRef}>
        <CSSTransition
            in={activeMenu === 'main'}
            timeout={500}
            classNames="menu-primary"
            unmountOnExit
            onEnter={calcHeight}
        >
          <div className="menu">
            <DropdownItem
                leftIcon={<img src={CogIcon} alt="Settings" style={{ width: 20, height: 20 }} />}
                onClick={() => navigate('/settings')}
                style={{ color: 'black' }}
            >
              Settings
            </DropdownItem>

            <DropdownItem
                leftIcon={<span>🚪</span>}
                onClick={onLogout}
                style={{ color: 'black' }}
            >
              Logout
            </DropdownItem>
          </div>
        </CSSTransition>
      </div>
  );
}



const ProjectStatus = ({ label, percent, dueDate, team }) => (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ mb: 0.5 }}>{label}</Typography>

          <Box
              sx={{
                display: 'flex',
                gap: 2,
                color: 'text.secondary',
                fontSize: '0.875rem',
              }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon fontSize="small" />
              <span>Due {dueDate}</span>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon fontSize="small" />
            </Box>
          </Box>
        </Box>

        <Typography
            variant="h6"
            sx={{
              color:
                  percent >= 90 ? '#50c878' : percent >= 50 ? '#4a6fdc' : '#f0ad4e',
            }}
        >
          {percent}%
        </Typography>
      </Box>

      <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: '#f0f0f0',
            '& .MuiLinearProgress-bar': {
              bgcolor:
                  percent >= 90 ? '#50c878' : percent >= 50 ? '#4a6fdc' : '#f0ad4e',
              borderRadius: 4,
            },
          }}
      />
    </Box>
);

const AppointmentItem = ({ time, title, with: withWhom, location }) => (
    <Paper elevation={0} sx={{
      display: 'flex',
      gap: 2,
      p: 2,
      bgcolor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      <Box sx={{
        minWidth: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRight: '1px solid #e9ecef',
        pr: 2
      }}>
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
          {time.split(' ')[0]}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {time.split(' ')[1]}
        </Typography>
      </Box>
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          with {withWhom}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}>
          <EventIcon fontSize="small" />
          {location}
        </Typography>
      </Box>
    </Paper>
);

const ProjectItem = ({ title, client, date, status, statusColor }) => (
    <Paper elevation={0} sx={{
      p: 2,
      bgcolor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
        <Box sx={{
          bgcolor: statusColor,
          color: '#fff',
          px: 1.5,
          py: 0.5,
          borderRadius: '16px',
          fontSize: '0.875rem',
          display: 'inline-block'
        }}>
          {status}
        </Box>
      </Box>
      <Box sx={{ mt: 'auto' }}>
        <Typography variant="body2" color="text.secondary" sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: 0.5
        }}>
          <PersonIcon fontSize="small" />
          Client: {client}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}>
          <AccessTimeIcon fontSize="small" />
          Due: {date}
        </Typography>
      </Box>
    </Paper>
);

export default Dashboard;
