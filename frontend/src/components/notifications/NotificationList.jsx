import React, { useState } from 'react';
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

const NotificationList = () => {
    const [notifications] = useState([
        {
            id: 1,
            type: 'Project Update',
            message: 'Wedding photoshoot project has been updated',
            date: '2024-03-15',
            status: 'unread'
        },
        {
            id: 2,
            type: 'New Comment',
            message: 'Client left a comment on Corporate Event photos',
            date: '2024-03-14',
            status: 'read'
        },
        {
            id: 3,
            type: 'Deadline',
            message: 'Product photoshoot deadline approaching',
            date: '2024-03-13',
            status: 'unread'
        }
    ]);

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
                                {notifications.map((notification) => (
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
                                                color={
                                                    notification.type === 'Project Update' ? 'primary' :
                                                        notification.type === 'New Comment' ? 'success' : 'warning'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{notification.message}</TableCell>
                                        <TableCell>{notification.date}</TableCell>
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
                                                    <IconButton size="small" color="primary">
                                                        <MarkEmailReadIcon />
                                                    </IconButton>
                                                )}
                                                <IconButton size="small" color="error">
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
        </Layout>
    );
};

export default NotificationList; 