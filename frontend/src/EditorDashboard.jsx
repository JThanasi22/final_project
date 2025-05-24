import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Layout from "./components/Layout";
import "./dash.css";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const EditorDashboard = () => {
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
            const activeRes = await axios.get("/api/active_projects", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const allProjects = activeRes.data;
            setPhotographingProjects(allProjects.filter(p => p.state === 1));
            setEditingProjects(allProjects.filter(p => p.state === 2));

            const finishedRes = await axios.get("/api/finished_projects", {
                headers: { Authorization: `Bearer ${token}` }
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

    const handleFinishProject = async () => {
        const token = localStorage.getItem("token");

        try {
            await axios.post(
                `/api/finished_projects`,
                null,
                {
                    params: { projectId: selectedProject.id },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log("✅ Project moved to finished.");
        } catch (error) {
            console.warn("⚠️ Error finishing project:", error);
        }

        handleCloseModal();
        setLoading(true);
        await fetchProjects();
    };

    const handleDownloadPhotos = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get("/api/active_projects/download_media", {
                params: { projectId: selectedProject.id },
                headers: { Authorization: `Bearer ${token}` }
            });
            const mediaFiles = response.data; // [{ fileName, content }, ...]

            // Build a ZIP just like in PortfolioGrid
            const zip = new JSZip();
            mediaFiles.forEach(media => {
                // strip any "data:*;base64," prefix if present
                const base64 = media.content.split(",").pop();
                zip.file(media.fileName, base64, { base64: true });
            });

            // Generate the blob and prompt save
            const blob = await zip.generateAsync({ type: "blob" });
            saveAs(blob, `${selectedProject.title || "media"}.zip`);
        } catch (error) {
            console.error("❌ Error downloading media:", error);
            alert("Failed to download media.");
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
                "/api/upload_final_media",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            console.log("✅ Final upload response:", response.data);
            alert("Final files uploaded successfully!");
            setShowUploadModal(false);
            setSelectedFiles([]); // reset
        } catch (error) {
            console.error("❌ Final upload error:", error);
            alert("Upload failed. Please try again.");
        }
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
                    </div>

                    <div className="content-section right-section">
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

                        {selectedStage === "editing" && (
                            <div className="modal-actions">
                                <button className="accept-btn" onClick={handleDownloadPhotos}>
                                    Download Photos
                                </button>
                                <button className="accept-btn" onClick={handleUploadMedia}>
                                    Upload Media
                                </button>
                                <button className="accept-btn" onClick={handleFinishProject}>
                                    Finish
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowUploadModal(false)}>×</button>
                        <h2>Upload Final Media</h2>
                        <input
                            type="file"
                            multiple
                            onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                        />
                        <div className="modal-actions">
                            <button className="accept-btn" onClick={handleFileUpload}>
                                Upload
                            </button>
                            <button className="decline-btn" onClick={() => setShowUploadModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditorDashboard;
