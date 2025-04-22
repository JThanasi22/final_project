import React, { useState, useEffect, useRef } from 'react';
import {
    Grid,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Box,
    TextField,
    IconButton,
    Divider,
    Badge,
    Card,
    CardHeader,
    CardContent,
    Container,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';
import Layout from '../Layout';

const mockConversations = [
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

const MessageContainer = styled(Paper)(({ theme }) => ({
    height: 'calc(100vh - 200px)',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
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

const ContactListContainer = styled(Paper)(({ theme }) => ({
    height: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
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
    const messageEndRef = useRef(null);

    useEffect(() => {
        // Simulating API call with mock data
        setConversations(mockConversations);
    }, []);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);

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
        setSelectedConversation(updatedConversations.find(c => c.id === selectedConversation.id));
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
        setSelectedConversation(updatedConversations.find(c => c.id === conversation.id));
    };

    const getUnreadCount = (conversation) => {
        return conversation.messages.filter(msg => !msg.read && msg.sender === 'contact').length;
    };

    const filteredConversations = conversations.filter(conv =>
        conv.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout>
            <Container maxWidth="xl" sx={{ py: 3, px: 3, height: 'calc(100vh - 100px)' }}>
                <Card sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                }}>
                    <CardHeader 
                        title="Messages" 
                        sx={{ 
                            bgcolor: '#ffffff', 
                            borderBottom: '1px solid #eaecef',
                            p: 2,
                        }} 
                    />
                    <CardContent sx={{ p: 0, flex: 1, display: 'flex', overflow: 'hidden' }}>
                        <Grid container sx={{ height: '100%' }}>
                            {/* Conversations List */}
                            <Grid item xs={12} md={4} sx={{ 
                                height: '100%',
                                borderRight: '1px solid #eaecef',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <ContactListContainer elevation={0}>
                                    <Box sx={{ p: 2, borderBottom: '1px solid #eaecef' }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Search conversations..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                                ),
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '8px',
                                                }
                                            }}
                                        />
                                    </Box>
                                    <List sx={{ 
                                        flexGrow: 1, 
                                        overflow: 'auto',
                                        bgcolor: '#f9fafc',
                                        p: 0 
                                    }}>
                                        {filteredConversations.map((conversation) => (
                                            <ListItem
                                                key={conversation.id}
                                                button
                                                selected={selectedConversation?.id === conversation.id}
                                                onClick={() => handleSelectConversation(conversation)}
                                                sx={{
                                                    borderLeft: selectedConversation?.id === conversation.id 
                                                        ? '4px solid #4a6fdc' 
                                                        : '4px solid transparent',
                                                    bgcolor: selectedConversation?.id === conversation.id 
                                                        ? 'rgba(74, 111, 220, 0.08)' 
                                                        : 'transparent',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                                                    },
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <ListItemAvatar>
                                                    <Badge
                                                        badgeContent={getUnreadCount(conversation)}
                                                        color="error"
                                                        overlap="circular"
                                                    >
                                                        <Avatar sx={{ bgcolor: '#4a6fdc' }}>
                                                            {conversation.contactName[0]}
                                                        </Avatar>
                                                    </Badge>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                            {conversation.contactName}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography 
                                                            variant="body2" 
                                                            sx={{ 
                                                                color: 'text.secondary',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                maxWidth: '180px'
                                                            }}
                                                        >
                                                            {conversation.messages[conversation.messages.length - 1].text}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </ContactListContainer>
                            </Grid>

                            {/* Messages View */}
                            <Grid item xs={12} md={8} sx={{ height: '100%' }}>
                                <MessageContainer elevation={0}>
                                    {selectedConversation ? (
                                        <>
                                            {/* Messages Header */}
                                            <ConversationHeader>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{ mr: 2, bgcolor: '#4a6fdc' }}>
                                                        {selectedConversation.contactName[0]}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                            {selectedConversation.contactName}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {selectedConversation.messages.length} messages
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </ConversationHeader>

                                            {/* Messages Content */}
                                            <MessageList>
                                                {selectedConversation.messages.map((message) => (
                                                    <Box
                                                        key={message.id}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                                            mb: 2,
                                                        }}
                                                    >
                                                        <MessageBubble isUser={message.sender === 'user'}>
                                                            <Typography sx={{ lineHeight: 1.5 }}>
                                                                {message.text}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    display: 'block',
                                                                    mt: 0.5,
                                                                    textAlign: 'right',
                                                                    color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                                                                }}
                                                            >
                                                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Typography>
                                                        </MessageBubble>
                                                    </Box>
                                                ))}
                                                <div ref={messageEndRef} />
                                            </MessageList>

                                            {/* Message Input */}
                                            <MessageInput>
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
                                                            <IconButton
                                                                onClick={handleSendMessage}
                                                                disabled={!newMessage.trim()}
                                                                color="primary"
                                                                sx={{ 
                                                                    bgcolor: newMessage.trim() ? 'primary.main' : 'transparent',
                                                                    color: newMessage.trim() ? 'white' : 'inherit',
                                                                    '&:hover': {
                                                                        bgcolor: newMessage.trim() ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)',
                                                                    },
                                                                }}
                                                            >
                                                                <SendIcon />
                                                            </IconButton>
                                                        ),
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '24px',
                                                            '& fieldset': {
                                                                borderColor: '#e0e0e0',
                                                            },
                                                        },
                                                    }}
                                                />
                                            </MessageInput>
                                        </>
                                    ) : (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                height: '100%',
                                                p: 3,
                                                bgcolor: '#f9fafc',
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src="https://cdn-icons-png.flaticon.com/512/1041/1041916.png"
                                                alt="Empty messages"
                                                sx={{ width: 120, height: 120, opacity: 0.5, mb: 2 }}
                                            />
                                            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                Select a conversation
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                                                Choose a contact from the list to start messaging
                                            </Typography>
                                        </Box>
                                    )}
                                </MessageContainer>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Container>
        </Layout>
    );
};

export default MessageCenter; 