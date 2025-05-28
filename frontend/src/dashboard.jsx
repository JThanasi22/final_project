import React, { useState, useEffect } from 'react';
import { useNavigate }            from 'react-router-dom';
import axios                      from 'axios';
import FullCalendar               from '@fullcalendar/react';
import dayGridPlugin              from '@fullcalendar/daygrid';
import timeGridPlugin             from '@fullcalendar/timegrid';
import interactionPlugin          from '@fullcalendar/interaction';
import Layout                     from './components/Layout';
import './dash.css';

const API_URL = 'http://localhost:8080';

const TYPE_COLOR_MAP = {
  task_assignment:   '#5c9cce',  // light blue
  task_completed:    '#6ad36e',  // light green
  task_reply:        '#f3e778',  // light amber
  project_update:    '#d16de3',  // light purple
  payment_request:   '#ee6a79',  // light red
  meeting_request:   '#6dc6ee',  // light grey
  meeting_accepted:  '#75ec7b',  // light green
  meeting_rejected:  '#f37582'   // light red
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

export default function Dashboard() {
  const navigate = useNavigate();

  // user + greeting
  const [userEmail, setUserEmail]         = useState('User');
  const [greeting,  setGreeting]          = useState('Welcome back');

  // left‐side cards
  const [projects,      setProjects]      = useState([]);
  const [notifications, setNotifications] = useState([]);

  // calendar (meetings)
  const [calendarEvents,     setCalendarEvents]     = useState([]);   // { id, title, date: 'YYYY-MM-DD' }
  const [projectEvents,   setProjectEvents]   = useState([]);   // projects
  const [selectedDateStr,    setSelectedDateStr]    = useState(null); // 'YYYY-MM-DD'
  const [eventsForDate,      setEventsForDate]      = useState([]);   // subset of calendarEvents
  const [availabilityMessage,setAvailabilityMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    // decode JWT
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

    fetchProjects(token);
    fetchNotifications(token);
    fetchMeetingEvents(token);
    fetchProjectEvents(token);
  }, [navigate]);

  // ── Fetch project cards ─────────────────────────
  const fetchProjects = async token => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [p, a, f] = await Promise.all([
        axios.get(`${API_URL}/api/client-projects/pending`,  { headers }),
        axios.get(`${API_URL}/api/client-projects/active`,   { headers }),
        axios.get(`${API_URL}/api/client-projects/finished`, { headers }),
      ]);
      const all = [...p.data, ...a.data, ...f.data]
          .sort((x,y)=> new Date(x.endDate)-new Date(y.endDate));
      setProjects(all.slice(0,3));
    } catch(e){ console.error('fetchProjects failed:',e) }
  };

  // ── Fetch notification cards ──────────────────────
  const fetchNotifications = async token => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, { headers });
      const sorted = res.data.sort((x,y)=>
          (y.timestamp?.seconds||0)-(x.timestamp?.seconds||0)
      );
      setNotifications(sorted.slice(0,4));
    } catch(e){ console.error('fetchNotifications failed:', e) }
  };

  const markAsRead = async id => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`,{}, { headers });
      fetchNotifications(token);
    } catch(e){ console.error('markAsRead failed:',e) }
  };

  // ── Fetch pending meetings ────────────────────────
// ── Fetch all my meetings ─────────────────────────
  const fetchMeetingEvents = async token => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const res = await axios.get(`${API_URL}/api/meetings/mine`, { headers });
      const allMeetings = res.data;

      // Map to FullCalendar events
      const pending = allMeetings
          .filter(m => m.status === "pending")
          .map(m => ({
            id:    m.id,
            title: '📅 Requested Meeting',
            date:  m.meetingDate,
            color: '#ffc107'
          }));

      const accepted = allMeetings
          .filter(m => m.status === "accepted")
          .map(m => ({
            id:    m.id,
            title: '📅 Accepted Meeting',
            date:  m.meetingDate,
            color: '#28a745'
          }));

      setCalendarEvents([ ...pending, ...accepted ]);
    } catch (e) {
      console.error('fetchMeetingEvents failed:', e);
    }
  };

  // ── When user clicks a date ──────────────────────

  const handleDateClick = async info => {
    const ds = info.dateStr;
    setSelectedDateStr(ds);

    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1) ask the server if fully booked
      const { data } = await axios.get(
          `${API_URL}/api/meetings/availability`,
          { params: { date: ds }, headers }
      );

      if (data.fullyBooked) {
        // 2a) if ≥3 accepted → show “fully booked”
        setAvailabilityMessage(`❌ ${ds} is fully booked.`);
        setEventsForDate([]);
        return;
      }

      // 2b) otherwise, render all events & show the request buttons
      const all = [ ...calendarEvents, ...projectEvents ];
      setEventsForDate(all.filter(ev => ev.date === ds));
      setAvailabilityMessage('');
    } catch (err) {
      console.error('availability check failed', err);
      setAvailabilityMessage(
          `⚠️ Could not check availability for ${ds}.`
      );
    }
  };

  // ── On “Yes”: POST & refresh ──────────────────────
  const requestMeeting = async () => {
    if (!selectedDateStr) return;

    if (calendarEvents.some(ev => ev.date === selectedDateStr)) {
      setAvailabilityMessage(`❌ You already requested a meeting on ${selectedDateStr}`);
      return;
    }
    // disallow past/today:
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
          { email:userEmail, meetingDate:selectedDateStr, message:`Meeting on ${selectedDateStr}` },
          { headers }
      );
      setAvailabilityMessage(`✅ Requested ${selectedDateStr}!`);
      await fetchMeetingEvents(token);
      setSelectedDateStr(null);
      setEventsForDate([]);
    } catch(e){
      console.error('requestMeeting failed:',e);
      setAvailabilityMessage(`⚠️ Could not request ${selectedDateStr}.`);
    }
  };

  const truncateWords = (text, numWords) => {
    const words = text.split(' ');
    return words.length > numWords
        ? words.slice(0, numWords).join(' ') + '…'
        : text;
  };

  const fetchProjectEvents = async token => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [pend, act, fin] = await Promise.all([
        axios.get(`${API_URL}/api/client-projects/pending`,  { headers }),
        axios.get(`${API_URL}/api/client-projects/active`,   { headers }),
        axios.get(`${API_URL}/api/client-projects/finished`, { headers }),
      ]);
      const all = [...pend.data, ...act.data, ...fin.data];
      const evs = all.map(proj => ({
        id:    proj.id,
        title: `📂 ${proj.title}`,
        date:  proj.endDate,
        color: '#3f7dd7'
      }));
      setProjectEvents(evs);
    } catch (err) {
      console.error('fetchProjectEvents failed:', err);
    }
  };

  return (
      <Layout>
        <div className="dashboard-content">
          {/* LEFT SECTION */}
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
                            <div className="client-info">
                              <span className="client-name">{p.type}</span>
                              <span className="project-date">{p.endDate}</span>
                            </div>
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
                            <h4>{truncateWords(n.message, 6)}</h4>

                            <div className="client-info">
                        <span className="project-date">
                          {n.timestamp?.seconds
                              ? new Date(n.timestamp.seconds*1000).toLocaleDateString()
                              : 'N/A'}
                        </span>
                            </div>
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

          {/* RIGHT SECTION: Calendar */}
          <div className="content-section right-section">
            <div className="projects-card">
              <h3>Your Meetings Calendar</h3>
              <div className="calendar-wrapper">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    height="auto"
                    events={[ ...calendarEvents, ...projectEvents ]}
                    dateClick={handleDateClick}

                    // ← REPLACE your dayCellClassNames with this:
                    dayCellClassNames={arg => {
                      // build YYYY-MM-DD in local time
                      const d = arg.date;
                      const ds = [
                        d.getFullYear(),
                        String(d.getMonth() + 1).padStart(2, '0'),
                        String(d.getDate()).padStart(2, '0')
                      ].join('-');

                      const all = [ ...calendarEvents, ...projectEvents ];
                      const cls = [];
                      if (ds === selectedDateStr)       cls.push('selected-day');
                      if (all.some(ev => ev.date === ds)) cls.push('has-event');
                      return cls;
                    }}

                    headerToolbar={{
                      left:  'prev,next today',
                      center:'title',
                      right: ''
                    }}
                />
                {availabilityMessage && (
                    <p className="avail-msg">{availabilityMessage}</p>
                )}

                {selectedDateStr && (
                    <div className="meeting-info">
                      {selectedDateStr > formatYMD(new Date()) ? (
                          <div className="meeting-prompt">
                            <p>Request meeting for <strong>{selectedDateStr}</strong>?</p>
                            <button className="btn-yes" onClick={requestMeeting}>Yes</button>
                            <button className="btn-no" onClick={()=>setSelectedDateStr(null)}>No</button>
                          </div>
                      ) : (
                          <p className="past-date-msg">
                            Cannot request {selectedDateStr}
                          </p>
                      )}

                      <div className="events-list">
                        <h4>Events on {selectedDateStr}:</h4>
                        {eventsForDate.length===0
                            ? <p className="no-events">None</p>
                            : eventsForDate.map(ev=>(
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
