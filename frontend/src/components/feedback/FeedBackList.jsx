import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Rating, IconButton, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem, Container, Card, CardContent
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Layout from '../Layout';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const FeedbackList = () => {
    const [feedback, setFeedback] = useState([]);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [expandedFeedbackIds, setExpandedFeedbackIds] = useState([]);
    const [openNewDialog, setOpenNewDialog] = useState(false);
    const [newFeedback, setNewFeedback] = useState({
        projectTitle: '',
        clientName: '',
        comment: '',
        rating: 0,
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode(token);
            setNewFeedback(prev => ({ ...prev, clientName: decoded.email || '' }));
        }

        const config = {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        };

        axios.get('http://localhost:8080/api/feedback', config)
            .then(res => setFeedback(res.data))
            .catch(err => console.error('Error loading feedback:', err));
    }, []);

    const handleToggleReplies = (id) => {
        setExpandedFeedbackIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleOpenReplyDialog = (item) => {
        setSelectedFeedback(item);
        setReplyText('');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedFeedback(null);
        setReplyText('');
    };

    const handleSendReply = async () => {
        const reply = {
            comment: replyText,
            parentId: selectedFeedback.id,
            date: new Date().toISOString().split('T')[0]
        };

        const config = {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        };

        await axios.post('http://localhost:8080/api/feedback', reply, config);
        const res = await axios.get('http://localhost:8080/api/feedback', config);
        setFeedback(res.data);
        handleCloseDialog();
    };

    const handleDelete = async (id) => {
        alert('Delete logic not implemented');
    };

    const handleOpenNewDialog = () => {
        setOpenNewDialog(true);
    };

    const handleCloseNewDialog = () => {
        setOpenNewDialog(false);
        setNewFeedback({
            projectTitle: '',
            clientName: '',
            comment: '',
            rating: 0,
            date: new Date().toISOString().split('T')[0]
        });
    };

    const handleCreateFeedback = async () => {
        const config = {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        };

        await axios.post('http://localhost:8080/api/feedback', newFeedback, config);
        const res = await axios.get('http://localhost:8080/api/feedback', config);
        setFeedback(res.data);
        handleCloseNewDialog();
    };

    return (
        <Layout>
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" gutterBottom>Client Feedback</Typography>
                    <Button variant="contained" onClick={handleOpenNewDialog}>Create Feedback</Button>
                </Box>
                {feedback.map(item => (
                    <Card key={item.id} sx={{ mb: 2, p: 2 }}>
                        <Box display="flex" justifyContent="space-between">
                            <Box>
                                <Typography variant="h6">{item.projectTitle}</Typography>
                                <Typography variant="subtitle2">{item.clientName}</Typography>
                                <Typography variant="body2">{item.date}</Typography>
                                <Rating value={item.rating || 0} readOnly precision={0.5} size="small" />
                                <Typography variant="body1" sx={{ mt: 1 }}><i>"{item.comment}"</i></Typography>
                            </Box>
                            <Box>
                                <IconButton onClick={() => handleToggleReplies(item.id)}>
                                    {expandedFeedbackIds.includes(item.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                                <IconButton onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ReplyIcon />}
                                    onClick={() => handleOpenReplyDialog(item)}
                                >Reply</Button>
                            </Box>
                        </Box>
                        {expandedFeedbackIds.includes(item.id) && item.replies && item.replies.length > 0 && (
                            <Box mt={2} pl={4}>
                                {item.replies.map(reply => (
                                    <Paper key={reply.id} sx={{ p: 2, mb: 1, bgcolor: '#f0f0f0' }}>
                                        <Typography variant="body2">{reply.date}</Typography>
                                        <Typography variant="body1">{reply.comment}</Typography>
                                    </Paper>
                                ))}
                            </Box>
                        )}
                    </Card>
                ))}

                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Reply to Feedback</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Your Reply"
                            fullWidth
                            multiline
                            rows={4}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSendReply} disabled={!replyText.trim()} variant="contained">Send</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={openNewDialog} onClose={handleCloseNewDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Create New Feedback</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Project Title"
                            fullWidth
                            margin="normal"
                            value={newFeedback.projectTitle}
                            onChange={(e) => setNewFeedback({ ...newFeedback, projectTitle: e.target.value })}
                        />
                        <TextField
                            label="Comment"
                            fullWidth
                            margin="normal"
                            multiline
                            rows={4}
                            value={newFeedback.comment}
                            onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
                        />
                        <Rating
                            value={newFeedback.rating}
                            precision={0.5}
                            onChange={(e, newValue) => setNewFeedback({ ...newFeedback, rating: newValue })}
                            readOnly={false}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseNewDialog}>Cancel</Button>
                        <Button onClick={handleCreateFeedback} disabled={!newFeedback.comment.trim()} variant="contained">Create</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Layout>
    );
};

export default FeedbackList;