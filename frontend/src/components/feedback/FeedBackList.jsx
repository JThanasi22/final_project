import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Rating,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';

const mockFeedback = [
    {
        id: 1,
        projectTitle: 'Wedding Photography',
        clientName: 'John & Sarah Smith',
        rating: 5,
        comment: 'Amazing work! The photos captured our special day perfectly. Every moment was beautifully documented.',
        date: '2024-03-15',
        status: 'Unread',
        reply: null,
    },
    {
        id: 2,
        projectTitle: 'Corporate Event',
        clientName: 'Tech Solutions Inc.',
        rating: 4,
        comment: 'Professional service and great photos. Would recommend for any corporate event.',
        date: '2024-03-10',
        status: 'Replied',
        reply: 'Thank you for your feedback! We enjoyed working with your team.',
    },
    {
        id: 3,
        projectTitle: 'Product Photography',
        clientName: 'Fashion Brand Co.',
        rating: 4.5,
        comment: 'Excellent product shots that really showcase our new collection. Looking forward to working together again.',
        date: '2024-03-05',
        status: 'Unread',
        reply: null,
    },
];

const FeedbackList = () => {
    const [feedback, setFeedback] = useState([]);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        // Simulating API call with mock data
        setFeedback(mockFeedback);
    }, []);

    const handleOpenReplyDialog = (item) => {
        setSelectedFeedback(item);
        setReplyText(item.reply || '');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedFeedback(null);
        setReplyText('');
    };

    const handleSendReply = () => {
        // Simulate sending reply
        const updatedFeedback = feedback.map(item =>
            item.id === selectedFeedback.id
                ? { ...item, reply: replyText, status: 'Replied' }
                : item
        );
        setFeedback(updatedFeedback);
        handleCloseDialog();
    };

    const handleDelete = (feedbackId) => {
        // Simulate deleting feedback
        setFeedback(feedback.filter(item => item.id !== feedbackId));
    };

    const filteredFeedback = feedback.filter(item => {
        if (filter === 'ALL') return true;
        return item.status.toUpperCase() === filter;
    });

    return (
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
                p: 3,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                mb: 3,
                borderLeft: '4px solid #4a6fdc'
            }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Client Feedback
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ReplyIcon />}
                    >
                        Respond to Feedback
                    </Button>
                </Box>
                <Typography variant="subtitle1" color="text.secondary">
                    Review and manage client feedback for your projects
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
                    <MenuItem value="ALL">All Feedback</MenuItem>
                    <MenuItem value="UNREAD">Unread</MenuItem>
                    <MenuItem value="REPLIED">Replied</MenuItem>
                </TextField>
            </Box>

            <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
                {filteredFeedback.map((item) => (
                    <Grid item xs={12} key={item.id}>
                        <Paper elevation={0} sx={{
                            p: 3,
                            borderRadius: '12px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            width: '100%'
                        }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                mb: 2
                            }}>
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        {item.projectTitle}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            color: 'text.secondary'
                                        }}>
                                            <PersonIcon fontSize="small" />
                                            <Typography variant="body2">
                                                {item.clientName}
                                            </Typography>
                                        </Box>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            color: 'text.secondary'
                                        }}>
                                            <EventIcon fontSize="small" />
                                            <Typography variant="body2">
                                                {new Date(item.date).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <Chip
                                        label={item.status}
                                        color={item.status === 'Unread' ? 'error' : 'success'}
                                        size="small"
                                    />
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(item.id)}
                                        title="Delete feedback"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Rating
                                    value={item.rating}
                                    readOnly
                                    precision={0.5}
                                />
                            </Box>

                            <Typography variant="body1" sx={{
                                bgcolor: '#f8f9fa',
                                p: 2,
                                borderRadius: '8px',
                                fontStyle: 'italic'
                            }}>
                                "{item.comment}"
                            </Typography>

                            {item.reply && (
                                <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Reply: {item.reply}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                <Box>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleOpenReplyDialog(item)}
                                        disabled={item.status === 'Replied'}
                                        title={item.status === 'Replied' ? 'Already replied' : 'Reply to feedback'}
                                    >
                                        <ReplyIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {filteredFeedback.length === 0 && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        No feedback available for the selected filter
                    </Typography>
                </Box>
            )}

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Reply to Feedback
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Original Feedback:
                        </Typography>
                        <Typography color="text.secondary" paragraph>
                            {selectedFeedback?.comment}
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Your Reply"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSendReply}
                        variant="contained"
                        color="primary"
                        disabled={!replyText.trim()}
                    >
                        Send Reply
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FeedbackList;