import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Chip,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import Layout from './components/Layout';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'delete'
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        role: '',
    });

    const API_URL = 'http://localhost:8080';

    // Helper function to get token from localStorage
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    };

    // Load users from API
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/admin/users`, getAuthHeader());
            setUsers(response.data);
            showSnackbar('Users loaded successfully', 'success');
        } catch (error) {
            console.error('Error fetching users:', error);
            showSnackbar('Failed to load users: ' + (error.response?.data || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenDialog = (mode, user = null) => {
        setDialogMode(mode);
        setSelectedUser(user);

        if (mode === 'edit' && user) {
            setEditForm({
                name: user.name || '',
                email: user.email || '',
                role: user.role || ''
            });
        } else if (mode === 'add') {
            setEditForm({
                name: '',
                surname: '',
                email: '',
                phone: '',
                birthday: '',
                password: '',
                role: ''
            });
        }

        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedUser(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm({
            ...editForm,
            [name]: value
        });
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

    const handleSaveUser = async () => {
        try {
            setLoading(true);

            if (dialogMode === 'add') {
                // Add new user - we'll use the regular signup endpoint
                await axios.post(`${API_URL}/api/users/signup`, editForm);
                showSnackbar('User added successfully', 'success');
            } else if (dialogMode === 'edit' && selectedUser) {
                // Update user role
                await axios.put(
                    `${API_URL}/api/admin/users/${selectedUser.id}/role`,
                    { role: editForm.role },
                    getAuthHeader()
                );
                showSnackbar('User updated successfully', 'success');
            }

            // Refresh the user list
            fetchUsers();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving user:', error);
            showSnackbar('Failed to save user: ' + (error.response?.data || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (selectedUser) {
            try {
                setLoading(true);
                await axios.delete(
                    `${API_URL}/api/admin/users/${selectedUser.id}`,
                    getAuthHeader()
                );
                showSnackbar('User deleted successfully', 'success');
                fetchUsers();
                handleCloseDialog();
            } catch (error) {
                console.error('Error deleting user:', error);
                showSnackbar('Failed to delete user: ' + (error.response?.data || error.message), 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const filteredUsers = users.filter(user => {
        if (filter === 'ALL') return true;
        if (filter === 'ADMIN') return user.role === 'a';
        if (filter === 'CLIENT') return user.role === 'c';
        if (filter === 'MANAGER') return user.role === 'm';
        if (filter === 'PHOTOGRAPHER') return user.role === 'p';
        if (filter === 'EDITOR') return user.role === 'e';
        if (filter === 'SUPPORT') return user.role === 's';
        return false;
    });

    const getRoleName = (roleCode) => {
        switch(roleCode) {
            case 'a': return 'Admin';
            case 'c': return 'Client';
            case 'm': return 'Manager';
            case 'p': return 'Photographer';
            case 'e': return 'Editor';
            case 's': return 'Support'
            default: return roleCode;
        }
    };

    return (
        <Layout>
            <Box sx={{ p: 3, width: '100%' }}>
                <Paper elevation={0} sx={{
                    p: 3,
                    borderRadius: '12px',
                    mb: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #4a6fdc'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                            Admin Dashboard
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PersonAddIcon />}
                            onClick={() => handleOpenDialog('add')}
                        >
                            Add User
                        </Button>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">
                        Manage users, roles, and system settings
                    </Typography>
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <TextField
                        select
                        size="small"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="ALL">All Users</MenuItem>
                        <MenuItem value="ADMIN">Admins</MenuItem>
                        <MenuItem value="CLIENT">Clients</MenuItem>
                        <MenuItem value="MANAGER">Managers</MenuItem>
                        <MenuItem value="PHOTOGRAPHER">Photographers</MenuItem>
                        <MenuItem value="EDITOR">Editors</MenuItem>
                        <MenuItem value="SUPPORT">Support</MenuItem>
                    </TextField>
                </Box>

                {loading && users.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{`${user.name || ''} ${user.surname || ''}`}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.phone || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getRoleName(user.role)}
                                                color={user.role === 'a' ? 'primary' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                startIcon={<EditIcon />}
                                                size="small"
                                                sx={{ mr: 1 }}
                                                onClick={() => handleOpenDialog('edit', user)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                startIcon={<DeleteIcon />}
                                                color="error"
                                                size="small"
                                                onClick={() => handleOpenDialog('delete', user)}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Add Dialog */}
                <Dialog
                    open={dialogOpen && dialogMode === 'add'}
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        Add New User
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="First Name"
                                name="name"
                                value={editForm.name}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Last Name"
                                name="surname"
                                value={editForm.surname}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Email"
                                name="email"
                                type="email"
                                value={editForm.email}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Phone"
                                name="phone"
                                value={editForm.phone}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Birthday"
                                name="birthday"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={editForm.birthday}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Password"
                                name="password"
                                type="password"
                                value={editForm.password}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                select
                                label="Role"
                                name="role"
                                value={editForm.role}
                                onChange={handleInputChange}
                                fullWidth
                            >
                                <MenuItem value="c">Client</MenuItem>
                                <MenuItem value="a">Admin</MenuItem>
                                <MenuItem value="m">Manager</MenuItem>
                                <MenuItem value="p">Photographer</MenuItem>
                                <MenuItem value="e">Editor</MenuItem>
                                <MenuItem value="s">Support</MenuItem>
                            </TextField>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button
                            onClick={handleSaveUser}
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Save'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog
                    open={dialogOpen && dialogMode === 'edit'}
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        Edit User
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Name"
                                value={selectedUser ? `${selectedUser.name || ''} ${selectedUser.surname || ''}` : ''}
                                fullWidth
                                disabled
                            />
                            <TextField
                                label="Email"
                                value={selectedUser ? selectedUser.email : ''}
                                fullWidth
                                disabled
                            />
                            <TextField
                                select
                                label="Role"
                                name="role"
                                value={editForm.role}
                                onChange={handleInputChange}
                                fullWidth
                            >
                                <MenuItem value="c">Client</MenuItem>
                                <MenuItem value="a">Admin</MenuItem>
                                <MenuItem value="m">Manager</MenuItem>
                                <MenuItem value="p">Photographer</MenuItem>
                                <MenuItem value="e">Editor</MenuItem>
                                <MenuItem value="s">Support</MenuItem>
                            </TextField>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button
                            onClick={handleSaveUser}
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Save'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog
                    open={dialogOpen && dialogMode === 'delete'}
                    onClose={handleCloseDialog}
                >
                    <DialogTitle>
                        Delete User
                    </DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete {selectedUser ? selectedUser.email : ''}?
                            This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button
                            onClick={handleDeleteUser}
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

export default AdminDashboard;