import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, IconButton, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import Layout from '../Layout';
import axios from 'axios';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { Snackbar, Alert, Dialog } from '@mui/material';
import {jwtDecode} from "jwt-decode";


const API_URL = 'http://localhost:8080';  // same-origin
const token   = localStorage.getItem('token');
const headers = { Authorization: `Bearer ${token}` };

const NotificationList = () => {
    const [notifications, setNotifications] = useState([]);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [selectedNotificationId, setSelectedNotificationId] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            const headers = { Authorization: `Bearer ${token}` };

            try {
                const res = await axios.get(`${API_URL}/api/notifications`, { headers });
                const sorted = res.data.sort(
                    (a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
                );
                setNotifications(sorted);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        fetchNotifications();
    }, []);

    const TYPE_COLOR_MAP = {
        task_assignment:   '#BBDEFB',  // light blue
        task_completed:    '#C8E6C9',  // light green
        task_reply:        '#FFF9C4',  // light amber
        project_update:    '#E1BEE7',  // light purple
        payment_request:   '#FFCDD2',  // light red
        meeting_request:   '#CFD8DC',  // light grey
        meeting_accepted:  '#C8E6C9',  // light green
        meeting_rejected:  '#FFCDD2',  // light red
        change_request:    '#EF9A9A'
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(
                `${API_URL}/api/notifications/${id}/read`,
                {},
                { headers }
            );
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'read' } : n)
            );
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axios.delete(
                `${API_URL}/api/notifications/${id}`,
                { headers }
            );
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error("Failed to delete notification", err);
        }
    };

    const openPayment = (url) => {
        if (url) window.open(url, "_blank");
    };

// Inside your component, alongside your other hooks:
    const deleteAllWithMessage = async (message) => {
        // 1) collect all matching notifications
        const toDelete = notifications.filter(n => n.message === message);
        try {
            // 2) delete them in parallel
            await Promise.all(
                toDelete.map(n =>
                    axios.delete(`${API_URL}/api/notifications/${n.id}`, { headers })
                )
            );
        } catch (err) {
            console.error("Failed to delete some notifications:", err);
        }
        // 3) update local state once
        setNotifications(prev =>
            prev.filter(n => n.message !== message)
        );
    };

    const handleAcceptMeeting = async (meetingId, notificationId, message) => {
        try {
            // 1) accept on the server (triggers backend notify)
            await axios.put(
                `${API_URL}/api/meetings/${meetingId}/accept`,
                {},
                { headers }
            );

            // 2) delete all identical meeting_request notifications
            await deleteAllWithMessage(message);

            // 3) show success popup
            setSnackbar({
                open: true,
                message: 'Meeting accepted successfully',
                severity: 'success'
            });
        } catch (err) {
            console.error('Accept failed:', err);
            setSnackbar({
                open: true,
                message: 'Failed to accept meeting',
                severity: 'error'
            });
        }
    };

    const handleDeclineMeeting = async (meetingId, notificationId, message) => {
        try {
            // 1) reject on the server (deletes meeting & notifies client)
            await axios.put(
                `${API_URL}/api/meetings/${meetingId}/reject`,
                {},
                { headers }
            );

            // 2) delete all identical meeting_request notifications
            await deleteAllWithMessage(message);

            // 3) show info popup
            setSnackbar({
                open: true,
                message: 'Meeting declined',
                severity: 'info'
            });
        } catch (err) {
            console.error('Decline failed:', err);
            setSnackbar({
                open: true,
                message: 'Failed to decline meeting',
                severity: 'error'
            });
        }
    };

    const handleAcceptChange = async () => {
        try {
            await axios.put(
                `${API_URL}/api/notifications/change_request/accept`,
                {
                    projectId: selectedProjectId
                },
                { headers }
            );
            await deleteNotification(selectedNotificationId);
            setSnackbar({ open: true, message: 'Change request accepted.', severity: 'success' });
        } catch (err) {
            console.error("Accept failed:", err);
            setSnackbar({ open: true, message: 'Failed to accept change.', severity: 'error' });
        }
        setOpenDialog(false);
    };

    const handleRejectChange = async () => {
        try {
            await axios.put(
                `${API_URL}/api/notifications/change_request/reject`,
                {
                    projectId: selectedProjectId
                },
                { headers }
            );
            await deleteNotification(selectedNotificationId);
            setSnackbar({ open: true, message: 'Change request rejected.', severity: 'info' });
        } catch (err) {
            console.error("Reject failed:", err);
            setSnackbar({ open: true, message: 'Failed to reject change.', severity: 'error' });
        }
        setOpenDialog(false);
    };


    return (
        <Layout>
            <Box sx={{ p:3, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
                <Paper elevation={0} sx={{ flex:1, borderRadius:2, overflow:'hidden' }}>
                    <Box sx={{ p:3, borderBottom:1, borderColor:'divider', display:'flex', justifyContent:'space-between' }}>
                        <Typography variant="h5" fontWeight={600}>Notifications</Typography>
                        <Chip
                            label={`${notifications.filter(n => n.status === 'unread').length} unread`}
                            color="primary"
                            size="small"
                        />
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Message</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {notifications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography color="text.secondary">No notifications to show.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : notifications.map(n => (
                                    <TableRow
                                        key={n.id}
                                        sx={{ bgcolor: n.status === 'unread' ? 'action.hover' : 'transparent' }}
                                    >
                                        <TableCell>
                                            <Chip
                                                label={n.type}
                                                size="small"
                                                sx={{ backgroundColor: TYPE_COLOR_MAP[n.type] || '#ECEFF1', color: '#000' }}
                                            />                                        </TableCell>
                                        <TableCell>
                                            <Typography noWrap title={n.message}>{n.message}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {n.timestamp?.seconds
                                                ? new Date(n.timestamp.seconds * 1000).toLocaleString()
                                                : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={n.status} size="small" color={n.status === 'unread' ? 'warning' : 'default'} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display:'flex', gap:1, justifyContent:'flex-end' }}>
                                                {n.type === 'meeting_request' && (
                                                    <>
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleAcceptMeeting(n.meetingId, n.id, n.message)}
                                                        >
                                                            <CheckIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeclineMeeting(n.meetingId, n.id, n.message)}
                                                        >
                                                            <ClearIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                                {n.status === 'unread' && (
                                                    <IconButton size="small" color="primary" onClick={() => markAsRead(n.id)}>
                                                        <MarkEmailReadIcon />
                                                    </IconButton>
                                                )}
                                                {n.type === 'payment_request' && n.paymentUrl && (
                                                    <Chip
                                                        label="Pay Now"
                                                        size="small"
                                                        color="success"
                                                        onClick={() => { markAsRead(n.id); openPayment(n.paymentUrl); }}
                                                        sx={{ cursor:'pointer' }}
                                                    />
                                                )}
                                                {n.type === 'change_request' && (
                                                    <Chip
                                                        label="View"
                                                        color="error"
                                                        size="small"
                                                        onClick={() => {
                                                            markAsRead(n.id);
                                                            setDialogMessage(n.message);
                                                            setSelectedNotificationId(n.id);
                                                            setSelectedProjectId(n.projectId);
                                                            setOpenDialog(true);
                                                        }}
                                                        sx={{ cursor: 'pointer' }}
                                                    />
                                                )}
                                                <IconButton size="small" color="error" onClick={() => deleteNotification(n.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <Box sx={{ p: 3, minWidth: 300 }}>
                    <Typography variant="h6" gutterBottom>Change Request</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{dialogMessage}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <IconButton color="success" onClick={handleAcceptChange}>
                            <CheckIcon />
                        </IconButton>
                        <IconButton color="error" onClick={handleRejectChange}>
                            <ClearIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Dialog>
        </Layout>
    );
};

export default NotificationList;
