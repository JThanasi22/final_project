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

export default function PhotographerDashboard() {
    const navigate = useNavigate();

    const [userEmail, setUserEmail] = useState('Photographer');
    const [greeting, setGreeting]   = useState('Welcome back');
    const [notifications, setNotifications] = useState([]);
    const [projects, setProjects]   = useState([]);

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
        try {
            const res = await axios.get(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
            const sorted = res.data.sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0));
            setNotifications(sorted.slice(0,4));
        } catch (e) {
            console.error('fetchNotifications failed:', e);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchNotifications(token);
        } catch (e) {
            console.error('markAsRead failed:', e);
        }
    };

    const fetchProjects = async (token) => {
        try {
            const res = await axios.get(`${API_URL}/api/my-active-projects`, { headers: { Authorization: `Bearer ${token}` } });
            const photo = res.data.filter(p => p.state === 1).slice(0,3);
            setProjects(photo);
        } catch (e) {
            console.error('fetchProjects failed:', e);
        }
    };

    const fetchProjectEvents = async (token) => {
        try {
            const [activeRes, finRes] = await Promise.all([
                axios.get(`${API_URL}/api/my-active-projects`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/finished_projects`,   { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const all = [...activeRes.data, ...finRes.data];
            const evs = all.map(proj => ({ id: proj.id, title: `📂 ${proj.title} Deadline`, date: proj.endDate, color: '#3f7dd7' }));
            setCalendarEvents(prev => [...prev, ...evs]);
        } catch (e) {
            console.error('fetchProjectEvents failed:', e);
        }
    };

    const fetchTaskEvents = async (token) => {
        try {
            const res = await axios.get(`${API_URL}/api/tasks/assigned`, { headers: { Authorization: `Bearer ${token}` } });
            const evs = res.data.map(task => ({ id: task.id, title: `🖊️ ${task.title} Deadline`, date: new Date(task.dueDate).toISOString().split('T')[0], color: task.status === 'Completed' ? '#6ad36e' : '#ffc107' }));
            setCalendarEvents(prev => [...prev, ...evs]);
        } catch (e) {
            console.error('fetchTaskEvents failed:', e);
        }
    };

    const handleDateClick = (info) => {
        const ds = info.dateStr;

        // 1) grab every event on that date (including dupes)
        const eventsOnDate = calendarEvents.filter(ev => ev.date === ds);

        // 2) de-duplicate by `id`
        const uniqueEvents = Array.from(
            eventsOnDate.reduce((map, ev) => map.set(ev.id, ev), new Map()).values()
        );

        // 3) keep only the ones you want to display (projects & tasks combined)
        setEventsForDate(uniqueEvents);
        setSelectedDateStr(ds);
        setAvailabilityMessage('');
    };

    const truncateWords = (text,num=6) => {
        const w = text.split(' ');
        return w.length>num ? w.slice(0,num).join(' ')+'…' : text;
    };

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="content-section left-section">
                    <div className="welcome-card">
                        <h2>{greeting}, {userEmail}!</h2>
                        <p>Top photographing assignments.</p>
                    </div>

                    <div className="status-card">
                        <h3>Photographing (up to 3)</h3>
                        <div className="project-list">
                            {projects.map(p => (
                                <div key={p.id} className="project-item">
                                    <div className="project-info"><h4>{p.title}</h4><span className="project-date">{p.endDate}</span></div>
                                    <div className="project-status" style={{ backgroundColor: getStatusColor(p.status,p.state) }}>{getStatusLabel(p.status,p.state)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="status-card">
                        <h3>Notifications</h3>
                        <div className="project-list">
                            {notifications.map(n => (
                                <div key={n.id} className="project-item" onClick={()=>markAsRead(n.id)} style={{ backgroundColor: n.status==='unread'?'#eef6ff':'transparent',cursor:'pointer'}}>
                                    <div className="project-info"><h4>{truncateWords(n.message)}</h4><span className="project-date">{n.timestamp?.seconds?new Date(n.timestamp.seconds*1000).toLocaleDateString():'N/A'}</span></div>
                                    <div className="project-status" style={{ backgroundColor: n.status==='unread'?'#5c9cce':'#6c757d',color:'#fff'}}>{n.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="content-section right-section">
                    <div className="projects-card">
                        <h3>Your Meetings Calendar</h3>
                        <div className="calendar-wrapper">
                            <FullCalendar
                                plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
                                initialView="dayGridMonth"
                                height="auto"
                                events={calendarEvents}
                                dateClick={handleDateClick}
                                headerToolbar={{ left:'prev,next today',center:'title',right:'' }}
                            />

                            {availabilityMessage && <p className="avail-msg">{availabilityMessage}</p>}

                            {selectedDateStr && (
                                <div className="meeting-info">
                                    <h4>Events on {selectedDateStr}:</h4>
                                    {eventsForDate.length===0? <p className="no-events">None</p> : eventsForDate.map(ev=><div key={ev.id} className="event-item">{ev.title}</div>)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
