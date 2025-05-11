import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Layout from "./components/Layout";
import "./dash.css";

const PhotographerDashboard = () => {
    const [userEmail, setUserEmail] = useState("User");
    const [greeting, setGreeting] = useState("Welcome back");
    const [loading, setLoading] = useState(true);
    const [photographingProjects, setPhotographingProjects] = useState([]);
    const [editingProjects, setEditingProjects] = useState([]);
    const [finishedProjects, setFinishedProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedStage, setSelectedStage] = useState(null);
    const [closing, setClosing] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserEmail(decoded.name || decoded.sub);
            } catch (err) {
                console.error("Invalid token:", err);
            }
        }
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem("token");
            const activeRes = await axios.get("/api/my-active-projects", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const allProjects = activeRes.data;
            setPhotographingProjects(allProjects.filter((p) => p.state === 1));
            setEditingProjects(allProjects.filter((p) => p.state === 2));

            const finishedRes = await axios.get("/api/finished_projects", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFinishedProjects(finishedRes.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectClick = (project, stage) => {
        setSelectedProject(project);
        setSelectedStage(stage);
    };

    const handleCloseModal = () => {
        setClosing(true);
        setTimeout(() => {
            setSelectedProject(null);
            setSelectedStage(null);
            setClosing(false);
        }, 300);
    };

    const handleCallBack = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(
                "/api/active_projects/callback",
                { id: selectedProject.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Project sent back to photographing stage.");
            handleCloseModal();
            setLoading(true);
            await fetchProjects();
        } catch (error) {
            console.error("Error calling back project:", error);
            alert("Failed to send project back.");
        }
    };

    const handleUploadMedia = () => {
        setShowUploadModal(true);
    };

    const handleFileUpload = async () => {
        if (!selectedFiles || selectedFiles.length === 0) {
            alert("Please select files to upload.");
            return;
        }

        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append("files", file);
        });
        formData.append("projectId", selectedProject.id);

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "/api/upload_media",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            console.log("✅ Upload response:", response.data);
            alert("Files uploaded successfully!");
            setShowUploadModal(false);
            setSelectedFiles([]);
        } catch (error) {
            console.error("❌ Upload error:", error);
            alert("Upload failed. Please try again.");
        }
    };

    const handleFinishProject = async () => {
        const confirmFinish = window.confirm("Are you sure you want to mark this project as finished and send it to editing?");
        if (!confirmFinish) return;

        const token = localStorage.getItem("token");

        try {
            await axios.put(
                "/api/active_projects",
                {
                    id: selectedProject.id,
                    state: 2,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("✅ Project state updated successfully.");
        } catch (error) {
            console.warn("⚠️ Project updated but error occurred:", error);
        }

        handleCloseModal();
        setLoading(true);
        await fetchProjects();
    };

    const renderProjectCards = (projects, stage, statusLabel, statusColor) => (
        <div className="project-list">
            {projects.map((p) => (
                <div
                    key={p.id}
                    className="project-item"
                    onClick={() => handleProjectClick(p, stage)}
                    style={{ cursor: "pointer" }}
                >
                    <div className="project-info">
                        <h4>{p.title}</h4>
                        <div className="client-info">
                            <span className="client-name">{p.type}</span>
                            <span className="project-date">{p.endDate}</span>
                        </div>
                    </div>
                    <div className="project-status" style={{ backgroundColor: statusColor }}>
                        {statusLabel}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <Layout>
                <div className="dashboard-content">
                    <div className="content-section left-section">
                        <div className="welcome-card">
                            <h2>{greeting}, {userEmail}!</h2>
                            <p>Here’s your project workflow stages.</p>
                        </div>

                        <div className="projects-card">
                            <div className="card-header">
                                <h3>Photographing Stage</h3>
                            </div>
                            {loading ? (
                                <p>Loading...</p>
                            ) : photographingProjects.length === 0 ? (
                                <p>No projects in this stage.</p>
                            ) : (
                                renderProjectCards(photographingProjects, "photographing", "Photographing", "#f0ad4e")
                            )}
                        </div>
                    </div>

                    <div className="content-section right-section">
                        <div className="projects-card">
                            <div className="card-header">
                                <h3>Editing Stage</h3>
                            </div>
                            {loading ? (
                                <p>Loading...</p>
                            ) : editingProjects.length === 0 ? (
                                <p>No projects in this stage.</p>
                            ) : (
                                renderProjectCards(editingProjects, "editing", "Editing", "#4a6fdc")
                            )}
                        </div>

                        <div className="projects-card delivered">
                            <div className="card-header">
                                <h3>Delivered</h3>
                            </div>
                            {loading ? (
                                <p>Loading...</p>
                            ) : finishedProjects.length === 0 ? (
                                <p>No delivered projects yet.</p>
                            ) : (
                                renderProjectCards(finishedProjects, "finished", "Delivered", "#5cb85c")
                            )}
                        </div>
                    </div>
                </div>
            </Layout>

            {selectedProject && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className={`modal-content ${closing ? "closing" : ""}`} onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={handleCloseModal}>×</button>
                        <h2>{selectedProject.title}</h2>
                        <p><strong>Type:</strong> {selectedProject.type}</p>
                        <p><strong>Description:</strong> {selectedProject.description}</p>
                        <p><strong>Requirements:</strong> {selectedProject.requirements}</p>
                        <p><strong>Price:</strong> ${selectedProject.price}</p>
                        <p><strong>Start Date:</strong> {selectedProject.creationDate}</p>
                        <p><strong>End Date:</strong> {selectedProject.endDate}</p>
                        {selectedProject.photographers && selectedProject.photographers.length > 0 && (
                            <p><strong>Photographers:</strong> {selectedProject.photographers.join(", ")}</p>
                        )}
                        {selectedProject.editors && selectedProject.editors.length > 0 && (
                            <p><strong>Editors:</strong> {selectedProject.editors.join(", ")}</p>
                        )}

                        {selectedStage === "photographing" && (
                            <div className="modal-actions">
                                <button className="finish-btn" onClick={handleFinishProject}>Finish</button>
                                <button className="accept-btn" onClick={handleUploadMedia}>Upload Media</button>
                            </div>
                        )}

                        {selectedStage === "editing" && (
                            <div className="modal-actions">
                                <button className="decline-btn" onClick={handleCallBack}>Call Back</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowUploadModal(false)}>×</button>
                        <h2>Upload Media</h2>
                        <input
                            type="file"
                            multiple
                            onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                        />
                        <div className="modal-actions">
                            <button className="accept-btn" onClick={handleFileUpload}>Upload</button>
                            <button className="decline-btn" onClick={() => setShowUploadModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PhotographerDashboard;
