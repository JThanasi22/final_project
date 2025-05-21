import React, { useEffect, useState } from "react";
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
} from "@mui/material";
import Layout from "../Layout";
import "../../dash.css";

const PortfolioGrid = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/portfolio", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProjects(res.data);
            } catch (err) {
                console.error("Failed to fetch portfolio:", err);
            }
        };

        fetchProjects();
    }, []);

    const handleOpen = (project) => {
        setSelectedProject(project);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedProject(null);
    };

    const handleDownload = (fileName, content) => {
        const link = document.createElement("a");
        link.href = `data:image/jpeg;base64,${content}`;
        link.download = fileName;
        link.click();
    };

    const handleDownloadAll = async () => {
        const zip = new JSZip();

        selectedProject?.finalMedia?.forEach((media) => {
            const base64Data = media.content.split(",").pop(); // just in case there's a prefix
            zip.file(media.fileName, base64Data, { base64: true });
        });

        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, `${selectedProject.title || "portfolio"}.zip`);
    };


    return (
        <Layout>
            <div className="dashboard-content">
                <div className="content-section">
                    <div className="projects-card">
                        <div className="card-header">
                            <h3>Portfolio</h3>
                        </div>
                        <div
                            className="project-grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "24px",
                                marginTop: "24px",
                            }}
                        >
                            {projects.map((project) => (
                                <Card
                                    key={project.id}
                                    className="task-card"
                                    style={{
                                        height: "260px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        borderRadius: "16px",
                                        padding: "16px",
                                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                        transition: "transform 0.2s, box-shadow 0.2s",
                                        border: "1px solid #e0e0e0",
                                        backgroundColor: "#fff",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "scale(1.02)";
                                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }}
                                >
                                <CardContent>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {project.title}
                                        </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                                        {project.description}
                                    </Typography>

                                    <Typography variant="caption" sx={{ display: "block", color: "#555" }}>
                                        Type: <strong>{project.type || "N/A"}</strong>
                                    </Typography>

                                    <Typography variant="caption" sx={{ color: "#555" }}>
                                        Photos: <strong>{project.finalMedia?.length || 0}</strong>
                                    </Typography>
                                </CardContent>
                                    <CardActions>
                                        <Button
                                            onClick={() => handleOpen(project)}
                                            variant="contained"
                                            size="small"
                                            fullWidth
                                        >
                                            View Photos
                                        </Button>
                                    </CardActions>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{selectedProject?.title} - Final Images</DialogTitle>
                <DialogContent>
                    <Button
                        onClick={handleDownloadAll}
                        variant="contained"
                        sx={{ mb: 2 }}
                    >
                        Download All as ZIP
                    </Button>
                    <Box
                        display="grid"
                        gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))"
                        gap={2}
                        sx={{ mt: 1 }}
                    >
                        {selectedProject?.finalMedia?.map((media, idx) => (
                            <Box key={idx} textAlign="center">
                                <img
                                    src={`data:image/jpeg;base64,${media.content}`}
                                    alt={media.fileName}
                                    style={{ width: "100%", borderRadius: "10px" }}
                                />
                                <Button
                                    onClick={() => handleDownload(media.fileName, media.content)}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    sx={{ mt: 1 }}
                                >
                                    Download
                                </Button>
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
            </Dialog>
        </Layout>
    );
};

export default PortfolioGrid;
