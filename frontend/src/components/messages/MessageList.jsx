import React, { useState, useEffect } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Paper,
    TextField,
    IconButton,
    Divider,
    Badge,
    InputAdornment,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import { deepOrange, deepPurple, blue } from '@mui/material/colors';

const mockMessages = [
    {
        id: 1,
        contactName: 'John Smith',
        avatar: null,
        messages: [
            {
                id: 1,
                text: 'Hi, I wanted to discuss the wedding photoshoot package',
                timestamp: '2024-03-15T10:30:00',
                sender: 'contact',
                read: true
            },
            {
                id: 2,
                text: "Of course! I'd be happy to go through the details with you.",
                timestamp: '2024-03-15T10:35:00',
                sender: 'user',
                read: true
            },
            {
                id: 3,
                text: 'What date are you planning for the wedding?',
                timestamp: '2024-03-15T10:36:00',
                sender: 'user',
                read: true
            }
        ]
    },
    {
        id: 2,
        contactName: 'Sarah Johnson',
        avatar: null,
        messages: [
            {
                id: 1,
                text: 'The product photos look amazing!',
                timestamp: '2024-03-14T15:20:00',
                sender: 'contact',
                read: false
            }
        ]
    },
    {
        id: 3,
        contactName: 'Tech Solutions Inc.',
        avatar: null,
        messages: [
            {
                id: 1,
                text: 'Can we schedule the corporate photoshoot for next week?',
                timestamp: '2024-03-13T09:15:00',
                sender: 'contact',
                read: true
            },
            {
                id: 2,
                text: 'Yes, I have availability on Tuesday and Thursday',
                timestamp: '2024-03-13T09:30:00',
                sender: 'user',
                read: true
            }
        ]
    }
];

const MessageList = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Simulating API call with mock data
        setConversations(mockMessages);
    }, []);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedConversation) return;

        const updatedConversations = conversations.map(conv => {
            if (conv.id === selectedConversation.id) {
                return {
                    ...conv,
                    messages: [
                        ...conv.messages,
                        {
                            id: conv.messages.length + 1,
                            text: newMessage,
                            timestamp: new Date().toISOString(),
                            sender: 'user',
                            read: true,
                        },
                    ],
                };
            }
            return conv;
        });

        setConversations(updatedConversations);
        setNewMessage('');
    };

    const handleSelectConversation = (conversation) => {
        // Mark messages as read
        const updatedConversations = conversations.map(conv => {
            if (conv.id === conversation.id) {
                return {
                    ...conv,
                    messages: conv.messages.map(msg => ({ ...msg, read: true })),
                };
            }
            return conv;
        });

        setConversations(updatedConversations);
        setSelectedConversation(conversation);
    };

    const getAvatarColor = (name) => {
        const colors = [deepOrange[500], deepPurple[500], blue[500]];
        const charCode = name.charCodeAt(0);
        return colors[charCode % colors.length];
    };

    const getUnreadCount = (conversation) => {
        return conversation.messages.filter(msg => !msg.read && msg.sender === 'contact').length;
    };

    const filteredConversations = conversations.filter(conv =>
        conv.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
            {/* Conversations List */}
            <Paper sx={{ width: 320, borderRadius: 0 }}>
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
                    {filteredConversations.map((conversation) => (
                        <ListItem
                            key={conversation.id}
                            button
                            selected={selectedConversation?.id === conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                        >
                            <ListItemAvatar>
                                <Badge
                                    badgeContent={getUnreadCount(conversation)}
                                    color="error"
                                    overlap="circular"
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: getAvatarColor(conversation.contactName),
                                        }}
                                    >
                                        {conversation.contactName[0]}
                                    </Avatar>
                                </Badge>
                            </ListItemAvatar>
                            <ListItemText
                                primary={conversation.contactName}
                                secondary={conversation.messages[conversation.messages.length - 1].text}
                                secondaryTypographyProps={{
                                    noWrap: true,
                                    style: {
                                        maxWidth: '200px',
                                    },
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* Messages View */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedConversation ? (
                    <>
                        {/* Messages Header */}
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <Typography variant="h6">
                                {selectedConversation.contactName}
                            </Typography>
                        </Box>

                        {/* Messages Content */}
                        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                            {selectedConversation.messages.map((message) => (
                                <Box
                                    key={message.id}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                        mb: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            maxWidth: '70%',
                                            bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                                            color: message.sender === 'user' ? 'white' : 'text.primary',
                                            p: 2,
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Typography>{message.text}</Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                mt: 0.5,
                                                color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                                            }}
                                        >
                                            {new Date(message.timestamp).toLocaleTimeString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        {/* Message Input */}
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
                                            <IconButton
                                                onClick={handleSendMessage}
                                                disabled={!newMessage.trim()}
                                            >
                                                <SendIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    </>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                        }}
                    >
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