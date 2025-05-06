// MessageCenter.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Grid, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText,
    Typography, TextField, IconButton, Badge, Container, Card, CardHeader, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import Layout from '../Layout';
import { styled } from '@mui/material/styles';
import SockJS from 'sockjs-client/dist/sockjs';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import debounce from 'lodash/debounce';


const MessageContainer = styled(Paper)(({ theme }) => ({
    height: 'calc(100vh - 200px)',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
    overflow: 'hidden',
}));

const MessageList = styled(Box)(({ theme }) => ({
    flexGrow: 1,
    overflow: 'auto',
    padding: theme.spacing(3),
    background: '#f9fafc',
}));

const MessageInput = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    background: 'white',
}));

const ConversationHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    background: 'white',
}));

const MessageBubble = styled(Box)(({ theme, isUser }) => ({
    maxWidth: '70%',
    background: isUser ? theme.palette.primary.main : 'white',
    color: isUser ? 'white' : theme.palette.text.primary,
    padding: theme.spacing(2),
    borderRadius: '12px',
    borderTopLeftRadius: isUser ? '12px' : '4px',
    borderTopRightRadius: isUser ? '4px' : '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    marginBottom: theme.spacing(2),
}));

const MessageCenter = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');
    const messageEndRef = useRef(null);

    const token = localStorage.getItem('token');
    const user = jwtDecode(token); // assumes token contains id, email, role

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('✅ Connected to WebSocket');
                client.subscribe('/topic/messages', (message) => {
                    const msg = JSON.parse(message.body);
                    if (msg.receiverId === user.id || msg.senderId === user.id) {
                        updateMessageList(msg);
                    }
                });
            },
        });

        client.activate();
        setStompClient(client);

        // Fetch conversations on mount
        const fetchConversations = async () => {
            try {
                const res = await axios.get(`http://localhost:8080/api/messages/conversations/${user.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setConversations(res.data);
            } catch (err) {
                console.error("❌ Failed to fetch conversations:", err);
            }
        };

        fetchConversations();

        return () => client.deactivate();
    }, []);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);

    const updateMessageList = (msg) => {
        setConversations(prev =>
            prev.map(conv => {
                if (conv.id === msg.senderId || conv.id === msg.receiverId) {
                    const updatedMessages = [...(conv.messages || []), msg];
                    return { ...conv, messages: updatedMessages };
                }
                return conv;
            })
        );

        setSelectedConversation(prev => {
            if (!prev) return prev;
            const isInCurrent = msg.senderId === prev.id || msg.receiverId === prev.id;
            if (!isInCurrent) return prev;
            return { ...prev, messages: [...(prev.messages || []), msg] };
        });
    };


    const handleSendMessage = () => {
        if (!stompClient || !stompClient.connected || !newMessage.trim() || !selectedConversation) return;

        const msg = {
            senderId: user.id,
            receiverId: selectedConversation.id,
            content: newMessage,
            timestamp: new Date().toISOString(),
        };

        stompClient.publish({
            destination: '/app/chat.send',
            body: JSON.stringify(msg),
        });

        setNewMessage('');
    };


    const fetchMessages = async (contactId) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/messages/${user.id}/${contactId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return res.data;
        } catch (err) {
            console.error('❌ Failed to fetch messages:', err);
            return [];
        }
    };

    const handleSelectConversation = async (conversation) => {
        const messages = await fetchMessages(conversation.id);
        setSelectedConversation({ ...conversation, messages });
    };

    const handleNewMessageByEmail = async () => {
        try {
            const res = await axios.get(`http://localhost:8080/api/users/by-email/${recipientEmail}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userData = res.data;
            const existing = conversations.find(c => c.id === userData.id);
            if (!existing) {
                const newConv = {
                    id: userData.id,
                    contactName: `${userData.name} ${userData.surname || ''}`,
                    messages: []
                };
                setConversations(prev => [...prev, newConv]);
                setSelectedConversation(newConv);
            } else {
                handleSelectConversation(existing);
            }
        } catch (err) {
            alert("❌ Could not find user with this email.");
        }
        setOpenDialog(false);
        setRecipientEmail('');
    };

    const getUnreadCount = (conversation) =>
        conversation.messages?.filter(m => !m.read && m.senderId !== user.id).length || 0;

    return (
        <Layout>
            <Container maxWidth={false} sx={{ py: 3, px: 3, height: 'calc(100vh - 100px)' }}>
                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <CardHeader
                        title="Messages"
                        action={
                            <Button onClick={() => setOpenDialog(true)} variant="contained">
                                New Message
                            </Button>
                        }
                    />
                    <CardContent sx={{ flex: 1, display: 'flex', overflow: 'hidden', px: 0 }}>
                        <Box sx={{ display: 'flex', width: '100%', gap: 3, height: '100%' }}>

                            {/* Left Panel - Sidebar */}
                            <Box sx={{ width: '300px', flexShrink: 0 }}>
                                <Paper sx={{ height: '100%', overflow: 'hidden' }}>
                                    <Box sx={{ p: 2 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            InputProps={{
                                                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                                            }}
                                        />
                                    </Box>
                                    <List sx={{ overflow: 'auto', height: 'calc(100% - 64px)' }}>
                                        {conversations
                                            .filter(c =>
                                                c.contactName.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map(c => (
                                                <ListItem
                                                    key={c.id}
                                                    button
                                                    selected={selectedConversation?.id === c.id}
                                                    onClick={() => handleSelectConversation(c)}
                                                >
                                                    <ListItemAvatar>
                                                        <Badge badgeContent={getUnreadCount(c)} color="error">
                                                            <Avatar>{c.contactName[0]}</Avatar>
                                                        </Badge>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={c.contactName}
                                                        secondary={c.messages?.slice(-1)[0]?.content}
                                                    />
                                                </ListItem>
                                            ))}
                                    </List>
                                </Paper>
                            </Box>

                            {/* Right Panel - Chat */}
                            <Box sx={{ flexGrow: 1 }}>
                                <MessageContainer elevation={0}>
                                    {selectedConversation ? (
                                        <>
                                            <ConversationHeader>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    {selectedConversation.contactName}
                                                </Typography>
                                            </ConversationHeader>
                                            <MessageList>
                                                {selectedConversation.messages?.map((m, i) => (
                                                    <Box
                                                        key={i}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: m.senderId === user.id ? 'flex-end' : 'flex-start',
                                                        }}
                                                    >
                                                        <MessageBubble isUser={m.senderId === user.id}>
                                                            <Typography>{m.content}</Typography>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{ display: 'block', mt: 0.5, opacity: 0.6 }}
                                                            >
                                                                {new Date(m.timestamp).toLocaleTimeString()}
                                                            </Typography>
                                                        </MessageBubble>
                                                    </Box>
                                                ))}
                                                <div ref={messageEndRef} />
                                            </MessageList>
                                            <MessageInput>
                                                <TextField
                                                    fullWidth
                                                    placeholder="Type a message..."
                                                    value={newMessage}
                                                    onChange={e => setNewMessage(e.target.value)}
                                                    onKeyPress={e => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendMessage();
                                                        }
                                                    }}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <IconButton
                                                                onClick={handleSendMessage}
                                                                disabled={!newMessage.trim()}
                                                                color="primary"
                                                            >
                                                                <SendIcon />
                                                            </IconButton>
                                                        ),
                                                    }}
                                                />
                                            </MessageInput>
                                        </>
                                    ) : (
                                        <Box sx={{ p: 3, textAlign: 'center' }}>
                                            <Typography variant="h6">Select a conversation</Typography>
                                        </Box>
                                    )}
                                </MessageContainer>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Container>

            {/* New Message Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Start New Message</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        label="Recipient Email"
                        fullWidth
                        value={recipientEmail}
                        onChange={e => setRecipientEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleNewMessageByEmail} variant="contained">
                        Start
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
};

export default MessageCenter;
