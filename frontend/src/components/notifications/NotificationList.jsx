import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
    Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import Layout from '../Layout';
import axios from 'axios';

const NotificationList = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/notifications', {
                    headers: { Authorization: `Bearer ${token}` }
                });

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

    const token = localStorage.getItem('token');

    const TYPE_COLOR_MAP = {
        task_assignment:  'info',       // blue-ish
        task_completed:   'secondary',  // purple-ish
        task_reply:       'warning',    // amber
        project_update:   'primary',    // indigo
        payment_request:  'success',    // green
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'read' } : n)
            );
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axios.delete(`/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error("Failed to delete notification", err);
        }
    };

    const openPayment = (url) => {
        if (url) {
            window.open(url, "_blank");
        }
    };

    return (
        <Layout>
            <Box sx={{
                p: 3,
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Paper elevation={0} sx={{
                    width: '100%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    flex: 1
                }}>
                    <Box sx={{
                        p: 3,
                        borderBottom: '1px solid #e0e0e0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            Notifications
                        </Typography>
                        <Chip
                            label={`${notifications.filter(n => n.status === 'unread').length} unread`}
                            color="primary"
                            size="small"
                        />
                    </Box>
                    <TableContainer>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, width: '15%' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600, width: '45%' }}>Message</TableCell>
                                    <TableCell sx={{ fontWeight: 600, width: '15%' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600, width: '15%' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, width: '10%' }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {notifications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography variant="body1" color="text.secondary">
                                                No notifications to show.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    notifications.map((notification) => (
                                        <TableRow
                                            key={notification.id}
                                            sx={{
                                                '&:last-child td, &:last-child th': { border: 0 },
                                                bgcolor: notification.status === 'unread' ? '#f8f9fa' : 'transparent'
                                            }}
                                        >
                                            <TableCell>
                                                <Chip
                                                label={notification.type}
                                                size="small"
                                                color={TYPE_COLOR_MAP[notification.type] || 'default'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography title={notification.message} noWrap>
                                                    {notification.message}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {notification.timestamp?.seconds
                                                    ? new Date(notification.timestamp.seconds * 1000).toLocaleString()
                                                    : "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={notification.status}
                                                    color={notification.status === 'unread' ? 'warning' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                    {notification.status === 'unread' && (
                                                        <IconButton size="small" color="primary" onClick={() => markAsRead(notification.id)}>
                                                            <MarkEmailReadIcon />
                                                        </IconButton>
                                                    )}
                                                    {notification.type === 'payment_request' && notification.paymentUrl && (
                                                        <Chip
                                                            label="Pay Now"
                                                            color="success"
                                                            onClick={async () => {
                                                                await markAsRead(notification.id);
                                                                openPayment(notification.paymentUrl);
                                                            }}
                                                            size="small"
                                                            sx={{ cursor: 'pointer' }}
                                                        />
                                                    )}
                                                    <IconButton size="small" color="error" onClick={() => deleteNotification(notification.id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </Layout>
    );
};

export default NotificationList;
