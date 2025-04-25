import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Typography, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, CircularProgress, Alert
} from '@mui/material';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [dialogMode, setDialogMode] = useState(null); // 'view' or 'create'
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        requirements: '',
        endDate: '',
        price: '',
        type: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);

    // Fetch projects from backend
    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token'); // ✅ Get the token
                if (!token) {
                    console.error('No token found!');
                    return;
                }

                const response = await fetch('http://localhost:8080/api/projects', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,  // ✅ Include your token here!
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch projects');
                }

                const data = await response.json();
                setProjects(data); // ✅ Assuming you have setProjects defined
            } catch (error) {
                console.error('Error fetching projects:', error);
                setError('Failed to load projects. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const handleOpenDialog = (project, mode) => {
        if (mode === 'view') {
            setSelectedProject(project);
        }
        setDialogMode(mode);
    };

    const handleCloseDialog = () => {
        setSelectedProject(null);
        setDialogMode(null);
        setNewProject({
            title: '',
            description: '',
            requirements: '',
            endDate: '',
            type: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProject(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateProject = async () => {
        setCreating(true);
        setError('');
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

            if (!response.ok) {
                throw new Error('Failed to create project.');
            }

            alert('Project created successfully');
            handleCloseDialog();

            // Refresh projects after creation
            const refreshed = await fetch('http://localhost:8080/api/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProjects(await refreshed.json());
        } catch (error) {
            setError(error.message);
        } finally {
            setCreating(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'success';
            case 'in progress': return 'warning';
            case 'pending': return 'info';
            default: return 'default';
        }
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5">Projects</Typography>
                    <Button variant="contained" color="primary" onClick={() => handleOpenDialog(null, 'create')}>
                        New Project
                    </Button>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>End Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell>{project.id}</TableCell>
                                        <TableCell>{project.title}</TableCell>
                                        <TableCell>{project.description}</TableCell>
                                        <TableCell>{project.type}</TableCell>
                                        <TableCell>
                                            <Chip label={project.status} color={getStatusColor(project.status)} size="small" />
                                        </TableCell>
                                        <TableCell>{project.endDate}</TableCell>
                                        <TableCell>
                                            <Button size="small" color="primary" onClick={() => handleOpenDialog(project, 'view')}>
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* View / Create Dialog */}
                <Dialog open={dialogMode === 'view' || dialogMode === 'create'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>{dialogMode === 'view' ? 'Project Details' : 'Create New Project'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Title"
                                name="title"
                                value={dialogMode === 'create' ? newProject.title : selectedProject?.title}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                label="Description"
                                name="description"
                                value={dialogMode === 'create' ? newProject.description : selectedProject?.description}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                                multiline
                                rows={4}
                            />
                            <TextField
                                label="Requirements"
                                name="requirements"
                                value={dialogMode === 'create' ? newProject.requirements : selectedProject?.requirements}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                select
                                label="Type"
                                name="type"
                                value={dialogMode === 'create' ? newProject.type : selectedProject?.type}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            >
                                <MenuItem value="Wedding">Wedding</MenuItem>
                                <MenuItem value="Corporate Event">Corporate Event</MenuItem>
                                <MenuItem value="Product Photography">Product Photography</MenuItem>
                                <MenuItem value="Portrait">Portrait</MenuItem>
                                <MenuItem value="Other">Other..</MenuItem>
                            </TextField>
                            <TextField
                                label="End Date"
                                name="endDate"
                                type="date"
                                value={dialogMode === 'create' ? newProject.endDate : selectedProject?.endDate}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                                InputLabelProps={{ shrink: true }}
                            />
                            {dialogMode === 'view' && (
                                <TextField
                                    label="Status"
                                    value={selectedProject?.status}
                                    fullWidth
                                    disabled
                                />
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>{dialogMode === 'view' ? 'Close' : 'Cancel'}</Button>
                        {dialogMode === 'create' && (
                            <Button
                                onClick={handleCreateProject}
                                variant="contained"
                                color="primary"
                                disabled={creating}
                            >
                                {creating ? <CircularProgress size={24} /> : 'Create'}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default ProjectList;
