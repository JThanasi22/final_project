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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Layout from '../Layout';

const mockTasks = [
    {
        id: 1,
        title: 'Edit Wedding Photos',
        description: 'Complete post-processing of Smith wedding photos',
        status: 'In Progress',
        priority: 'High',
        dueDate: '2024-03-20',
        assignedTo: 'John Doe',
        project: 'Smith Wedding'
    },
    {
        id: 2,
        title: 'Client Meeting',
        description: 'Discuss portfolio requirements with Johnson family',
        status: 'Pending',
        priority: 'Medium',
        dueDate: '2024-03-18',
        assignedTo: 'Jane Smith',
        project: 'Johnson Portrait'
    },
    {
        id: 3,
        title: 'Equipment Check',
        description: 'Prepare and test equipment for upcoming corporate event',
        status: 'Completed',
        priority: 'Low',
        dueDate: '2024-03-15',
        assignedTo: 'Mike Brown',
        project: 'Tech Corp Event'
    },
    {
        id: 4,
        title: 'Location Scout',
        description: 'Scout potential locations for outdoor photo shoot',
        status: 'Pending',
        priority: 'Medium',
        dueDate: '2024-03-22',
        assignedTo: 'Sarah Wilson',
        project: 'Fashion Brand Shoot'
    },
];

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [selectedTask, setSelectedTask] = useState(null);
    const [dialogMode, setDialogMode] = useState(null); // 'edit' or 'delete'
    const [editedTask, setEditedTask] = useState(null);

    useEffect(() => {
        // Simulating API call with mock data
        setTasks(mockTasks);
    }, []);

    const handleOpenDialog = (task, mode) => {
        setSelectedTask(task);
        setDialogMode(mode);
        if (mode === 'edit') {
            setEditedTask(task ? { ...task } : {
                id: tasks.length + 1,
                title: '',
                description: '',
                status: 'Pending',
                priority: 'Medium',
                dueDate: '',
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

    const handleSave = () => {
        if (!editedTask) return;

        if (selectedTask) {
            // Edit existing task
            setTasks(tasks.map(task =>
                task.id === editedTask.id ? editedTask : task
            ));
        } else {
            // Add new task
            setTasks([...tasks, editedTask]);
        }
        handleCloseDialog();
    };

    const handleDelete = () => {
        if (!selectedTask) return;
        setTasks(tasks.filter(task => task.id !== selectedTask.id));
        handleCloseDialog();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedTask(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getStatusColor = (status) => {
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

    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
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
        return task.status.toUpperCase().replace(' ', '_') === filter;
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
                            <Button onClick={handleSave} variant="contained" color="primary">
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
                </Box>
            </div>
        </Layout>
    );
};

export default TaskList; 