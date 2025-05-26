import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Layout from '../Layout';
import "../../dash.css";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const StaffProjectList = () => {
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);
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
    const [selectedStage, setSelectedStage] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const decoded = jwtDecode(token);
            setUserId(decoded.id);
            setUserRole(decoded.role);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const fetchAll = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                let pendingRes = { data: [] };

                if (userRole === "m") {
                    pendingRes = await axios.get("/api/pending-projects", { headers });
                    const [activeRes, finishedRes] = await Promise.all([
                        axios.get("/api/pending-projects/active", { headers }),
                        axios.get("/api/pending-projects/all-finished", { headers })
                    ]);
                    setPendingProjects(pendingRes.data);
                    setActiveProjects(activeRes.data);
                    setFinishedProjects(finishedRes.data);
                } else if (userRole === "p" || userRole === "e") {
                    const [activeRes, finishedRes] = await Promise.all([
                        axios.get("/api/my-active-projects", { headers }),
                        axios.get("/api/finished_projects", { headers })
                    ]);
                    setActiveProjects(activeRes.data);
                    setFinishedProjects(finishedRes.data);
                }
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userRole) fetchAll();
    }, [userRole]);

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

    const handleProjectClick = (project, title) => {
        if (title === "Pending" && userRole !== "m") return;
        setSelectedProject(project);
        if (project.state === 1) setSelectedStage("photographing");
        else if (project.state === 2) setSelectedStage("editing");
        else setSelectedStage(null);
    };

    const handleCloseModal = () => {
        setClosing(true);
        setTimeout(() => {
            setSelectedProject(null);
            setClosing(false);
        }, 300);
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

    const activateProject = async () => {
        try {
            const token = localStorage.getItem("token");
            const priceInCents = Math.round(parseFloat(assignedPrice) * 100);
            if (isNaN(priceInCents)) return alert("Invalid price");
            console.log("📤 Sending managerId:", userId);

            await axios.post("/api/active_projects", {
                projectId: selectedProjectForAssign.id,
                photographers: selectedPhotographers,
                editors: selectedEditors,
                price: priceInCents,
                managerId: userId,

            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Payment request sent!");
            setSelectedProjectForAssign(null);
            window.location.reload();
        } catch (err) {
            console.error("Activation error", err);
        }
    };

    const handleFinishProject = async () => {
        try {
            const token = localStorage.getItem("token");

            if (userRole === "p") {
                await axios.put("/api/active_projects", {
                    id: selectedProject.id,
                    state: 2
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                alert("Project moved to Editing stage.");
            } else if (userRole === "e") {
                // Editor finishes -> mark project as finished
                await axios.post(
                    `/api/finished_projects`,
                    null,
                    {
                        params: { projectId: selectedProject.id },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                alert("Project marked as finished.");
            }

            handleCloseModal();
            window.location.reload();
        } catch (err) {
            console.error("Finish error", err);
            alert("Failed to finish project.");
        }
    };


    const handleCallBack = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put("/api/active_projects/callback", {
                id: selectedProject.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Project sent back to photographing.");
            handleCloseModal();
            window.location.reload();
        } catch (err) {
            console.error("Callback error", err);
        }
    };

    const handleDownloadPhotos = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get("/api/active_projects/download_media", {
                params: { projectId: selectedProject.id },
                headers: { Authorization: `Bearer ${token}` }
            });
            const mediaFiles = response.data;

            const zip = new JSZip();
            mediaFiles.forEach(media => {
                const base64 = media.content.split(",").pop(); // Strip prefix
                zip.file(media.fileName, base64, { base64: true });
            });

            const blob = await zip.generateAsync({ type: "blob" });
            saveAs(blob, `${selectedProject.title || "media"}.zip`);
        } catch (error) {
            console.error("❌ Download error:", error);
            alert("Failed to download media.");
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFiles.length) return alert("Select files.");

        const formData = new FormData();
        selectedFiles.forEach(file => formData.append("files", file));
        formData.append("projectId", selectedProject.id);

        try {
            const token = localStorage.getItem("token");
            await axios.post("/api/upload_media", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            alert("Upload successful");
            setShowUploadModal(false);
        } catch (err) {
            console.error("Upload error", err);
        }
    };

    const renderProjectList = (title, projects, color) => (
        <div className="projects-card-row">
            <div className="card-header"><h3>{title} Projects</h3></div>
            {loading ? <p>Loading...</p> :
                projects.length === 0 ? <p>No projects.</p> :
                    <div className="project-list">
                        {projects.map(project => (
                            <div key={project.id} className="project-item"
                                 onClick={() => handleProjectClick(project, title)}
                                 style={{ cursor: title === "Pending" && userRole !== "m" ? "not-allowed" : "pointer" }}>
                                <div className="project-info">
                                    <h4>{project.title}</h4>
                                    <div className="client-info">
                                        <span className="client-name">{project.type}</span>
                                        <span className="project-date">{project.endDate}</span>
                                    </div>
                                </div>
                                <div className="project-status" style={{ backgroundColor: color }}>
                                    {project.state === -1 ? "Pending" : project.state === 0 ? "Awaiting Payment" : title}
                                </div>
                            </div>
                        ))}
                    </div>}
        </div>
    );

    return (
        <Layout>
            <div className="dashboard-content-row">
                {userRole === "m" && renderProjectList("Pending", pendingProjects, "#f0ad4e")}
                {renderProjectList("Photographing", activeProjects.filter(p => p.state === 1), "#4a6fdc")}
                {renderProjectList("Editing", activeProjects.filter(p => p.state === 2), "#5bc0de")}
                {renderProjectList("Delivered", finishedProjects, "#5cb85c")}
            </div>

            {selectedProject && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className={`modal-content ${closing ? "closing" : ""}`} onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={handleCloseModal}>×</button>
                        <h2>{selectedProject.title}</h2>
                        <p><strong>Type:</strong> {selectedProject.type}</p>
                        <p><strong>Description:</strong> {selectedProject.description}</p>
                        <p><strong>Requirements:</strong> {selectedProject.requirements}</p>
                        <p><strong>Price:</strong> ${selectedProject.price / 100}</p>
                        <p><strong>Start Date:</strong> {selectedProject.creationDate}</p>
                        <p><strong>End Date:</strong> {selectedProject.endDate}</p>
                        {selectedProject.photographers && selectedProject.photographers.length > 0 && (
                            <p><strong>Photographers:</strong> {selectedProject.photographers.join(", ")}</p>
                        )}
                        {selectedProject.editors && selectedProject.editors.length > 0 && (
                            <p><strong>Editors:</strong> {selectedProject.editors.join(", ")}</p>
                        )}

                        {userRole === "m" && pendingProjects.some(p => p.id === selectedProject.id) && (
                            <div className="modal-actions">
                                <button className="accept-btn" onClick={() => {
                                    setSelectedProject(null);
                                    setSelectedProjectForAssign(selectedProject);
                                }}>Accept</button>
                                <button className="decline-btn" onClick={() => handleDecline(selectedProject.id)}>Decline</button>
                            </div>
                        )}

                        {userRole === "p" && selectedStage === "photographing" && (
                            <div className="modal-actions">
                                <button className="finish-btn" onClick={handleFinishProject}>Finish</button>
                                <button className="accept-btn" onClick={() => setShowUploadModal(true)}>Upload Media</button>
                            </div>
                        )}

                        {userRole === "e" && selectedStage === "editing" && (
                            <div className="modal-actions">
                                <button className="accept-btn" onClick={handleDownloadPhotos}>
                                    Download Photos
                                </button>
                                <button className="accept-btn" onClick={() => setShowUploadModal(true)}>
                                    Upload Media
                                </button>
                                <button className="finish-btn" onClick={handleFinishProject}>
                                    Finish
                                </button>
                            </div>
                        )}

                        {userRole === "p" && selectedStage === "editing" && (
                            <div className="modal-actions">
                                <button className="decline-btn" onClick={handleCallBack}>Call Back</button>
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
                                    value={assignedPrice ? `${assignedPrice}` : ""}
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

            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowUploadModal(false)}>×</button>
                        <h2>Upload Media</h2>
                        <input type="file" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files))} />
                        <div className="modal-actions">
                            <button className="accept-btn" onClick={handleFileUpload}>Upload</button>
                            <button className="decline-btn" onClick={() => setShowUploadModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default StaffProjectList;
