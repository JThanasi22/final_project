import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Typography, Box, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Layout from '../Layout';
import axios from 'axios';
import {jwtDecode} from "jwt-decode";


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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);
    const [clients, setClients] = useState([]);
    const [managerProjects, setManagerProjects] = useState([]);
    const [openReportDialog, setOpenReportDialog] = useState(false);
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [reportPdfUrl, setReportPdfUrl] = useState(null);


    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        console.log(parseJwt(token));
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    };

    const fetchClients = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/users", getAuthHeader());
            setClients(res.data || []);
        } catch (err) {
            console.error("Failed to fetch clients:", err);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = parseJwt(token);
            setUserRole(decoded?.role);
            setUserId(decoded?.userId || decoded?.sub);
        }

        fetchInvoices().then(r => fetchManagerProjects().then(r => fetchClients()));
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const decoded = jwtDecode(token);
            const userId = decoded.id;
            const role = decoded.role;

            let url = "http://localhost:8080/api/invoices";
            let config = getAuthHeader();

            if (role === "c" || role === "s") {
                // Navigate to a different backend endpoint and pass the userId as a query param
                url = `http://localhost:8080/api/invoices/client?clientId=${userId}`;
            }

            const res = await axios.get(url, config);
            setInvoices(res.data || []);
        } catch (err) {
            console.error("Error fetching invoices:", err);
            setError("Failed to load invoices.");
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };


    const fetchManagerProjects = async () => {
        try {
            const res = await axios.get(`http://localhost:8080/api/my-active-projects`, getAuthHeader());
            setManagerProjects(res.data || []);
        } catch (err) {
            console.error("Failed to fetch projects:", err);
        }
    };

    const handleOpenDialog = () => {
        setSelectedInvoice({ projectId: '', amount: '' });
        setDialogMode('create');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedInvoice(null);
        setDialogMode('view');
    };

    const handleSave = async () => {
        try {
            if (!selectedInvoice.projectId || selectedInvoice.amount <= 0) {
                alert('Project and amount are required');
                return;
            }

            const payload = {
                projectId: selectedInvoice.projectId,
                amount: Number(selectedInvoice.amount)
            };

            await axios.post(`http://localhost:8080/api/invoices`, payload, getAuthHeader());
            alert('Invoice created');
            await fetchInvoices();
            handleCloseDialog();
        } catch (err) {
            console.error("Create error:", err);
            alert("Error creating invoice");
        }
    };

    const handleGenerateReport = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/invoices/report", {
                params: {
                    startDate: reportStartDate,
                    endDate: reportEndDate,
                    managerId: userId,
                },
                ...getAuthHeader(),
                responseType: 'blob' // <--- this is KEY
            });

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // ✅ Download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `stripe-report-${reportStartDate}_to_${reportEndDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // ✅ Preview
            setReportPdfUrl(url);

            // Close the dialog
            setOpenReportDialog(false);
        } catch (err) {
            console.error("Failed to generate report:", err);
            alert("Failed to generate report");
        }
    };


    return (
        <Layout>
            <Box sx={{ display: 'flex', gap: 3, p: 3 }}>
                {/* Left Side: All Existing Content */}
                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h5">Invoices</Typography>
                        {(userRole === 'm' || userRole ==="a") && (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenDialog}
                                >
                                    New Invoice
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => setOpenReportDialog(true)}
                                >
                                    Generate Report
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
                                        <TableCell>Project</TableCell>
                                        <TableCell>Client ID</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell>Created At</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">No invoices found</TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map((invoice) => {
                                            const project = managerProjects.find(p => p.id === invoice.projectId);
                                            const projectName = project ? project.title : invoice.projectId;

                                            const client = clients.find(c => c.id === invoice.clientId);
                                            const clientName = client ? `${client.name} ${client.surname}` : '—';

                                            return (
                                                <TableRow key={invoice.id}>
                                                    <TableCell>{projectName}</TableCell>
                                                    <TableCell>{clientName}</TableCell>
                                                    <TableCell align="right">${invoice.amount?.toFixed(2)}</TableCell>
                                                    <TableCell>{invoice.createdAt?.split('T')[0]}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Dialogs */}
                    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                        <DialogTitle>Create Invoice</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    select
                                    label="Project"
                                    value={selectedInvoice?.projectId || ''}
                                    onChange={(e) => setSelectedInvoice(prev => ({ ...prev, projectId: e.target.value }))}
                                >
                                    {managerProjects.map((proj) => (
                                        <MenuItem key={proj.id} value={proj.id}>
                                            {proj.title}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    label="Amount"
                                    type="number"
                                    value={selectedInvoice?.amount || ''}
                                    onChange={(e) => setSelectedInvoice(prev => ({ ...prev, amount: e.target.value }))}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>Generate Stripe Report</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    type="date"
                                    label="Start Date"
                                    value={reportStartDate}
                                    onChange={(e) => setReportStartDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    type="date"
                                    label="End Date"
                                    value={reportEndDate}
                                    onChange={(e) => setReportEndDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenReportDialog(false)}>Cancel</Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleGenerateReport}
                                disabled={!reportStartDate || !reportEndDate}
                            >
                                Generate
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>

                {/* Right Side: PDF Preview (Only for managers) */}
                {(userRole === 'm'|| userRole ==="a") && reportPdfUrl && (
                    <Box sx={{ width: '100%', height: '80vh', boxShadow: 3 }}>
                        <iframe
                            src={reportPdfUrl}
                            title="Stripe Report"
                            width="100%"
                            height="100%"
                            style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                        />
                    </Box>
                )}
            </Box>
        </Layout>
    );
};

export default InvoiceList;
