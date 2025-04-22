import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
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
} from '@mui/material';
import Layout from '../Layout';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Mock data for users
const mockUsers = [
    { id: 1, name: 'John Smith', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Photographer', status: 'Active' },
    { id: 3, name: 'David Lee', email: 'david@example.com', role: 'Client', status: 'Inactive' },
    { id: 4, name: 'Emily Brown', email: 'emily@example.com', role: 'Editor', status: 'Active' },
    { id: 5, name: 'Michael Wang', email: 'michael@example.com', role: 'Sales', status: 'Active' },
];

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'delete'
    const [filter, setFilter] = useState('ALL');
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        role: '',
        status: ''
    });

    useEffect(() => {
        // Simulating API call
        setUsers(mockUsers);
    }, []);

    const handleOpenDialog = (mode, user = null) => {
        setDialogMode(mode);
        setSelectedUser(user);
        
        if (mode === 'edit' && user) {
            setEditForm({
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            });
        } else if (mode === 'add') {
            setEditForm({
                name: '',
                email: '',
                role: 'Client',
                status: 'Active'
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

    const handleSaveUser = () => {
        if (dialogMode === 'add') {
            // Add new user
            const newUser = {
                id: users.length + 1,
                ...editForm
            };
            setUsers([...users, newUser]);
        } else if (dialogMode === 'edit' && selectedUser) {
            // Edit existing user
            setUsers(users.map(user => 
                user.id === selectedUser.id ? { ...user, ...editForm } : user
            ));
        }
        handleCloseDialog();
    };

    const handleDeleteUser = () => {
        if (selectedUser) {
            setUsers(users.filter(user => user.id !== selectedUser.id));
            handleCloseDialog();
        }
    };

    const filteredUsers = users.filter(user => {
        if (filter === 'ALL') return true;
        return user.role.toUpperCase() === filter;
    });

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
                        <MenuItem value="PHOTOGRAPHER">Photographers</MenuItem>
                        <MenuItem value="CLIENT">Clients</MenuItem>
                        <MenuItem value="EDITOR">Editors</MenuItem>
                        <MenuItem value="SALES">Sales</MenuItem>
                    </TextField>
                </Box>

                <TableContainer component={Paper} sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={user.role} 
                                            color={user.role === 'Admin' ? 'primary' : 'default'} 
                                            size="small" 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={user.status} 
                                            color={user.status === 'Active' ? 'success' : 'error'} 
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
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Add/Edit Dialog */}
                <Dialog 
                    open={dialogOpen && (dialogMode === 'add' || dialogMode === 'edit')} 
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        {dialogMode === 'add' ? 'Add New User' : 'Edit User'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Name"
                                name="name"
                                value={editForm.name}
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
                                select
                                label="Role"
                                name="role"
                                value={editForm.role}
                                onChange={handleInputChange}
                                fullWidth
                            >
                                <MenuItem value="Admin">Admin</MenuItem>
                                <MenuItem value="Photographer">Photographer</MenuItem>
                                <MenuItem value="Client">Client</MenuItem>
                                <MenuItem value="Editor">Editor</MenuItem>
                                <MenuItem value="Sales">Sales</MenuItem>
                            </TextField>
                            <TextField
                                select
                                label="Status"
                                name="status"
                                value={editForm.status}
                                onChange={handleInputChange}
                                fullWidth
                            >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Inactive">Inactive</MenuItem>
                            </TextField>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSaveUser} variant="contained" color="primary">
                            {dialogMode === 'add' ? 'Add User' : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog 
                    open={dialogOpen && dialogMode === 'delete'} 
                    onClose={handleCloseDialog}
                >
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleDeleteUser} color="error" variant="contained">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default AdminPanel; 