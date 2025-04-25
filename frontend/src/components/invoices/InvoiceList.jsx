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
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Layout from '../Layout';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

// Create a specific instance for invoice API calls without auth
const invoiceApi = axios.create({
    baseURL: API_URL
});

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('view'); // 'view', 'edit', 'create'
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [error, setError] = useState(null);

    // Get auth header for user API requests
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    };

    useEffect(() => {
        fetchInvoices();
        fetchClients();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            // Using the invoice-specific axios instance without auth headers
            const response = await invoiceApi.get('/api/invoices');
            console.log('Fetched invoices:', response.data);
            setInvoices(response.data || []);
        } catch (error) {
            console.error("Error fetching invoices:", error);
            setError("Failed to load invoices. Please try again later.");
            setInvoices([]);
        }
        setLoading(false);
    };

    const fetchClients = async () => {
        try {
            // Still need auth for user API
            const response = await axios.get(`${API_URL}/api/users`, getAuthHeader());
            // Filter users with role "c" (client)
            const clientUsers = response.data.filter(user => user.role === 'c');
            setClients(clientUsers);
        } catch (error) {
            console.error("Error fetching clients:", error);
            // If API fails, set empty clients list
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
            // Basic validation
            if (!selectedInvoice.clientId) {
                alert('Please select a client');
                return;
            }
            
            if (selectedInvoice.amount <= 0) {
                alert('Amount must be greater than 0');
                return;
            }
            
            if (!selectedInvoice.dueDate) {
                alert('Please select a due date');
                return;
            }

            if (dialogMode === 'create') {
                // Find the selected client to get their name
                const selectedClient = clients.find(client => client.id === selectedInvoice.clientId);
                if (!selectedClient) {
                    alert('Selected client not found');
                    return;
                }
                
                const clientName = `${selectedClient.name} ${selectedClient.surname}`;
                
                // Create new invoice object with properly typed values
                const newInvoice = {
                    ...selectedInvoice,
                    clientName: clientName,
                    amount: Number(selectedInvoice.amount),
                    tax: Number(selectedInvoice.tax),
                    total: Number(selectedInvoice.total),
                    createdAt: new Date().toISOString().split('T')[0],
                };
                
                // Log the data we're sending to the API for debugging
                console.log('Creating invoice with data:', newInvoice);
                
                try {
                    // Using the invoice-specific axios instance without auth headers
                    const response = await invoiceApi.post('/api/invoices', newInvoice);
                    console.log('Create invoice response:', response.data);
                    
                    // Show success message with the invoice ID
                    const invoiceId = response.data;
                    alert(`Invoice created successfully with ID: ${invoiceId}`);
                    
                    // Refresh the invoices list
                    await fetchInvoices();
                    handleCloseDialog();
                } catch (error) {
                    console.error("Error creating invoice:", error);
                    let errorMessage = "Failed to create invoice. Please try again.";
                    
                    if (error.response) {
                        console.error("Error response:", error.response.data);
                        errorMessage = `Failed to create invoice: ${error.response.data}`;
                    }
                    
                    setError(errorMessage);
                    alert(errorMessage);
                }
            } else if (dialogMode === 'edit') {
                // Find the selected client to get their name if clientId has changed
                if (selectedInvoice.clientId) {
                    const selectedClient = clients.find(client => client.id === selectedInvoice.clientId);
                    if (selectedClient) {
                        selectedInvoice.clientName = `${selectedClient.name} ${selectedClient.surname}`;
                    }
                }
                
                // Create updated invoice object with properly typed values
                const updatedInvoice = {
                    ...selectedInvoice,
                    amount: Number(selectedInvoice.amount),
                    tax: Number(selectedInvoice.tax),
                    total: Number(selectedInvoice.total)
                };
                
                // Log the data we're sending to the API for debugging
                console.log('Updating invoice with data:', updatedInvoice);
                
                try {
                    // Using the invoice-specific axios instance without auth headers
                    const response = await invoiceApi.put(`/api/invoices/${selectedInvoice.id}`, updatedInvoice);
                    console.log('Update invoice response:', response.data);
                    alert('Invoice updated successfully');
                    
                    // Refresh the invoices list
                    await fetchInvoices();
                    handleCloseDialog();
                } catch (error) {
                    console.error("Error updating invoice:", error);
                    let errorMessage = "Failed to update invoice. Please try again.";
                    
                    if (error.response) {
                        console.error("Error response:", error.response.data);
                        errorMessage = `Failed to update invoice: ${error.response.data}`;
                    }
                    
                    setError(errorMessage);
                    alert(errorMessage);
                }
            }
        } catch (error) {
            console.error("Error in handleSave:", error);
            const errorMessage = "An unexpected error occurred. Please try again.";
            setError(errorMessage);
            alert(errorMessage);
        }
    };

    const handleDelete = async (invoiceId) => {
        if (!confirm('Are you sure you want to delete this invoice?')) {
            return;
        }
        
        try {
            // Using the invoice-specific axios instance without auth headers
            await invoiceApi.delete(`/api/invoices/${invoiceId}`);
            // Refresh the invoice list after deletion
            fetchInvoices();
        } catch (error) {
            console.error("Error deleting invoice:", error);
            alert("Failed to delete invoice. Please try again.");
        }
    };

    const handleInputChange = (field, value) => {
        setSelectedInvoice({
            ...selectedInvoice,
            [field]: value
        });

        // Auto-calculate tax and total if amount changes
        if (field === 'amount') {
            const amount = Number(value);
            const tax = amount * 0.1; // 10% tax
            setSelectedInvoice({
                ...selectedInvoice,
                amount: amount,
                tax: tax,
                total: amount + tax
            });
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'success';
            case 'pending':
                return 'warning';
            case 'overdue':
                return 'error';
            default:
                return 'default';
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
                    <Typography variant="h5" component="h2">
                        Invoices
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            select
                            size="small"
                            value={filter}
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
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

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
                                        <TableCell colSpan={8} align="center">
                                            No invoices found
                                        </TableCell>
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
                                                <Chip
                                                    label={invoice.status}
                                                    color={getStatusColor(invoice.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{invoice.dueDate}</TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    startIcon={<VisibilityIcon />}
                                                    onClick={() => handleOpenDialog(invoice, 'view')}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleOpenDialog(invoice, 'edit')}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleDelete(invoice.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Dialog
                    open={openDialog}
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        {dialogMode === 'view' ? 'Invoice Details' :
                            dialogMode === 'edit' ? 'Edit Invoice' : 'Create Invoice'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {dialogMode === 'view' ? (
                                <TextField
                                    label="Client Name"
                                    value={selectedInvoice?.clientName || ''}
                                    disabled={true}
                                />
                            ) : (
                                <FormControl fullWidth>
                                    <InputLabel id="client-select-label">Client</InputLabel>
                                    <Select
                                        labelId="client-select-label"
                                        value={selectedInvoice?.clientId || ''}
                                        onChange={(e) => handleInputChange('clientId', e.target.value)}
                                        label="Client"
                                        disabled={dialogMode === 'view'}
                                    >
                                        <MenuItem value="" disabled>Select a client</MenuItem>
                                        {clients.map((client) => (
                                            <MenuItem key={client.id} value={client.id}>
                                                {client.name} {client.surname} ({client.email})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            <TextField
                                label="Amount"
                                type="number"
                                value={selectedInvoice?.amount || ''}
                                onChange={(e) => handleInputChange('amount', e.target.value)}
                                disabled={dialogMode === 'view'}
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                            <TextField
                                label="Tax"
                                type="number"
                                value={selectedInvoice?.tax || ''}
                                onChange={(e) => handleInputChange('tax', e.target.value)}
                                disabled={dialogMode === 'view'}
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                            <TextField
                                label="Total"
                                type="number"
                                value={selectedInvoice?.total || ''}
                                disabled={true}
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                            <TextField
                                select
                                label="Status"
                                value={selectedInvoice?.status || ''}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                disabled={dialogMode === 'view'}
                            >
                                <MenuItem value="Paid">Paid</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Overdue">Overdue</MenuItem>
                            </TextField>
                            <TextField
                                label="Due Date"
                                type="date"
                                value={selectedInvoice?.dueDate || ''}
                                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                                disabled={dialogMode === 'view'}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                            {dialogMode === 'view' && selectedInvoice?.createdAt && (
                                <TextField
                                    label="Created Date"
                                    value={selectedInvoice?.createdAt || ''}
                                    disabled={true}
                                />
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>
                            {dialogMode === 'view' ? 'Close' : 'Cancel'}
                        </Button>
                        {dialogMode !== 'view' && (
                            <Button onClick={handleSave} variant="contained" color="primary">
                                Save
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default InvoiceList; 