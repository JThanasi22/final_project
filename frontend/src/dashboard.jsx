import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Layout from './components/Layout';
import './dash.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('User');
  const [greeting, setGreeting] = useState('Welcome back');
  const [userRole, setUserRole] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

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
        return;
      }
    } else {
      navigate('/login');
      return;
    }

    const fetchGoogleEvents = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ No token found. Skipping fetchGoogleEvents.");
        return;
      }

      try {
        const res = await fetch("http://localhost:8080/api/google/events", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const formatted = data.map(event => ({
            title: event.title,
            date: event.date,
          }));
          setCalendarEvents(formatted);
        } else {
          console.error("Failed to fetch Google Calendar events");
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };

    fetchGoogleEvents();
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
                <h3>Your Projects Calendar</h3>
              </div>
              <div className="calendar-wrapper" style={{ padding: '20px' }}>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    height="auto"
                    events={calendarEvents}
                    dateClick={(info) => {
                      const clickedDate = info.dateStr;
                      const isBooked = calendarEvents.some(ev => ev.date === clickedDate);

                      if (isBooked) {
                        setAvailabilityMessage(`❌ ${clickedDate} is not available for booking.`);
                      } else {
                        setAvailabilityMessage(`✅ ${clickedDate} is available for booking.`);
                      }
                    }}
                />
                {availabilityMessage && <p style={{ marginTop: '10px' }}>{availabilityMessage}</p>}
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
