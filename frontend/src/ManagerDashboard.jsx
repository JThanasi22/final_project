// src/ManagerDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate }                  from 'react-router-dom';
import axios                            from 'axios';
import FullCalendar                     from '@fullcalendar/react';
import dayGridPlugin                    from '@fullcalendar/daygrid';
import timeGridPlugin                   from '@fullcalendar/timegrid';
import interactionPlugin                from '@fullcalendar/interaction';
import Layout                           from './components/Layout';
import './dash.css';

const API_URL = 'http://localhost:8080';

const TYPE_COLOR_MAP = {
    task_assignment:   '#5c9cce',
    task_completed:    '#6ad36e',
    task_reply:        '#f3e778',
    project_update:    '#d16de3',
    payment_request:   '#ee6a79',
    meeting_request:   '#6dc6ee',
    meeting_accepted:  '#75ec7b',
    meeting_rejected:  '#f37582'
};

function getStatusLabel(status, state) {
    if (status === 'finished')               return 'Finished';
    if (status === 'pending' && state === -1) return 'Pending';
    if (status === 'pending' && state ===  0) return 'Awaiting Payment';
    if (state === 1)                          return 'Photographing';
    if (state === 2)                          return 'Editing';
    return 'Unknown';
}

function getStatusColor(status, state) {
    if (status === 'finished') return '#5cb85c';
    if (state === 1)            return '#f0ad4e';
    if (state === 2)            return '#5bc0de';
    return '#f28b82';
}

function formatYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,'0');
    const d = String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
}

export default function ManagerDashboard() {
    const navigate = useNavigate();

    // user + greeting
    const [userEmail, setUserEmail]         = useState('Manager');
    const [greeting,  setGreeting]          = useState('Welcome back');

    // left cards
    const [projects,      setProjects]      = useState([]);
    const [notifications, setNotifications] = useState([]);

    // calendar
    const [calendarEvents,     setCalendarEvents]     = useState([]);
    const [projectEvents,      setProjectEvents]      = useState([]);
    const [selectedDateStr,    setSelectedDateStr]    = useState(null);
    const [eventsForDate,      setEventsForDate]      = useState([]);
    const [availabilityMessage,setAvailabilityMessage] = useState('');
    const [taskEvents, setTaskEvents] = useState([]);
    const [userRole, setUserRole]   = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        // decode JWT manually
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
        setUserRole(decoded.role);
        if (localStorage.getItem('justSignedUp') === 'true') {
            setGreeting('Welcome');
            localStorage.removeItem('justSignedUp');
        }

        fetchProjects(token);
        fetchNotifications(token);
        fetchMeetingEvents(token);
        fetchProjectEvents(token);
        fetchTaskEvents(token);       // ← NEW
    }, [navigate]);

    // ── Fetch project cards ─────────────────────────
    const fetchProjects = async token => {
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const p = await axios.get(`${API_URL}/api/pending-projects`, { headers });
            const all = p.data;
            const sorted = all.sort((x,y) => new Date(x.endDate) - new Date(y.endDate));
            setProjects(sorted.slice(0,3));
        } catch(e){
            console.error('fetchProjects failed:',e);
        }
    };

    // ── Fetch notification cards ──────────────────────
    const fetchNotifications = async token => {
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const res = await axios.get(`${API_URL}/api/notifications`, { headers });
            const sorted = res.data.sort((x,y)=>
                (y.timestamp?.seconds||0) - (x.timestamp?.seconds||0)
            );
            setNotifications(sorted.slice(0,4));
        } catch(e){
            console.error('fetchNotifications failed:', e);
        }
    };

    const markAsRead = async id => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        try {
            await axios.put(`${API_URL}/api/notifications/${id}/read`,{}, { headers });
            fetchNotifications(token);
        } catch(e){
            console.error('markAsRead failed:',e);
        }
    };

    // ── Fetch meetings ───────────────────────────────
    const fetchMeetingEvents = async (token) => {
        const headers = { Authorization: `Bearer ${token}` };
        try {
            // 1) fetch everything
            const res = await axios.get(`${API_URL}/api/meetings`, { headers });
            const all = res.data;

            // 2) build calendar events by status
            const pending = all
                .filter(m => m.status === 'pending')
                .map(m => ({
                    id:    m.id,
                    title: '📅 Requested Meeting',
                    date:  m.meetingDate,
                    color: '#ffc107'
                }));

            const accepted = all
                .filter(m => m.status === 'accepted')
                .map(m => ({
                    id:    m.id,
                    title: '📅 Accepted Meeting',
                    date:  m.meetingDate,
                    color: '#28a745'
                }));

            const rejected = all
                .filter(m => m.status === 'rejected')
                .map(m => ({
                    id:    m.id,
                    title: '📅 Rejected Meeting',
                    date:  m.meetingDate,
                    color: '#dc3545'
                }));

            // 3) merge and set
            setCalendarEvents([ ...pending, ...accepted, ...rejected ]);
        } catch (err) {
            console.error('fetchMeetingEvents failed:', err);
        }
    };
;

    const handleDateClick = info => {
        const ds = info.dateStr;
        setSelectedDateStr(ds);
        const all = [...calendarEvents, ...projectEvents, ...taskEvents];
        setEventsForDate(all.filter(ev=>ev.date===ds));
        setAvailabilityMessage('');
    };

    const requestMeeting = async () => {
        if (!selectedDateStr) return;
        if (calendarEvents.some(ev=>ev.date===selectedDateStr)) {
            setAvailabilityMessage(`❌ Already booked ${selectedDateStr}`);
            return;
        }
        const today = formatYMD(new Date());
        if (selectedDateStr <= today) {
            setAvailabilityMessage(`❌ Cannot request ${selectedDateStr}`);
            return;
        }
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        try {
            await axios.post(
                `${API_URL}/api/meetings`,
                { meetingDate:selectedDateStr, message:`Meeting on ${selectedDateStr}` },
                { headers }
            );
            setAvailabilityMessage(`✅ Requested ${selectedDateStr}`);
            await fetchMeetingEvents(token);
            setSelectedDateStr(null);
            setEventsForDate([]);
        } catch(e){
            console.error('requestMeeting failed:',e);
        }
    };

    const fetchProjectEvents = async (token) => {
        const headers = { Authorization: `Bearer ${token}` };
        try {
            // 1) fetch pending, active, and finished
            const [pendRes, actRes, finRes] = await Promise.all([
                axios.get(`${API_URL}/api/pending-projects`,            { headers }),
                axios.get(`${API_URL}/api/pending-projects/active`,     { headers }),
                axios.get(`${API_URL}/api/pending-projects/all-finished`, { headers }),
            ]);

            // 2) merge into one array
            const allProjects = [
                ...pendRes.data,
                ...actRes.data,
                ...finRes.data
            ];

            // 3) sort by endDate ascending
            allProjects.sort((a, b) =>
                new Date(a.endDate) - new Date(b.endDate)
            );

            // 4) map to FullCalendar events
            const evs = allProjects.map(proj => ({
                id:    proj.id,
                title: `📂 ${proj.title}`+' Deadline',
                date:  proj.endDate,
                color: '#3f7dd7'
            }));

            setProjectEvents(evs);
        } catch (err) {
            console.error('fetchProjectEvents failed:', err);
        }
    };

    const fetchTaskEvents = async (token) => {
        const headers = { Authorization: `Bearer ${token}` };
        try {
            // 1) hit the tasks endpoint
            //    if manager: GET /api/tasks/all, otherwise /api/tasks/assigned
            const url = `${API_URL}/api/tasks/all`;
            const res = await axios.get(url, { headers });
            const allTasks = res.data;

            // 2) map each task to a calendar event
            const evs = allTasks.map(task => {
                // parse your string like "May 24, 2025 at 2:00:00 AM UTC+2"
                const dt = new Date(task.dueDate);
                // drop the time if you want just date, or use full ISO string
                const dateStr = dt.toISOString().split('T')[0];
                return {
                    id:    task.id,
                    title: '🖊️ Task '+ task.title + ' Deadline',
                    date:  dateStr,
                    // color‐code by status
                    color: task.status === 'Completed' ? '#6ad36e' : '#ffc107'
                };
            });

            // 3) set your state
            setTaskEvents(evs);
        } catch (err) {
            console.error('fetchTaskEvents failed:', err);
        }
    };


    const truncateWords = (text,num=6) => {
        const w = text.split(' ');
        return w.length>num ? w.slice(0,num).join(' ')+'…' : text;
    };

    return (
        <Layout>
            <div className="dashboard-content">
                {/* LEFT */}
                <div className="content-section left-section">
                    <div className="welcome-card">
                        <h2>{greeting}, {userEmail}!</h2>
                        <p>Here’s your project workflow stages.</p>
                    </div>

                    <div className="status-card">
                        <h3>Project Status</h3>
                        <div className="project-list">
                            {projects.length===0
                                ? <p>Loading projects…</p>
                                : projects.map(p=>(
                                    <div key={p.id} className="project-item">
                                        <div className="project-info">
                                            <h4>{p.title}</h4>
                                            <span className="project-date">{p.endDate}</span>
                                        </div>
                                        <div
                                            className="project-status"
                                            style={{backgroundColor:getStatusColor(p.status,p.state)}}
                                        >{getStatusLabel(p.status,p.state)}</div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="status-card">
                        <h3>Notifications</h3>
                        <div className="project-list">
                            {notifications.length===0
                                ? <p>Loading notifications…</p>
                                : notifications.map(n=>(
                                    <div
                                        key={n.id}
                                        className="project-item"
                                        onClick={()=>markAsRead(n.id)}
                                    >
                                        <div className="project-info">
                                            <h4>{truncateWords(n.message,6)}</h4>
                                            <span className="project-date">
                        {n.timestamp?.seconds
                            ? new Date(n.timestamp.seconds*1000).toLocaleDateString()
                            : 'N/A'}
                      </span>
                                        </div>
                                        <div
                                            className="project-status"
                                            style={{backgroundColor:TYPE_COLOR_MAP[n.type]||'#6c757d'}}
                                        >
                                            {n.status}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="content-section right-section">
                    <div className="projects-card">
                        <h3>Your Meetings Calendar</h3>
                        <div className="calendar-wrapper">
                            <FullCalendar
                                plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
                                initialView="dayGridMonth"
                                height="auto"
                                events={[...calendarEvents, ...projectEvents, ...taskEvents]}
                                dateClick={handleDateClick}
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: ''
                                }}
                            />
                            {availabilityMessage && (
                                <p className="avail-msg">{availabilityMessage}</p>
                            )}

                            {selectedDateStr && (
                                <div className="meeting-info">
                                    <div className="events-list">
                                        <h4>Events on {selectedDateStr}:</h4>
                                        {eventsForDate.length === 0
                                            ? <p className="no-events">None</p>
                                            : eventsForDate.map(ev => (
                                                <div key={ev.id} className="event-item">{ev.title}</div>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
