import React, { useState } from 'react';
import Layout from "../Layout.jsx";
import axios from 'axios';
import {
    Button,
    Input,
    TextField,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Snackbar,
    Alert
} from '@mui/material';
import { Send, Mail } from 'lucide-react';

const API_URL = 'http://localhost:8080';
const token = localStorage.getItem('token');
const headers = { Authorization: `Bearer ${token}` };

const Email = () => {
    const [form, setForm] = useState({
        to: '',
        subject: '',
        body: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleChange = (e) => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await axios.post(`${API_URL}/api/email/send`, form, { headers });
            setSnackbar({ open: true, message: 'Email sent successfully!', severity: 'success' });
            setForm({ to: '', subject: '', body: '' });
        } catch (err) {
            console.error("Email send failed:", err);
            setSnackbar({ open: true, message: 'Failed to send email.', severity: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <div
                style={{
                    padding: '4rem 2rem',
                    maxWidth: '1000px',
                    margin: '0 auto',
                    width: '100%'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Typography variant="h4" fontWeight={600}>
                        Email Composer
                    </Typography>
                </div>

                <Card elevation={4} style={{ width: '100%' }}>
                    <CardHeader
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Mail size={50}  color="#1976d2" />
                                <Typography variant="h6">Compose Email</Typography>
                            </div>
                        }
                    />
                    <CardContent>
                        <form
                            onSubmit={handleSubmit}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '2rem',
                                alignItems: 'start'
                            }}
                        >
                            <div style={{ gridColumn: 'span 2' }}>
                                <label htmlFor="to">To</label>
                                <Input
                                    id="to"
                                    name="to"
                                    type="email"
                                    fullWidth
                                    required
                                    value={form.to}
                                    onChange={handleChange}
                                    style={{ width: '100%' }}
                                />
                                <label htmlFor="subject">Subject</label>
                                <Input
                                    id="subject"
                                    name="subject"
                                    fullWidth
                                    required
                                    value={form.subject}
                                    onChange={handleChange}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label htmlFor="body">Message</label>
                                <TextField
                                    id="body"
                                    name="body"
                                    fullWidth
                                    required
                                    multiline
                                    rows={10}
                                    value={form.body}
                                    onChange={handleChange}
                                    style={{ width: '200%', paddingLeft: '1rem' }}
                                />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={isLoading}
                                    fullWidth
                                    startIcon={isLoading ? null : <Send />}
                                    style={{ height: '3.5rem', fontSize: '1rem' }}
                                >
                                    {isLoading ? 'Sending...' : 'Send Email'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </div>
        </Layout>

    );
};

export default Email;
