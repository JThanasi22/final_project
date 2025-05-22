import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Typography, Box, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
    CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Layout from '../Layout';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('view');
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return {
            headers: { 'Authorization': `Bearer ${token}` }
        };
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = parseJwt(token);
            setUserRole(decoded?.role);
            setUserId(decoded?.userId || decoded?.sub);
        }

        fetchInvoices();
        fetchClients();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/api/invoices`, getAuthHeader());
            const allInvoices = response.data || [];

            if (userRole === 'c') {
                const clientInvoices = allInvoices.filter(inv => inv.clientId === userId);
                setInvoices(clientInvoices);
            } else {
                setInvoices(allInvoices);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
            setError("Failed to load invoices. Please try again later.");
            setInvoices([]);
        }
        setLoading(false);
    };

    const fetchClients = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/users`, getAuthHeader());
            const clientUsers = response.data.filter(user => user.role === 'c');
            setClients(clientUsers);
        } catch (error) {
            console.error("Error fetching clients:", error);
            setClients([]);
        }
    };

    const handleOpenDialog = (invoice, mode) => {
        if (mode === 'create') {
            setSelectedInvoice({
                clientId: '',
                amount: 0,
                tax: 0,
                total: 0,
                status: 'Pending',
                dueDate: new Date().toISOString().split('T')[0],
            });
        } else {
            setSelectedInvoice(invoice);
        }
        setDialogMode(mode);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedInvoice(null);
        setDialogMode('view');
    };

    const handleSave = async () => {
        try {
            if (!selectedInvoice.clientId || selectedInvoice.amount <= 0 || !selectedInvoice.dueDate) {
                alert('Please complete all required fields');
                return;
            }

            const selectedClient = clients.find(c => c.id === selectedInvoice.clientId);
            if (!selectedClient) return alert('Client not found');

            const clientName = `${selectedClient.name} ${selectedClient.surname}`;
            const newInvoice = {
                ...selectedInvoice,
                clientName,
                amount: Number(selectedInvoice.amount),
                tax: Number(selectedInvoice.tax),
                total: Number(selectedInvoice.total),
                createdAt: new Date().toISOString().split('T')[0],
            };

            if (dialogMode === 'create') {
                await axios.post(`${API_URL}/api/invoices`, newInvoice, getAuthHeader());
                alert('Invoice created');
                fetchInvoices();
                handleCloseDialog();
            } else if (dialogMode === 'edit') {
                const updatedInvoice = {
                    ...selectedInvoice,
                    amount: Number(selectedInvoice.amount),
                    tax: Number(selectedInvoice.tax),
                    total: Number(selectedInvoice.total)
                };
                await axios.put(`${API_URL}/api/invoices/${selectedInvoice.id}`, updatedInvoice, getAuthHeader());
                alert('Invoice updated');
                fetchInvoices();
                handleCloseDialog();
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("An error occurred while saving the invoice.");
        }
    };

    const handleDelete = async (invoiceId) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;
        try {
            await axios.delete(`${API_URL}/api/invoices/${invoiceId}`, getAuthHeader());
            fetchInvoices();
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete invoice.");
        }
    };

    const handleInputChange = (field, value) => {
        const updated = { ...selectedInvoice, [field]: value };
        if (field === 'amount') {
            const amount = Number(value);
            const tax = amount * 0.1;
            updated.tax = tax;
            updated.total = amount + tax;
        }
        setSelectedInvoice(updated);
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'success';
            case 'pending': return 'warning';
            case 'overdue': return 'error';
            default: return 'default';
        }
    };

    const filteredInvoices = invoices.filter(invoice => {
        if (filter === 'ALL') return true;
        return invoice.status.toUpperCase() === filter;
    });

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5">Invoices</Typography>
                    {userRole !== 'c' && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                select size="small" value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                sx={{ minWidth: 150 }}
                            >
                                <MenuItem value="ALL">All Invoices</MenuItem>
                                <MenuItem value="PAID">Paid</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="OVERDUE">Overdue</MenuItem>
                            </TextField>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog(null, 'create')}
                            >
                                New Invoice
                            </Button>
                        </Box>
                    )}
                </Box>

                {error && <Alert severity="error">{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Invoice ID</TableCell>
                                    <TableCell>Client</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell align="right">Tax</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Due Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredInvoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">No invoices found</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredInvoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell>{invoice.id}</TableCell>
                                            <TableCell>{invoice.clientName}</TableCell>
                                            <TableCell align="right">${invoice.amount.toFixed(2)}</TableCell>
                                            <TableCell align="right">${invoice.tax.toFixed(2)}</TableCell>
                                            <TableCell align="right">${invoice.total.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Chip label={invoice.status} color={getStatusColor(invoice.status)} size="small" />
                                            </TableCell>
                                            <TableCell>{invoice.dueDate}</TableCell>
                                            <TableCell>
                                                <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleOpenDialog(invoice, 'view')}>View</Button>
                                                {userRole !== 'c' && (
                                                    <>
                                                        <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenDialog(invoice, 'edit')}>Edit</Button>
                                                        <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(invoice.id)}>Delete</Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {dialogMode === 'view' ? 'Invoice Details' :
                            dialogMode === 'edit' ? 'Edit Invoice' : 'Create Invoice'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField label="Client" value={selectedInvoice?.clientName || ''} disabled={dialogMode === 'view'} />
                            <TextField label="Amount" type="number" value={selectedInvoice?.amount || ''} onChange={(e) => handleInputChange('amount', e.target.value)} disabled={dialogMode === 'view'} />
                            <TextField label="Tax" type="number" value={selectedInvoice?.tax || ''} disabled />
                            <TextField label="Total" type="number" value={selectedInvoice?.total || ''} disabled />
                            <TextField select label="Status" value={selectedInvoice?.status || ''} onChange={(e) => handleInputChange('status', e.target.value)} disabled={dialogMode === 'view'}>
                                <MenuItem value="Paid">Paid</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Overdue">Overdue</MenuItem>
                            </TextField>
                            <TextField label="Due Date" type="date" value={selectedInvoice?.dueDate || ''} onChange={(e) => handleInputChange('dueDate', e.target.value)} disabled={dialogMode === 'view'} InputLabelProps={{ shrink: true }} />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>{dialogMode === 'view' ? 'Close' : 'Cancel'}</Button>
                        {dialogMode !== 'view' && (
                            <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default InvoiceList;
