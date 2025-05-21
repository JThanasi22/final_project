import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import {
    Typography,
    TextField,
    MenuItem,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    CircularProgress,
    Alert,
    LinearProgress
} from '@mui/material';
import '../../dash.css';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState(null);
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        requirements: '',
        endDate: '',
        price: '',
        type: ''
    });
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAllProjects();
    }, []);

    const fetchAllProjects = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            const [pendingRes, activeRes, finishedRes] = await Promise.all([
                fetch('http://localhost:8080/api/client-projects/pending', { headers }),
                fetch('http://localhost:8080/api/client-projects/active', { headers }),
                fetch('http://localhost:8080/api/client-projects/finished', { headers })
            ]);

            if (!pendingRes.ok || !activeRes.ok || !finishedRes.ok) {
                throw new Error('Failed to fetch projects.');
            }

            const pending = await pendingRes.json();
            const active = await activeRes.json();
            const finished = await finishedRes.json();

            const all = [...pending, ...active, ...finished];
            all.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
            setProjects(all);
        } catch (err) {
            console.error(err);
            setError('Failed to load projects.');
        } finally {
            setLoading(false);
        }
    };


    const getStatusLabel = (project) => {
        if (project.status === 'finished') return 'Finished';
        if (project.state === 1) return 'Photographing';
        if (project.state === 2) return 'Editing';
        return 'Pending';
    };

    const getStatusColor = (project) => {
        if (project.status === 'finished') return '#5cb85c'; // green
        if (project.state === 1) return '#f0ad4e'; // orange
        if (project.state === 2) return '#5bc0de'; // blue
        return '#f28b82'; // light red for pending
    };

    const finishedCount = projects.filter(p => p.status === 'finished').length;
    const progress = projects.length ? (finishedCount / projects.length) * 100 : 0;

    const handleOpenDialog = (project, mode) => {
        if (mode === 'view') setSelectedProject(project);
        setDialogMode(mode);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedProject(null);
        setDialogMode(null);
        setNewProject({
            title: '',
            description: '',
            requirements: '',
            endDate: '',
            price: '',
            type: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProject(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateProject = async () => {
        setCreating(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newProject)
            });
            if (!response.ok) throw new Error('Failed to create project');

            await fetchAllProjects();
            handleCloseDialog();
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="content-section left-section">
                    <div className="projects-card">
                        <div className="card-header">
                            <h3>Your Projects</h3>
                            <Button className="accept-btn" onClick={() => handleOpenDialog(null, 'create')}>New Project</Button>
                        </div>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Completion Progress: {Math.round(progress)}%
                            </Typography>
                            <LinearProgress variant="determinate" value={progress} />
                        </Box>

                        {loading ? (
                            <p>Loading...</p>
                        ) : error ? (
                            <Alert severity="error">{error}</Alert>
                        ) : projects.length === 0 ? (
                            <p>No projects found.</p>
                        ) : (
                            <div className="project-list">
                                {projects.map(project => (
                                    <div
                                        key={project.id}
                                        className="project-item"
                                        onClick={() => handleOpenDialog(project, 'view')}
                                    >
                                        <div className="project-info">
                                            <h4>{project.title}</h4>
                                            <div className="client-info">
                                                <span className="client-name">{project.type}</span>
                                                <span className="project-date">{project.endDate}</span>
                                            </div>
                                            <p>{project.description}</p>
                                        </div>
                                        <div className="project-status" style={{ backgroundColor: getStatusColor(project) }}>
                                            {getStatusLabel(project)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {dialogMode === 'view' ? 'Project Details' : 'Create New Project'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Title"
                                name="title"
                                value={dialogMode === 'create' ? newProject.title : selectedProject?.title || ''}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                label="Description"
                                name="description"
                                value={dialogMode === 'create' ? newProject.description : selectedProject?.description || ''}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                                multiline
                                rows={3}
                            />
                            <TextField
                                label="Requirements"
                                name="requirements"
                                value={dialogMode === 'create' ? newProject.requirements : selectedProject?.requirements || ''}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                select
                                label="Type"
                                name="type"
                                value={dialogMode === 'create' ? newProject.type : selectedProject?.type || ''}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            >
                                <MenuItem value="Wedding">Wedding</MenuItem>
                                <MenuItem value="Corporate Event">Corporate Event</MenuItem>
                                <MenuItem value="Product Photography">Product Photography</MenuItem>
                                <MenuItem value="Portrait">Portrait</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                            </TextField>
                            <TextField
                                type="date"
                                label="End Date"
                                name="endDate"
                                value={dialogMode === 'create' ? newProject.endDate : selectedProject?.endDate || ''}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            {dialogMode === 'view' && (
                                <>
                                    <TextField label="Status" value={getStatusLabel(selectedProject)} fullWidth disabled />
                                    <TextField label="Price" value={selectedProject?.price || 'Not Set'} fullWidth disabled />
                                    <TextField label="Creation Date" value={selectedProject?.creationDate || 'N/A'} fullWidth disabled />
                                </>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Close</Button>
                        {dialogMode === 'create' && (
                            <Button onClick={handleCreateProject} variant="contained" color="primary" disabled={creating}>
                                {creating ? <CircularProgress size={20} /> : 'Create'}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
};

export default ProjectList;
