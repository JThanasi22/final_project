import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import Layout from '../Layout';
import '../../dash.css';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    TextField, MenuItem, IconButton, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Alert, Autocomplete
} from '@mui/material';

const API_URL = 'http://localhost:8080';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [dialogMode, setDialogMode] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [editedTask, setEditedTask] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [sortOption, setSortOption] = useState('date');
    const completedCount = tasks.filter(t => t.status === 'Completed').length;
    const totalCount = tasks.length;
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const formatDateForInput = (date) => {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    const fetchTasks = async (role, token, userList, projectList) => {
        setLoading(true);
        try {
            let res;
            if (role === 'm') {
                res = await axios.get(`${API_URL}/api/tasks/all`, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                res = await axios.get(`${API_URL}/api/tasks/assigned`, { headers: { Authorization: `Bearer ${token}` } });
            }

            const enrichedTasks = res.data.map(task => {
                const assignedUser = userList.find(u => u.id === task.assignedToId);
                const project = projectList.find(p => p.id === task.projectId);

                return {
                    ...task,
                    assignedTo: assignedUser ? `${assignedUser.name || ''} ${assignedUser.surname || ''}`.trim() : '',
                    project: project ? project.title : ''
                };
            });

            setTasks(enrichedTasks);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setSnackbar({ open: true, message: 'Failed to load tasks.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                setLoading(true);
                const decoded = jwtDecode(token);
                const role = decoded.role;
                setUserRole(role);

                const [projectRes, userRes] = await Promise.all([
                    axios.get(`${API_URL}/api/pending-projects/active`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setProjects(projectRes.data);
                setUsers(userRes.data);

                await fetchTasks(role, token, userRes.data, projectRes.data);
            } catch (err) {
                console.error('Initialization error:', err);
                setSnackbar({ open: true, message: 'Failed to load data.', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    const handleOpenDialog = (task, mode) => {
        setDialogMode(mode);
        setSelectedTask(task);
        if (mode === 'edit') {
            setEditedTask(task
                ? { ...task, dueDate: formatDateForInput(task.dueDate) }
                : {
                    title: '', description: '', status: 'In Progress', priority: 'Medium',
                    dueDate: formatDateForInput(new Date()), assignedTo: '', assignedToId: '', projectId: ''
                });
        }
    };

    const handleCloseDialog = () => {
        setDialogMode(null);
        setSelectedTask(null);
        setEditedTask(null);
    };

    const handleSave = async () => {
        if (!editedTask?.title || !editedTask?.projectId || !editedTask?.assignedToId) {
            setSnackbar({ open: true, message: 'All fields are required.', severity: 'error' });
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (selectedTask) {
                await axios.put(`${API_URL}/api/tasks/${selectedTask.id}`, editedTask, getAuthHeader());
                setSnackbar({ open: true, message: 'Task updated.', severity: 'success' });
            } else {
                await axios.post(`${API_URL}/api/tasks`, editedTask, getAuthHeader());
                setSnackbar({ open: true, message: 'Task created.', severity: 'success' });
            }
            await fetchTasks(userRole, token, users, projects); // ✅ fixed here
            handleCloseDialog();
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: 'Error saving task.', severity: 'error' });
        }
    };

    const handleMarkComplete = async (task) => {
        try {
            const updatedTask = {
                id: task.id,
                title: task.title,
                description: task.description,
                status: 'Completed',
                priority: task.priority,
                dueDate: task.dueDate,
                projectId: task.projectId,
                assignedToId: task.assignedToId,
                assignedTo: task.assignedTo,
                project: task.project,
            };

            await axios.put(`${API_URL}/api/tasks/${task.id}`, updatedTask, getAuthHeader());

            setSnackbar({ open: true, message: 'Task marked as completed!', severity: 'success' });

            // Just update tasks state locally to avoid full refresh
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Completed' } : t));
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: 'Failed to update task.', severity: 'error' });
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/tasks/${selectedTask.id}`, getAuthHeader());
            setSnackbar({ open: true, message: 'Task deleted.', severity: 'success' });
            await fetchTasks(userRole, token, users, projects); // ✅ fixed here
            handleCloseDialog();
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: 'Delete failed.', severity: 'error' });
        }
    };

    const filteredTasks = tasks
        .filter(task => {
            if (filter === 'ALL') return true;
            return task.status.toUpperCase().replace(' ', '_') === filter;
        })
        .sort((a, b) => {
            if (sortOption === 'date') {
                return new Date(a.dueDate) - new Date(b.dueDate); // closest date first
            } else if (sortOption === 'priority') {
                const priorityOrder = { High: 1, Medium: 2, Low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            } else {
                return 0;
            }
        });

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="content-section left-section">
                    <div className="projects-card">
                        <div className="card-header">
                            <h3>Tasks</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <TextField
                                    select
                                    size="small"
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    sx={{ backgroundColor: 'white', borderRadius: '6px', width: 170 }}
                                >
                                    <MenuItem value="date">Sort by Date</MenuItem>
                                    <MenuItem value="priority">Sort by Relevance</MenuItem>
                                </TextField>
                                <TextField
                                    select
                                    size="small"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    sx={{ backgroundColor: 'white', borderRadius: '6px', width: 150 }}
                                >
                                    <MenuItem value="ALL">All</MenuItem>
                                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                    <MenuItem value="COMPLETED">Completed</MenuItem>
                                </TextField>
                                {userRole !== 'p' && userRole !== 'e' && (
                                    <Button className="accept-btn" onClick={() => handleOpenDialog(null, 'edit')}>
                                        New Task
                                    </Button>
                                )}
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div style={{ margin: '10px 0 20px 0' }}>
                            <div style={{ marginBottom: '6px', fontWeight: 500 }}>
                                {completedCount} of {totalCount} tasks completed ({completionPercent}%)
                            </div>
                            <div style={{
                                height: '10px',
                                backgroundColor: '#eee',
                                borderRadius: '5px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${completionPercent}%`,
                                    height: '100%',
                                    backgroundColor: '#4a6fdc',
                                    transition: 'width 0.3s ease'
                                }}></div>
                            </div>
                        </div>
                        {loading ? (
                            <p>Loading...</p>
                        ) : filteredTasks.length === 0 ? (
                            <p>No tasks found.</p>
                        ) : (
                            <div className="project-grid">
                                {filteredTasks.map(task => (
                                    <div key={task.id} className="task-card">
                                        <div className="project-info">
                                            <h4>{task.title}</h4>
                                            <div className="client-info">
                                                <span className="client-name">{task.status}</span>
                                                <span className="project-date">{formatDateForInput(task.dueDate)}</span>
                                            </div>
                                            <p>{task.description}</p>
                                            <p><strong>Assigned To:</strong> {task.assignedTo}</p>
                                            <p><strong>Project:</strong> {task.project}</p>
                                            <p><strong>Priority:</strong> {task.priority}</p>
                                        </div>
                                        <div style={{display: 'flex', gap: '8px'}}>
                                            {userRole === 'p' || userRole === 'e' ? (
                                                task.status === 'In Progress' && (
                                                    <button
                                                        className="accept-btn"
                                                        onClick={() => handleMarkComplete(task)}
                                                    >
                                                        Mark as Completed
                                                    </button>
                                                )
                                            ) : (
                                                <>
                                                    {task.status !== 'Completed' && (
                                                        <IconButton color="primary" onClick={() => handleOpenDialog(task, 'edit')}>
                                                            <EditIcon />
                                                        </IconButton>
                                                    )}
                                                    <IconButton color="error" onClick={() => handleOpenDialog(task, 'delete')}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Dialogs */}
                <Dialog open={dialogMode === 'edit'} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                    <DialogTitle>{selectedTask ? 'Edit Task' : 'New Task'}</DialogTitle>
                    <DialogContent sx={{pt: 2, display: 'flex', flexDirection: 'column', gap: 2}}>
                        <TextField label="Title" fullWidth value={editedTask?.title || ''}
                                   onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}/>
                        <TextField label="Description" fullWidth multiline rows={3} value={editedTask?.description || ''} onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })} />
                        <TextField select label="Status" fullWidth value={editedTask?.status || ''} onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                        </TextField>
                        <TextField select label="Priority" fullWidth value={editedTask?.priority || ''} onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}>
                            <MenuItem value="High">High</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="Low">Low</MenuItem>
                        </TextField>
                        <TextField type="date" label="Due Date" InputLabelProps={{ shrink: true }} fullWidth value={editedTask?.dueDate || ''} onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })} />
                        <Autocomplete
                            options={projects}
                            getOptionLabel={(option) => option.title || ''}
                            value={projects.find(p => p.id === editedTask?.projectId) || null}
                            onChange={(e, value) => setEditedTask({ ...editedTask, projectId: value?.id || '' })}
                            renderInput={(params) => <TextField {...params} label="Project" fullWidth required />}
                        />
                        <Autocomplete
                            options={users.filter(u => u.role === 'p' || u.role === 'e')}
                            getOptionLabel={(option) => `${option.name || ''} ${option.surname || ''}`.trim()}
                            value={users.find(u => u.id === editedTask?.assignedToId) || null}
                            onChange={(e, value) => setEditedTask({ ...editedTask, assignedToId: value?.id || '' })}
                            renderInput={(params) => <TextField {...params} label="Assigned To" fullWidth required />}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button variant="contained" onClick={handleSave}>Save</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={dialogMode === 'delete'} onClose={handleCloseDialog}>
                    <DialogTitle>Delete Task</DialogTitle>
                    <DialogContent>
                        <p>Are you sure you want to delete this task?</p>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
                    </DialogActions>
                </Dialog>

                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
                </Snackbar>
            </div>
        </Layout>
    );
};

export default TaskList;
