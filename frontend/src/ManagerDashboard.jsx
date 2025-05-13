import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Layout from "./components/Layout";
import "./dash.css";

const ManagerDashboard = () => {
    const [userEmail, setUserEmail] = useState("Manager");
    const [greeting, setGreeting] = useState("Welcome back");
    const [pendingProjects, setPendingProjects] = useState([]);
    const [activeProjects, setActiveProjects] = useState([]);
    const [finishedProjects, setFinishedProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [closing, setClosing] = useState(false);
    const [selectedProjectForAssign, setSelectedProjectForAssign] = useState(null);
    const [photographers, setPhotographers] = useState([]);
    const [editors, setEditors] = useState([]);
    const [selectedPhotographers, setSelectedPhotographers] = useState([]);
    const [selectedEditors, setSelectedEditors] = useState([]);
    const [assignedPrice, setAssignedPrice] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserEmail(decoded.name || decoded.sub);
            } catch (err) {
                console.error("Invalid token:", err);
                localStorage.removeItem("token");
            }
        }

        const fetchAll = async () => {
            try {
                const token = localStorage.getItem("token");
                const [pendingRes, activeRes, finishedRes] = await Promise.all([
                    axios.get("/api/pending-projects", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/pending-projects/active", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/pending-projects/all-finished", { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setPendingProjects(pendingRes.data);
                setActiveProjects(activeRes.data);
                setFinishedProjects(finishedRes.data);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    useEffect(() => {
        if (selectedProjectForAssign) {
            const token = localStorage.getItem("token");
            const fetchUsers = async () => {
                try {
                    const res = await axios.get("/api/users", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const allUsers = res.data;
                    setPhotographers(allUsers.filter(user => user.role === "p"));
                    setEditors(allUsers.filter(user => user.role === "e"));
                } catch (error) {
                    console.error("Error fetching users:", error);
                }
            };
            fetchUsers();
        }
    }, [selectedProjectForAssign]);

    const handleProjectClick = (project) => {
        setSelectedProject(project);
    };

    const handleDecline = async (projectId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`/api/pending-projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingProjects(prev => prev.filter(p => p.id !== projectId));
            setSelectedProject(null);
        } catch (error) {
            console.error("Failed to delete project:", error);
        }
    };

    const handleCloseModal = () => {
        setClosing(true);
        setTimeout(() => {
            setSelectedProject(null);
            setClosing(false);
        }, 300);
    };

    async function activateProject(selectedProjectForAssign, selectedPhotographers, selectedEditors, assignedPrice) {
        try {
            const token = localStorage.getItem("token");
            await axios.post("/api/active_projects", {
                projectId: selectedProjectForAssign.id,
                photographers: selectedPhotographers,
                editors: selectedEditors,
                price: assignedPrice
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Project moved to active successfully!");
            setSelectedProjectForAssign(null);
            window.location.reload();
        } catch (error) {
            console.error("Activation failed:", error);
        }
    }

    const renderProjectList = (title, projects, color) => (
        <div className="projects-card">
            <div className="card-header"><h3>{title} Projects</h3></div>
            {loading ? <p>Loading...</p> :
                projects.length === 0 ? <p>No projects.</p> :
                    <div className="project-list">
                        {projects.map(project => (
                            <div key={project.id} className="project-item" onClick={() => handleProjectClick(project)}>
                                <div className="project-info">
                                    <h4>{project.title}</h4>
                                    <div className="client-info">
                                        <span className="client-name">{project.type}</span>
                                        <span className="project-date">{project.endDate}</span>
                                    </div>
                                </div>
                                <div className="project-status" style={{ backgroundColor: color }}>{title}</div>
                            </div>
                        ))}
                    </div>}
        </div>
    );

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="content-section left-section">
                    <div className="welcome-card">
                        <h2>{greeting}, {userEmail}!</h2>
                        <p>Project overview across all stages.</p>
                    </div>
                    {renderProjectList("Pending", pendingProjects, "#f0ad4e")}
                    {renderProjectList("Delivered", finishedProjects, "#5cb85c")}
                </div>
                <div className="content-section right-section">
                    {renderProjectList("Photographing", activeProjects.filter(p => p.state === 1), "#4a6fdc")}
                    {renderProjectList("Editing", activeProjects.filter(p => p.state === 2), "#5bc0de")}
                </div>
            </div>

            {selectedProject && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className={`modal-content ${closing ? "closing" : ""}`} onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={handleCloseModal}>×</button>
                        <h2>{selectedProject.title}</h2>
                        <p><strong>Type:</strong> {selectedProject.type}</p>
                        <p><strong>Description:</strong> {selectedProject.description}</p>
                        <p><strong>Requirements:</strong> {selectedProject.requirements}</p>
                        <p><strong>Price:</strong> ${selectedProject.price}</p>
                        <p><strong>Start Date:</strong> {selectedProject.creationDate}</p>
                        <p><strong>End Date:</strong> {selectedProject.endDate}</p>
                        {pendingProjects.some(p => p.id === selectedProject.id) && (
                            <div className="modal-actions">
                                <button className="accept-btn" onClick={() => {
                                    setSelectedProject(null);
                                    setSelectedProjectForAssign(selectedProject);
                                }}>Accept</button>
                                <button className="decline-btn" onClick={() => handleDecline(selectedProject.id)}>Decline</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedProjectForAssign && (
                <div className="modal-overlay" onClick={() => setSelectedProjectForAssign(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedProjectForAssign(null)}>×</button>
                        <h2>Assign Staff</h2>
                        <div className="assign-section">
                            <div className="staff-group">
                                <h3 className="staff-heading">Select Photographers</h3>
                                <div className="staff-list">
                                    {photographers.map(user => (
                                        <div key={user.id} className={`staff-card ${selectedPhotographers.includes(user.id) ? "selected" : ""}`}>
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPhotographers.includes(user.id)}
                                                    onChange={() =>
                                                        setSelectedPhotographers(prev =>
                                                            prev.includes(user.id)
                                                                ? prev.filter(id => id !== user.id)
                                                                : [...prev, user.id])}
                                                />
                                                <div className="staff-info">
                                                    <strong>{user.name}</strong>
                                                    <p>{user.email}</p>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="staff-group">
                                <h3 className="staff-heading">Select Editors</h3>
                                <div className="staff-list">
                                    {editors.map(user => (
                                        <div key={user.id} className={`staff-card ${selectedEditors.includes(user.id) ? "selected" : ""}`}>
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEditors.includes(user.id)}
                                                    onChange={() =>
                                                        setSelectedEditors(prev =>
                                                            prev.includes(user.id)
                                                                ? prev.filter(id => id !== user.id)
                                                                : [...prev, user.id])}
                                                />
                                                <div className="staff-info">
                                                    <strong>{user.name}</strong>
                                                    <p>{user.email}</p>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="assign-footer">
                                <input
                                    type="text"
                                    value={assignedPrice ? `${assignedPrice}$` : ""}
                                    onChange={e => {
                                        const raw = e.target.value.replace(/\$/g, "").trim();
                                        setAssignedPrice(raw);
                                    }}
                                    placeholder="Price"
                                    className="price-input"
                                />
                                <button className="accept-btn" onClick={() => activateProject(selectedProjectForAssign, selectedPhotographers, selectedEditors, assignedPrice)}>Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ManagerDashboard;