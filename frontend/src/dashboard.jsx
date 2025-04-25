import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Layout from './components/Layout';
import './dash.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('User');
  const [greeting, setGreeting] = useState('Welcome back');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const justSignedUp = localStorage.getItem('justSignedUp') === 'true';

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.name || decoded.sub);
        setUserRole(decoded.role);
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
    <Layout>
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
              <AppointmentItem 
                time="10:00 AM" 
                title="Client Consultation" 
                with="John Smith" 
                location="Main Office" 
              />
              <AppointmentItem 
                time="2:30 PM" 
                title="Project Review" 
                with="Emily Johnson" 
                location="Conference Room" 
              />
              <AppointmentItem 
                time="4:15 PM" 
                title="Portfolio Review" 
                with="Creative Team" 
                location="Studio" 
              />
            </div>
          </div>
        </div>

        <div className="content-section right-section">
          <div className="projects-card">
            <div className="card-header">
              <h3>Your Projects</h3>
              <div className="project-filter">
                <select defaultValue="all">
                  <option value="all">All Projects</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="project-list">
              <ProjectItem 
                title="Wedding Photography" 
                client="Rebecca & Tom" 
                date="Oct 15, 2023" 
                status="In Progress" 
                statusColor="#4a6fdc" 
              />
              <ProjectItem 
                title="Corporate Headshots" 
                client="Tech Solutions Inc." 
                date="Oct 10, 2023" 
                status="Completed" 
                statusColor="#50c878" 
              />
              <ProjectItem 
                title="Product Launch" 
                client="Fashion Brand" 
                date="Oct 20, 2023" 
                status="Pending" 
                statusColor="#f0ad4e" 
              />
              <ProjectItem 
                title="Family Portrait" 
                client="Williams Family" 
                date="Oct 25, 2023" 
                status="In Progress" 
                statusColor="#4a6fdc" 
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const ProjectStatus = ({ label, percent }) => (
  <div className="status-item">
    <div className="status-info">
      <span className="status-label">{label}</span>
      <span className="status-percent">{percent}%</span>
    </div>
    <div className="progress-bar">
      <div 
        className="progress" 
        style={{ 
          width: `${percent}%`,
          backgroundColor: percent >= 90 ? '#50c878' : percent >= 50 ? '#4a6fdc' : '#f0ad4e'
        }}
      ></div>
    </div>
  </div>
);

const AppointmentItem = ({ time, title, with: withWhom, location }) => (
  <div className="appointment-item">
    <div className="appointment-time">
      <span className="time">{time.split(' ')[0]}</span>
      <span className="period">{time.split(' ')[1]}</span>
    </div>
    <div className="appointment-details">
      <h4>{title}</h4>
      <p>with {withWhom}</p>
      {location && <p className="location">📍 {location}</p>}
    </div>
  </div>
);

const ProjectItem = ({ title, client, date, status, statusColor }) => (
  <div className="project-item">
    <div className="project-info">
      <h4>{title}</h4>
      <div className="client-info">
        <span className="client-name">👤 {client}</span>
        <span className="project-date">📅 {date}</span>
      </div>
    </div>
    <div className="project-status" style={{ backgroundColor: statusColor }}>
      {status}
    </div>
  </div>
);

export default Dashboard;
