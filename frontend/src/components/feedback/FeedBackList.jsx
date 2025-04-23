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
    Container,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import Layout from '../Layout';

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
        <Layout>
            <Container maxWidth="xl" sx={{ py: 4, px: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 500, color: '#333' }}>
                            Client Feedback
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                            Review and manage client feedback for your projects
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<ReplyIcon />}
                        sx={{ 
                            borderRadius: '8px', 
                            px: 3, 
                            py: 1.2,
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                            textTransform: 'none',
                            fontSize: '0.95rem'
                        }}
                    >
                        Respond to Feedback
                    </Button>
                </Box>

                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 4 
                }}>
                    <TextField
                        select
                        size="small"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        sx={{ 
                            minWidth: 180,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                            }
                        }}
                    >
                        <MenuItem value="ALL">All Feedback</MenuItem>
                        <MenuItem value="UNREAD">Unread</MenuItem>
                        <MenuItem value="REPLIED">Replied</MenuItem>
                    </TextField>
                </Box>

                {filteredFeedback.map((item) => (
                    <Card 
                        key={item.id} 
                        sx={{
                            mb: 3,
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            border: '1px solid #eaecef',
                            overflow: 'visible',
                            position: 'relative',
                            '&:hover': {
                                boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                            },
                        }}
                    >
                        <Box sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            bottom: 0, 
                            width: '6px', 
                            borderTopLeftRadius: '16px',
                            borderBottomLeftRadius: '16px',
                            bgcolor: item.status === 'Unread' ? '#f44336' : '#4caf50' 
                        }} />

                        <CardContent sx={{ p: 3, pl: 4 }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                mb: 2
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 500, color: '#333' }}>
                                    {item.projectTitle}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <Chip
                                        label={item.status}
                                        color={item.status === 'Unread' ? 'error' : 'success'}
                                        size="small"
                                        sx={{ 
                                            borderRadius: '16px', 
                                            fontWeight: 500,
                                            px: 1
                                        }}
                                    />
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(item.id)}
                                        title="Delete feedback"
                                        sx={{ 
                                            bgcolor: 'rgba(244,67,54,0.08)',
                                            '&:hover': {
                                                bgcolor: 'rgba(244,67,54,0.12)',
                                            } 
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 3, mb: 3, alignItems: 'center' }}>
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
                                <Rating
                                    value={item.rating}
                                    readOnly
                                    precision={0.5}
                                    size="small"
                                />
                            </Box>

                            <Box sx={{ 
                                bgcolor: '#f9fafc', 
                                p: 3, 
                                borderRadius: '12px',
                                mb: item.reply ? 3 : 0,
                                fontStyle: 'italic' 
                            }}>
                                <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#333' }}>
                                    "{item.comment}"
                                </Typography>
                            </Box>

                            {item.reply && (
                                <Box sx={{ 
                                    p: 2, 
                                    ml: 3, 
                                    bgcolor: 'rgba(33, 150, 243, 0.05)',
                                    borderRadius: '12px',
                                    borderLeft: '3px solid #2196f3',
                                }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        Your reply:
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {item.reply}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    startIcon={<ReplyIcon />}
                                    onClick={() => handleOpenReplyDialog(item)}
                                    disabled={item.status === 'Replied'}
                                    sx={{ 
                                        borderRadius: '8px',
                                        textTransform: 'none'
                                    }}
                                >
                                    {item.status === 'Replied' ? 'Already Replied' : 'Reply'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}

                {filteredFeedback.length === 0 && (
                    <Box sx={{ 
                        textAlign: 'center', 
                        mt: 4, 
                        p: 4, 
                        bgcolor: '#f9fafc', 
                        borderRadius: '16px' 
                    }}>
                        <Typography variant="body1" color="text.secondary">
                            No feedback available for the selected filter
                        </Typography>
                    </Box>
                )}
            </Container>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    backgroundColor: '#f9fafc', 
                    borderBottom: '1px solid #eaecef',
                    p: 2.5
                }}>
                    <Typography variant="h6">Reply to Feedback</Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 3, pt: 3 }}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Original Feedback:
                        </Typography>
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: '#f9fafc', 
                            borderRadius: '8px',
                            mb: 3,
                            fontStyle: 'italic' 
                        }}>
                            <Typography color="text.secondary">
                                {selectedFeedback?.comment}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Your Reply"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid #eaecef' }}>
                    <Button 
                        onClick={handleCloseDialog}
                        sx={{ 
                            textTransform: 'none',
                            fontWeight: 500
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSendReply}
                        variant="contained"
                        color="primary"
                        disabled={!replyText.trim()}
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: '8px',
                            px: 3,
                            fontWeight: 500
                        }}
                    >
                        Send Reply
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
};

export default FeedbackList;