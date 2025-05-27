import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Layout from './components/Layout';
import './dash.css';

const API_URL = 'http://localhost:8080';
const TYPE_COLOR_MAP = {
    unread: '#5c9cce',
    read:   '#6c757d',
};

function getStatusLabel(status, state) {
    if (status === 'finished') return 'Finished';
    if (state === 1)           return 'Photographing';
    if (state === 2)           return 'Editing';
    return 'Unknown';
}

function getStatusColor(status, state) {
    if (status === 'finished') return '#5cb85c';
    if (state === 1)            return '#f0ad4e';
    if (state === 2)            return '#5bc0de';
    return '#f28b82';
}

export default function EditorDashboard() {
    const navigate = useNavigate();

    const [userEmail, setUserEmail]       = useState('Editor');
    const [greeting, setGreeting]         = useState('Welcome back');
    const [notifications, setNotifications] = useState([]);
    const [projects, setProjects]         = useState([]);
    const [projectDateEvents, setProjectDateEvents] = useState([]);
    const [taskDateEvents,    setTaskDateEvents]    = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [selectedDateStr, setSelectedDateStr] = useState(null);
    const [eventsForDate, setEventsForDate]     = useState([]);
    const [availabilityMessage, setAvailabilityMessage] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        let decoded;
        try {
            const [, b64] = token.split('.');
            decoded = JSON.parse(atob(b64));
        } catch {
            localStorage.removeItem('token');
            navigate('/login');
            return;
        }
        setUserEmail(decoded.name || decoded.sub);
        if (localStorage.getItem('justSignedUp') === 'true') {
            setGreeting('Welcome');
            localStorage.removeItem('justSignedUp');
        }

        fetchNotifications(token);
        fetchProjects(token);
        fetchProjectEvents(token);
        fetchTaskEvents(token);
    }, [navigate]);

    const fetchNotifications = async (token) => {
        const res = await axios.get(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        const sorted = res.data.sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0));
        setNotifications(sorted.slice(0,4));
    };

    const markNotificationRead = async (id) => {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
        fetchNotifications(token);
    };

    const fetchProjects = async (token) => {
        const res = await axios.get(`${API_URL}/api/my-active-projects`, { headers: { Authorization: `Bearer ${token}` } });
        const editProjects = res.data.filter(p => p.state === 2);
        setProjects(editProjects);
    };

    const fetchProjectEvents = async (token) => {
        const [activeRes, finRes] = await Promise.all([
            axios.get(`${API_URL}/api/my-active-projects`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/api/finished_projects`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const all = [...activeRes.data, ...finRes.data];
        const evs = all.map(proj => ({ id: proj.id, title: `📂 ${proj.title} Deadline`, date: proj.endDate, color: '#3f7dd7' }));
        setCalendarEvents(prev => [...prev, ...evs]);
    };

    const fetchTaskEvents = async (token) => {
        const res = await axios.get(`${API_URL}/api/tasks/assigned`, { headers: { Authorization: `Bearer ${token}` } });
        const evs = res.data.map(task => ({ id: task.id, title: `🖊️ ${task.title} Deadline`, date: new Date(task.dueDate).toISOString().split('T')[0], color: task.status === 'Completed' ? '#6ad36e' : '#ffc107' }));
        setCalendarEvents(prev => [...prev, ...evs]);
    };

    const handleDateClick = info => {
        const ds = info.dateStr;

        // first pull _all_ events for that date
        const eventsOnDate = calendarEvents.filter(ev => ev.date === ds);

        // then de-dupe by `id`
        const unique = Array.from(
            eventsOnDate.reduce((map, ev) => map.set(ev.id, ev), new Map()).values()
        );

        // now split into two lists
        const projectEvents = unique.filter(ev => ev.title.startsWith('📂'));
        const taskEvents    = unique.filter(ev => ev.title.startsWith('🖊️'));

        setProjectDateEvents(projectEvents);
        setTaskDateEvents(taskEvents);
        setSelectedDateStr(ds);
    };

    const truncateWords = (text, num=6) => {
        const w = text.split(' ');
        return w.length > num ? w.slice(0,num).join(' ') + '…' : text;
    };

    return (
        <Layout>
            <div className="dashboard-content">
                {/* LEFT SECTION */}
                <div className="content-section left-section">
                    <div className="welcome-card">
                        <h2>{greeting}, {userEmail}!</h2>
                        <p>Here’s your editing assignments.</p>
                    </div>

                    <div className="status-card">
                        <h3>Editing Projects</h3>
                        <div className="project-list">
                            {projects.length === 0
                                ? <p>Loading projects…</p>
                                : projects.map(p => (
                                    <div key={p.id} className="project-item">
                                        <div className="project-info">
                                            <h4>{p.title}</h4>
                                            <span className="project-date">{p.endDate}</span>
                                        </div>
                                        <div className="project-status" style={{ backgroundColor: getStatusColor(p.status,p.state) }}>
                                            {getStatusLabel(p.status,p.state)}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="status-card">
                        <h3>Notifications</h3>
                        <div className="project-list">
                            {notifications.length === 0
                                ? <p>Loading notifications…</p>
                                : notifications.map(n => (
                                    <div key={n.id} className="project-item" onClick={() => markNotificationRead(n.id)}>
                                        <div className="project-info">
                                            <h4>{truncateWords(n.message)}</h4>
                                            <span className="project-date">{n.timestamp?.seconds ? new Date(n.timestamp.seconds*1000).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="project-status" style={{ backgroundColor: TYPE_COLOR_MAP[n.status], color: '#fff' }}>
                                            {n.status}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT SECTION */}
                <div className="content-section right-section">
                    <div className="projects-card">
                        <h3>Your Meetings Calendar</h3>
                        <div className="calendar-wrapper">
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                height="auto"
                                events={[...calendarEvents]}
                                dateClick={handleDateClick}
                                headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                            />

                            {availabilityMessage && <p className="avail-msg">{availabilityMessage}</p>}

                            {selectedDateStr && (
                                <div className="meeting-info">
                                    <h4>Events on {selectedDateStr}:</h4>
                                    {(projectDateEvents.concat(taskDateEvents)).length === 0
                                        ? <p className="no-events">None</p>
                                        : projectDateEvents.concat(taskDateEvents).map(ev => (
                                            <div key={ev.id} className="event-item">{ev.title}</div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
