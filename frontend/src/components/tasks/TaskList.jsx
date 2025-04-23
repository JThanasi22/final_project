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
    Snackbar,
    Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Layout from '../Layout';
import axios from 'axios';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [selectedTask, setSelectedTask] = useState(null);
    const [dialogMode, setDialogMode] = useState(null); // 'edit' or 'delete'
    const [editedTask, setEditedTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const API_URL = 'http://localhost:8080';

    // Helper function to get token from localStorage
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showSnackbar('You are not logged in. Please log in first.', 'error');
            setError('Authentication required. Please log in.');
            return null;
        }
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const headers = getAuthHeader();
            if (!headers) {
                setLoading(false);
                return;
            }

            console.log('Fetching tasks...');
            const response = await axios.get(`${API_URL}/api/tasks`, headers);
            
            console.log('Tasks response:', response);
            
            if (response.data && Array.isArray(response.data)) {
                setTasks(response.data);
                console.log(`Loaded ${response.data.length} tasks`);
                
                if (response.data.length === 0) {
                    // Empty array is ok, just no tasks yet
                    console.log('No tasks found');
                }
            } else {
                console.error('Invalid response format:', response.data);
                setError('Received invalid data from server');
                showSnackbar('Received invalid data from server', 'error');
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
            
            // Check if it's an authentication error
            if (err.response && err.response.status === 401) {
                setError('Authentication error. Please log in again.');
                showSnackbar('Session expired. Please log in again.', 'error');
            } 
            // Check if it's a server error with message
            else if (err.response && err.response.data) {
                setError(err.response.data);
                showSnackbar(err.response.data, 'error');
            } 
            // Generic error
            else {
                setError('Failed to load tasks. Server may be unavailable.');
                showSnackbar('Failed to load tasks', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleOpenDialog = (task, mode) => {
        setSelectedTask(task);
        setDialogMode(mode);
        if (mode === 'edit') {
            setEditedTask(task ? { ...task } : {
                title: '',
                description: '',
                status: 'Pending',
                priority: 'Medium',
                dueDate: new Date().toISOString().split('T')[0],
                assignedTo: '',
                project: ''
            });
        }
    };

    const handleCloseDialog = () => {
        setSelectedTask(null);
        setDialogMode(null);
        setEditedTask(null);
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

    const validateTaskData = () => {
        if (!editedTask.title || editedTask.title.trim() === '') {
            showSnackbar('Title is required', 'error');
            return false;
        }
        if (!editedTask.status) {
            showSnackbar('Status is required', 'error');
            return false;
        }
        if (!editedTask.priority) {
            showSnackbar('Priority is required', 'error');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!editedTask) return;
        if (!validateTaskData()) return;

        try {
            setLoading(true);
            setError(null);

            const headers = getAuthHeader();
            if (!headers) {
                setLoading(false);
                return;
            }

            if (selectedTask) {
                // Edit existing task
                console.log('Updating task:', selectedTask.id);
                const response = await axios.put(
                    `${API_URL}/api/tasks/${selectedTask.id}`,
                    editedTask,
                    headers
                );
                
                if (response.data && response.data.id) {
                    showSnackbar('Task updated successfully', 'success');
                } else {
                    showSnackbar('Task updated but response was unexpected', 'warning');
                }
            } else {
                // Add new task
                console.log('Creating new task');
                const response = await axios.post(
                    `${API_URL}/api/tasks`,
                    editedTask,
                    headers
                );
                
                if (response.data && response.data.id) {
                    showSnackbar('Task created successfully', 'success');
                } else {
                    showSnackbar('Task created but response was unexpected', 'warning');
                }
            }
            
            fetchTasks();
            handleCloseDialog();
        } catch (err) {
            console.error('Error saving task:', err);
            
            if (err.response && err.response.data) {
                setError(err.response.data);
                showSnackbar(err.response.data, 'error');
            } else {
                setError('Failed to save task. Please try again.');
                showSnackbar('Failed to save task', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTask) return;
        
        try {
            setLoading(true);
            setError(null);
            
            const headers = getAuthHeader();
            if (!headers) {
                setLoading(false);
                return;
            }
            
            console.log('Deleting task:', selectedTask.id);
            const response = await axios.delete(
                `${API_URL}/api/tasks/${selectedTask.id}`,
                headers
            );
            
            console.log('Delete response:', response);
            showSnackbar('Task deleted successfully', 'success');
            
            fetchTasks();
            handleCloseDialog();
        } catch (err) {
            console.error('Error deleting task:', err);
            
            if (err.response && err.response.data) {
                setError(err.response.data);
                showSnackbar(err.response.data, 'error');
            } else {
                setError('Failed to delete task. Please try again.');
                showSnackbar('Failed to delete task', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedTask(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
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

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'ALL') return true;
        return task.status?.toUpperCase().replace(' ', '_') === filter;
    });

    return (
        <Layout>
            <div className="task-container" style={{ padding: '24px', height: '100%', width: '100%' }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    height: '100%',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <Typography variant="h4">
                            Tasks
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                select
                                size="small"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                sx={{ minWidth: 150 }}
                            >
                                <MenuItem value="ALL">All Tasks</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                <MenuItem value="COMPLETED">Completed</MenuItem>
                            </TextField>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog(null, 'edit')}
                            >
                                New Task
                            </Button>
                        </Box>
                    </Box>

                    {loading && tasks.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Box sx={{ 
                            p: 3, 
                            bgcolor: '#FFF4F4', 
                            borderRadius: '12px', 
                            color: '#D32F2F',
                            textAlign: 'center'
                        }}>
                            <Typography>{error}</Typography>
                            <Button 
                                variant="outlined" 
                                color="error" 
                                sx={{ mt: 2 }}
                                onClick={fetchTasks}
                            >
                                Retry
                            </Button>
                        </Box>
                    ) : filteredTasks.length === 0 ? (
                        <Box sx={{ 
                            p: 5, 
                            bgcolor: '#F5F7FA', 
                            borderRadius: '12px', 
                            textAlign: 'center' 
                        }}>
                            <Typography variant="h6" color="text.secondary">
                                No tasks found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Get started by creating a new task
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                sx={{ mt: 2 }}
                                onClick={() => handleOpenDialog(null, 'edit')}
                            >
                                Create Task
                            </Button>
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
                                                    Due: {task.dueDate}
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
                                    value={editedTask?.dueDate || ''}
                                    onChange={handleInputChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Assigned To"
                                    name="assignedTo"
                                    value={editedTask?.assignedTo || ''}
                                    onChange={handleInputChange}
                                    fullWidth
                                />
                                <TextField
                                    label="Project"
                                    name="project"
                                    value={editedTask?.project || ''}
                                    onChange={handleInputChange}
                                    fullWidth
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button 
                                onClick={handleSave} 
                                variant="contained" 
                                color="primary"
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Save'}
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
                            sx={{ width: '100%' }}
                        >
                            {snackbar.message}
                        </Alert>
                    </Snackbar>
                </Box>
            </div>
        </Layout>
    );
};

export default TaskList; 