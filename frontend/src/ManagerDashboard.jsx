import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Layout from "./components/Layout";
import "./dash.css";

const ManagerDashboard = () => {
    const [userEmail, setUserEmail] = useState("Manager");
    const [userId, setUserId] = useState(null);
    const [greeting, setGreeting] = useState("Welcome back");
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [closing, setClosing] = useState(false);
    const [selectedProjectForAssign, setSelectedProjectForAssign] = useState(null);
    const [photographers, setPhotographers] = useState([]);
    const [editors, setEditors] = useState([]);
    const [selectedPhotographers, setSelectedPhotographers] = useState([]);
    const [selectedEditors, setSelectedEditors] = useState([]);
    const [assignedPrice, setAssignedPrice] = useState("");
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [availabilityMessage, setAvailabilityMessage] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserEmail(decoded.name || decoded.sub);
                setUserId(decoded.id);
            } catch (err) {
                console.error("Invalid token:", err);
                localStorage.removeItem("token");
            }
        }

        const fetchGoogleEvents = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:8080/api/google/events", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const formatted = data.map(event => ({ title: event.title, date: event.date }));
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
                    </div>
                </div>

                <div className="content-section right-section">
                    <div className="projects-card">
                        <div className="card-header"><h3>Your Projects Calendar</h3></div>
                        <div className="calendar-wrapper" style={{ padding: '20px' }}>
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                height="auto"
                                events={calendarEvents}
                                dateClick={(info) => {
                                    const clickedDate = info.dateStr;
                                    const isBooked = calendarEvents.some(ev => ev.date === clickedDate);
                                    setAvailabilityMessage(
                                        isBooked ? `❌ ${clickedDate} is not available for booking.` : `✅ ${clickedDate} is available for booking.`
                                    );
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

export default ManagerDashboard;
