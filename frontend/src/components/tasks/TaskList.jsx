import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Grid,
    Typography,
    Box,
    Button,
    Chip,
    IconButton,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Autocomplete,
    Snackbar,
    Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Layout from '../Layout';
import Sidebar from '../layout/Sidebar';
import TopNavbar from '../layout/TopNavbar';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const API_URL = 'http://localhost:8080';

// -------------------- Mock Data --------------------
const mockTasks = [
    { id: 1, title: 'Edit Wedding Photos', description: 'Complete post-processing of Smith wedding photos', status: 'In Progress', priority: 'High', dueDate: '2024-03-20', assignedTo: 'John Doe', project: 'Smith Wedding' },
    { id: 2, title: 'Client Meeting', description: 'Discuss portfolio requirements with Johnson family', status: 'Pending', priority: 'Medium', dueDate: '2024-03-18', assignedTo: 'Jane Smith', project: 'Johnson Portrait' },
    { id: 3, title: 'Equipment Check', description: 'Prepare and test equipment for upcoming corporate event', status: 'Completed', priority: 'Low', dueDate: '2024-03-15', assignedTo: 'Mike Brown', project: 'Tech Corp Event' },
    { id: 4, title: 'Location Scout', description: 'Scout potential locations for outdoor photo shoot', status: 'Pending', priority: 'Medium', dueDate: '2024-03-22', assignedTo: 'Sarah Wilson', project: 'Fashion Brand Shoot' },
];

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [selectedTask, setSelectedTask] = useState(null);
    const [dialogMode, setDialogMode] = useState(null); // 'edit' or 'delete'
    const [editedTask, setEditedTask] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    
    // For sidebar and navigation
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };
    
    const isActiveRoute = (path) => {
        return location.pathname === path;
    };
    
    // Helper function to get auth header
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    };

    useEffect(() => {
        // Fetch tasks, projects and users
        fetchTasks();
        fetchProjects();
        fetchUsers();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/tasks`, getAuthHeader());
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setSnackbar({
                open: true,
                message: 'Failed to load tasks. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/projects`, getAuthHeader());
            console.log('Projects fetched:', response.data);
            
            if (Array.isArray(response.data)) {
                setProjects(response.data);
            } else {
                console.error('Projects data is not an array:', response.data);
                setProjects([]);
                setSnackbar({
                    open: true,
                    message: 'Failed to load projects. Invalid data format.',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
            setSnackbar({
                open: true,
                message: 'Failed to load projects. Please try again.',
                severity: 'error'
            });
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/users`, getAuthHeader());
            console.log('Users fetched:', response.data);
            
            if (Array.isArray(response.data)) {
                // Filter to only users that should be assignable to tasks
                const assignableUsers = response.data;
                setUsers(assignableUsers);
            } else {
                console.error('Users data is not an array:', response.data);
                setUsers([]);
                setSnackbar({
                    open: true,
                    message: 'Failed to load users. Invalid data format.',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
            setSnackbar({
                open: true,
                message: 'Failed to load users. Please try again.',
                severity: 'error'
            });
        }
    };

    const handleOpenDialog = (task, mode) => {
        setSelectedTask(task);
        setDialogMode(mode);
        
        if (mode === 'edit') {
            if (task) {
                // Edit existing task
                setEditedTask({
                    ...task,
                    // Ensure these fields exist
                    projectId: task.projectId || '',
                    project: task.project || '',
                    assignedToId: task.assignedToId || '',
                    assignedTo: task.assignedTo || '',
                    status: task.status || 'Pending',
                    priority: task.priority || 'Medium',
                    dueDate: formatDateForInput(task.dueDate) || formatDateForInput(new Date())
                });
                
                // Log what we're editing
                console.log("Editing task:", task);
                
                // If project or user references aren't set correctly, try to find them
                if (!task.projectId && task.project && projects.length > 0) {
                    // Try to find project by name
                    const foundProject = projects.find(p => 
                        p.name === task.project || p.title === task.project
                    );
                    if (foundProject) {
                        setEditedTask(prev => ({
                            ...prev,
                            projectId: foundProject.id
                        }));
                    }
                }
                
                if (!task.assignedToId && task.assignedTo && users.length > 0) {
                    // Try to find user by name
                    const fullName = task.assignedTo;
                    const foundUser = users.find(u => 
                        `${u.name || ''} ${u.surname || ''}`.trim() === fullName ||
                        u.name === fullName ||
                        u.email === fullName
                    );
                    if (foundUser) {
                        setEditedTask(prev => ({
                            ...prev,
                            assignedToId: foundUser.id
                        }));
                    }
                }
            } else {
                // Create new task
                setEditedTask({
                    title: '',
                    description: '',
                    status: 'Pending',
                    priority: 'Medium',
                    dueDate: formatDateForInput(new Date()),
                    assignedTo: '',
                    assignedToId: '',
                    project: '',
                    projectId: ''
                });
            }
        }
    };

    const handleCloseDialog = () => {
        setSelectedTask(null);
        setDialogMode(null);
        setEditedTask(null);
    };

    const handleSave = async () => {
        if (!editedTask) return;

        // Validate required fields
        if (!editedTask.title) {
            setSnackbar({
                open: true,
                message: 'Title is required',
                severity: 'error'
            });
            return;
        }

        if (!editedTask.projectId) {
            setSnackbar({
                open: true,
                message: 'Project is required',
                severity: 'error'
            });
            return;
        }

        if (!editedTask.assignedToId) {
            setSnackbar({
                open: true,
                message: 'Task must be assigned to someone',
                severity: 'error'
            });
            return;
        }

        try {
            // Ensure task has proper structure before saving
            const taskToSave = {
                ...editedTask,
                // Make sure these are set properly
                project: editedTask.project || '',
                projectId: editedTask.projectId || '',
                assignedTo: editedTask.assignedTo || '',
                assignedToId: editedTask.assignedToId || '',
                status: editedTask.status || 'Pending',
                priority: editedTask.priority || 'Medium',
                dueDate: formatDateForInput(editedTask.dueDate) || formatDateForInput(new Date())
            };
            
            console.log("Saving task:", taskToSave);

            if (selectedTask) {
                // Edit existing task
                await axios.put(`${API_URL}/api/tasks/${selectedTask.id}`, taskToSave, getAuthHeader());
                setSnackbar({
                    open: true,
                    message: 'Task updated successfully!',
                    severity: 'success'
                });
            } else {
                // Add new task
                await axios.post(`${API_URL}/api/tasks`, taskToSave, getAuthHeader());
                setSnackbar({
                    open: true,
                    message: 'Task created successfully!',
                    severity: 'success'
                });
            }
            
            // Refresh tasks list
            fetchTasks();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving task:', error);
            let errorMessage = 'Failed to save task. Please try again.';
            
            // Extract more detailed error message if available
            if (error.response && error.response.data) {
                console.error('Error response:', error.response.data);
                errorMessage = `Failed to save task: ${error.response.data}`;
            }
            
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        }
    };

    const handleDelete = async () => {
        if (!selectedTask) return;
        
        try {
            await axios.delete(`${API_URL}/api/tasks/${selectedTask.id}`, getAuthHeader());
            
            setSnackbar({
                open: true,
                message: 'Task deleted successfully!',
                severity: 'success'
            });
            
            // Refresh tasks list
            fetchTasks();
            handleCloseDialog();
        } catch (error) {
            console.error('Error deleting task:', error);
            setSnackbar({
                open: true,
                message: 'Failed to delete task. Please try again.',
                severity: 'error'
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedTask(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatDateForInput = (date) => {
        if (!date) return '';
        
        // If it's already a string in yyyy-MM-dd format, return as is
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;

        return [year, month, day].join('-');
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'success';
            case 'in progress': return 'warning';
            case 'pending': return 'info';
            default: return 'default';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'ALL') return true;
        return task.status.toUpperCase().replace(' ', '_') === filter;
    });

    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    return (
        <Layout>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Typography variant="h4">Tasks</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField select size="small" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 150 }}>
                            <MenuItem value="ALL">All Tasks</MenuItem>
                            <MenuItem value="PENDING">Pending</MenuItem>
                            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                            <MenuItem value="COMPLETED">Completed</MenuItem>
                        </TextField>
                        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog(null, 'edit')}>
                            New Task
                        </Button>
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredTasks.length === 0 ? (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '200px',
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <Typography variant="h6" color="text.secondary">
                            No tasks found. Create a new task to get started.
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {filteredTasks.map((task) => (
                            <Grid item xs={12} sm={6} md={4} key={task.id}>
                                <Card sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    <CardContent sx={{ flex: 1 }}>
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            mb: 2
                                        }}>
                                            <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                                                {task.title}
                                            </Typography>
                                            <Box sx={{
                                                display: 'flex',
                                                gap: 1,
                                                ml: 2
                                            }}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenDialog(task, 'edit')}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleOpenDialog(task, 'delete')}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                                            {task.description}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                            <Chip
                                                label={task.status}
                                                color={getStatusColor(task.status)}
                                                size="small"
                                            />
                                            <Chip
                                                label={task.priority}
                                                color={getPriorityColor(task.priority)}
                                                size="small"
                                            />
                                        </Box>
                                        <Box sx={{ mt: 'auto' }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                Project: {task.project}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                Assigned to: {task.assignedTo}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Due: {formatDateForInput(task.dueDate)}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Edit Dialog */}
                <Dialog
                    open={dialogMode === 'edit'}
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        {selectedTask ? 'Edit Task' : 'New Task'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Title"
                                name="title"
                                value={editedTask?.title || ''}
                                onChange={handleInputChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Description"
                                name="description"
                                value={editedTask?.description || ''}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                            />
                            <TextField
                                select
                                label="Status"
                                name="status"
                                value={editedTask?.status || ''}
                                onChange={handleInputChange}
                                fullWidth
                                required
                            >
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                            </TextField>
                            <TextField
                                select
                                label="Priority"
                                name="priority"
                                value={editedTask?.priority || ''}
                                onChange={handleInputChange}
                                fullWidth
                                required
                            >
                                <MenuItem value="High">High</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="Low">Low</MenuItem>
                            </TextField>
                            <TextField
                                label="Due Date"
                                name="dueDate"
                                type="date"
                                value={formatDateForInput(editedTask?.dueDate) || ''}
                                onChange={handleInputChange}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                            
                            {/* Project dropdown populated from database */}
                            <Autocomplete
                                options={projects}
                                getOptionLabel={(option) => {
                                    // Handle case when option is null or undefined
                                    if (!option) return '';
                                    return option.name || option.title || '';
                                }}
                                isOptionEqualToValue={(option, value) => {
                                    return option.id === (value?.id || editedTask?.projectId);
                                }}
                                value={projects.find(p => p.id === editedTask?.projectId) || null}
                                onChange={(event, newValue) => {
                                    console.log('Selected project:', newValue);
                                    setEditedTask(prev => ({
                                        ...prev,
                                        project: newValue ? newValue.name || newValue.title || '' : '',
                                        projectId: newValue ? newValue.id : null
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Project"
                                        fullWidth
                                        required
                                        error={projects.length === 0}
                                        helperText={projects.length === 0 ? "No projects available. Please create a project first." : ""}
                                    />
                                )}
                                noOptionsText="No projects available"
                            />
                            
                            {/* User dropdown populated from database */}
                            <Autocomplete
                                options={users}
                                getOptionLabel={(option) => {
                                    if (!option) return '';
                                    if (option.name && option.surname) return `${option.name} ${option.surname}`;
                                    if (option.name) return option.name;
                                    return option.email || '';
                                }}
                                isOptionEqualToValue={(option, value) => {
                                    return option.id === (value?.id || editedTask?.assignedToId);
                                }}
                                value={users.find(u => u.id === editedTask?.assignedToId) || null}
                                onChange={(event, newValue) => {
                                    console.log('Selected user:', newValue);
                                    setEditedTask(prev => ({
                                        ...prev,
                                        assignedTo: newValue ? 
                                            `${newValue.name || ''} ${newValue.surname || ''}`.trim() || newValue.email : '',
                                        assignedToId: newValue ? newValue.id : null
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Assigned To"
                                        fullWidth
                                        required
                                        error={users.length === 0}
                                        helperText={users.length === 0 ? "No users available. Please add users first." : ""}
                                    />
                                )}
                                noOptionsText="No users available"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button 
                            onClick={handleSave} 
                            variant="contained" 
                            color="primary"
                            disabled={!editedTask?.title || !editedTask?.status || !editedTask?.priority || !editedTask?.projectId || !editedTask?.assignedToId}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={dialogMode === 'delete'}
                    onClose={handleCloseDialog}
                >
                    <DialogTitle>Delete Task</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete this task? This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleDelete} color="error" variant="contained">
                            Delete
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
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Layout>
    );
};

export default TaskList;
