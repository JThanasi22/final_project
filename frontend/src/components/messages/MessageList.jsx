import React, { useState, useEffect, useRef } from 'react';
import {
    Box, List, ListItem, ListItemText, ListItemAvatar, Avatar,
    Typography, Paper, TextField, IconButton, Divider, Badge, InputAdornment
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import { deepOrange, deepPurple, blue } from '@mui/material/colors';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import jwtDecode from 'jwt-decode';
import axios from 'axios';

const MessageList = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const messageEndRef = useRef(null);

    const token = localStorage.getItem('token');
    const user = jwtDecode(token); // Assumes token has { userId, email, role }

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe('/topic/messages', (msg) => {
                    const message = JSON.parse(msg.body);
                    if (message.senderId === user.userId || message.receiverId === user.userId) {
                        updateMessageList(message);
                    }
                });
            }
        });

        client.activate();
        setStompClient(client);
        return () => client.deactivate();
    }, []);

    // 2. Load initial contacts list
    useEffect(() => {
        const loadConversations = async () => {
            try {
                const res = await axios.get(`http://localhost:8080/api/messages/contacts/${user.userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Expecting an array of { id, contactName }
                const contacts = res.data.map(contact => ({
                    ...contact,
                    messages: [] // will be loaded on click
                }));

                setConversations(contacts);
            } catch (err) {
                console.error('Error loading conversations:', err);
            }
        };

        loadConversations();
    }, []);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation]);

    const updateMessageList = (msg) => {
        setConversations(prev =>
            prev.map(conv => {
                if (conv.id === msg.senderId || conv.id === msg.receiverId) {
                    return { ...conv, messages: [...(conv.messages || []), msg] };
                }
                return conv;
            })
        );

        if (selectedConversation && (msg.senderId === selectedConversation.id || msg.receiverId === selectedConversation.id)) {
            setSelectedConversation(prev => ({
                ...prev,
                messages: [...(prev.messages || []), msg]
            }));
        }
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedConversation || !stompClient) return;

        const msg = {
            senderId: user.userId,
            receiverId: selectedConversation.id,
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        stompClient.publish({
            destination: '/app/chat.send',
            body: JSON.stringify(msg)
        });

        setNewMessage('');
    };

    const handleSelectConversation = async (conv) => {
        const res = await axios.get(`http://localhost:8080/api/messages/${user.userId}/${conv.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const updated = { ...conv, messages: res.data };
        setSelectedConversation(updated);
    };

    const getAvatarColor = (name) => {
        const colors = [deepOrange[500], deepPurple[500], blue[500]];
        const charCode = name.charCodeAt(0);
        return colors[charCode % colors.length];
    };

    const getUnreadCount = (conv) => conv.messages?.filter(msg => !msg.read && msg.senderId !== user.userId).length || 0;

    const filteredConversations = conversations.filter(conv =>
        conv.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
            {/* Sidebar */}
            <Paper sx={{ width: 320 }}>
                <Box sx={{ p: 2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <Divider />
                <List sx={{ overflow: 'auto', height: 'calc(100% - 80px)' }}>
                    {filteredConversations.map(conv => (
                        <ListItem
                            key={conv.id}
                            button
                            selected={selectedConversation?.id === conv.id}
                            onClick={() => handleSelectConversation(conv)}
                        >
                            <ListItemAvatar>
                                <Badge badgeContent={getUnreadCount(conv)} color="error">
                                    <Avatar sx={{ bgcolor: getAvatarColor(conv.contactName) }}>
                                        {conv.contactName[0]}
                                    </Avatar>
                                </Badge>
                            </ListItemAvatar>
                            <ListItemText
                                primary={conv.contactName}
                                secondary={conv.messages?.slice(-1)[0]?.content || ''}
                                secondaryTypographyProps={{
                                    noWrap: true,
                                    style: { maxWidth: '200px' },
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* Message Pane */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedConversation ? (
                    <>
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <Typography variant="h6">{selectedConversation.contactName}</Typography>
                        </Box>

                        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                            {selectedConversation.messages?.map((msg, idx) => (
                                <Box
                                    key={idx}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: msg.senderId === user.userId ? 'flex-end' : 'flex-start',
                                        mb: 2
                                    }}
                                >
                                    <Box
                                        sx={{
                                            maxWidth: '70%',
                                            bgcolor: msg.senderId === user.userId ? 'primary.main' : 'grey.100',
                                            color: msg.senderId === user.userId ? 'white' : 'text.primary',
                                            p: 2,
                                            borderRadius: 2
                                        }}
                                    >
                                        <Typography>{msg.content}</Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{ display: 'block', mt: 0.5, color: msg.senderId === user.userId ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}
                                        >
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                            <div ref={messageEndRef} />
                        </Box>

                        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                            <TextField
                                fullWidth
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                                <SendIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    </>
                ) : (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            Select a conversation to start messaging
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MessageList;