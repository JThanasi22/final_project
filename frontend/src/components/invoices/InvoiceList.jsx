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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const mockInvoices = [
  {
    id: 'INV-2024-001',
    clientName: 'John & Sarah Wedding',
    amount: 2500,
    tax: 250,
    total: 2750,
    status: 'Paid',
    dueDate: '2024-03-25',
    createdAt: '2024-03-10',
  },
  {
    id: 'INV-2024-002',
    clientName: 'Tech Corp Event',
    amount: 1800,
    tax: 180,
    total: 1980,
    status: 'Pending',
    dueDate: '2024-03-30',
    createdAt: '2024-03-15',
  },
  {
    id: 'INV-2024-003',
    clientName: 'Fashion Brand Shoot',
    amount: 3500,
    tax: 350,
    total: 3850,
    status: 'Overdue',
    dueDate: '2024-03-01',
    createdAt: '2024-02-15',
  },
];

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view', 'edit', 'create'
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // Simulating API call with mock data
    setInvoices(mockInvoices);
  }, []);

  const handleOpenDialog = (invoice, mode) => {
    setSelectedInvoice(invoice);
    setDialogMode(mode);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
    setDialogMode('view');
  };

  const handleSave = () => {
    if (dialogMode === 'create') {
      // Simulate creating new invoice
      const newInvoice = {
        ...selectedInvoice,
        id: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setInvoices([...invoices, newInvoice]);
    } else if (dialogMode === 'edit') {
      // Simulate updating invoice
      setInvoices(invoices.map(inv => 
        inv.id === selectedInvoice.id ? selectedInvoice : inv
      ));
    }
    handleCloseDialog();
  };

  const handleDelete = (invoiceId) => {
    // Simulate deleting invoice
    setInvoices(invoices.filter(inv => inv.id !== invoiceId));
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
            onClick={() => handleOpenDialog({
              clientName: '',
              amount: 0,
              tax: 0,
              total: 0,
              status: 'Pending',
              dueDate: '',
            }, 'create')}
          >
            New Invoice
          </Button>
        </Box>
      </Box>
      
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
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.id}</TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell align="right">${invoice.amount}</TableCell>
                <TableCell align="right">${invoice.tax}</TableCell>
                <TableCell align="right">${invoice.total}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
            <TextField
              label="Client Name"
              value={selectedInvoice?.clientName || ''}
              onChange={(e) => setSelectedInvoice({
                ...selectedInvoice,
                clientName: e.target.value
              })}
              disabled={dialogMode === 'view'}
            />
            <TextField
              label="Amount"
              type="number"
              value={selectedInvoice?.amount || ''}
              onChange={(e) => {
                const amount = Number(e.target.value);
                const tax = amount * 0.1;
                setSelectedInvoice({
                  ...selectedInvoice,
                  amount,
                  tax,
                  total: amount + tax
                });
              }}
              disabled={dialogMode === 'view'}
            />
            <TextField
              label="Tax"
              type="number"
              value={selectedInvoice?.tax || ''}
              disabled
            />
            <TextField
              label="Total"
              type="number"
              value={selectedInvoice?.total || ''}
              disabled
            />
            <TextField
              select
              label="Status"
              value={selectedInvoice?.status || ''}
              onChange={(e) => setSelectedInvoice({
                ...selectedInvoice,
                status: e.target.value
              })}
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
              onChange={(e) => setSelectedInvoice({
                ...selectedInvoice,
                dueDate: e.target.value
              })}
              disabled={dialogMode === 'view'}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSave} variant="contained" color="primary">
              {dialogMode === 'create' ? 'Create' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceList; 