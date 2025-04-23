import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Typography,
    Box,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import Layout from '../Layout';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [dialogMode, setDialogMode] = useState(null); // 'view', 'edit', 'delete'
    const [editedProject, setEditedProject] = useState(null);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Helper function to get auth header
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    };

    // Fetch projects from API
    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/projects`, getAuthHeader());
            setProjects(response.data);
            showSnackbar('Projects loaded successfully', 'success');
        } catch (error) {
            console.error('Error fetching projects:', error);
            showSnackbar('Failed to load projects: ' + (error.response?.data || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleOpenDialog = (project, mode) => {
        setSelectedProject(project);
        setDialogMode(mode);
        if (mode === 'edit') {
            setEditedProject({ ...project });
        }
    };

    const handleCloseDialog = () => {
        setSelectedProject(null);
        setDialogMode(null);
        setEditedProject(null);
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    const handleSave = async () => {
        if (!editedProject) return;

        try {
            setLoading(true);
            
            if (editedProject.id) {
                // Update existing project
                await axios.put(
                    `${API_URL}/api/projects/${editedProject.id}`, 
                    editedProject,
                    getAuthHeader()
                );
                showSnackbar('Project updated successfully', 'success');
            } else {
                // Create new project
                await axios.post(
                    `${API_URL}/api/projects`, 
                    editedProject,
                    getAuthHeader()
                );
                showSnackbar('Project created successfully', 'success');
            }
            
            // Refresh projects list
            fetchProjects();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving project:', error);
            showSnackbar('Failed to save project: ' + (error.response?.data || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedProject) return;

        try {
            setLoading(true);
            await axios.delete(
                `${API_URL}/api/projects/${selectedProject.id}`,
                getAuthHeader()
            );
            showSnackbar('Project deleted successfully', 'success');
            
            // Refresh projects list
            fetchProjects();
            handleCloseDialog();
        } catch (error) {
            console.error('Error deleting project:', error);
            showSnackbar('Failed to delete project: ' + (error.response?.data || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedProject(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getStatusColor = (status) => {
        if (!status) return 'default';
        
        switch (status.toLowerCase()) {
            case 'completed':
                return 'success';
            case 'in progress':
                return 'warning';
            case 'pending':
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" component="h2">
                        Projects
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleOpenDialog({
                            location: '',
                            cost: '',
                            type: '',
                            status: 'Pending',
                            startDate: '',
                            endDate: '',
                            description: '',
                            client: '',
                            email: '',
                            phone: ''
                        }, 'edit')}
                    >
                        New Project
                    </Button>
                </Box>

                {loading && projects.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Location</TableCell>
                                    <TableCell>Cost</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>End Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell>{project.location}</TableCell>
                                        <TableCell>{project.cost}</TableCell>
                                        <TableCell>{project.type}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={project.status}
                                                color={getStatusColor(project.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{project.startDate}</TableCell>
                                        <TableCell>{project.endDate}</TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                color="primary"
                                                sx={{ mr: 1 }}
                                                onClick={() => handleOpenDialog(project, 'view')}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                size="small"
                                                color="secondary"
                                                sx={{ mr: 1 }}
                                                onClick={() => handleOpenDialog(project, 'edit')}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() => handleOpenDialog(project, 'delete')}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {projects.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            No projects found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* View/Edit Dialog */}
                <Dialog
                    open={dialogMode === 'view' || dialogMode === 'edit'}
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        {dialogMode === 'view' ? 'Project Details' : 'Edit Project'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Client Name"
                                name="client"
                                value={dialogMode === 'edit' ? editedProject?.client : selectedProject?.client}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                label="Email"
                                name="email"
                                value={dialogMode === 'edit' ? editedProject?.email : selectedProject?.email}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                label="Phone"
                                name="phone"
                                value={dialogMode === 'edit' ? editedProject?.phone : selectedProject?.phone}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                label="Location"
                                name="location"
                                value={dialogMode === 'edit' ? editedProject?.location : selectedProject?.location}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                label="Cost"
                                name="cost"
                                value={dialogMode === 'edit' ? editedProject?.cost : selectedProject?.cost}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                label="Type"
                                name="type"
                                value={dialogMode === 'edit' ? editedProject?.type : selectedProject?.type}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                select
                                label="Status"
                                name="status"
                                value={dialogMode === 'edit' ? editedProject?.status : selectedProject?.status}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            >
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                            </TextField>
                            <TextField
                                label="Start Date"
                                name="startDate"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={dialogMode === 'edit' ? editedProject?.startDate : selectedProject?.startDate}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                label="End Date"
                                name="endDate"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={dialogMode === 'edit' ? editedProject?.endDate : selectedProject?.endDate}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                            <TextField
                                label="Description"
                                name="description"
                                multiline
                                rows={4}
                                value={dialogMode === 'edit' ? editedProject?.description : selectedProject?.description}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={dialogMode === 'view'}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>
                            {dialogMode === 'view' ? 'Close' : 'Cancel'}
                        </Button>
                        {dialogMode === 'edit' && (
                            <Button 
                                onClick={handleSave} 
                                variant="contained" 
                                color="primary"
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Save'}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={dialogMode === 'delete'}
                    onClose={handleCloseDialog}
                >
                    <DialogTitle>Delete Project</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete this project? This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button 
                            onClick={handleDelete} 
                            color="error" 
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar 
                    open={snackbar.open} 
                    autoHideDuration={6000} 
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert 
                        onClose={handleCloseSnackbar} 
                        severity={snackbar.severity} 
                        variant="filled"
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Layout>
    );
};

export default ProjectList; 