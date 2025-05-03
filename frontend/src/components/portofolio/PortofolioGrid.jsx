import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Grid,
    Card,
    CardMedia,
    CardContent,
    Typography,
    Box,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    ImageList,
    ImageListItem,
    CircularProgress,
    Snackbar,
    Alert,
    Input
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import Layout from '../Layout';
import Sidebar from '../layout/Sidebar';
import TopNavbar from '../layout/TopNavbar';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

const API_URL = 'http://localhost:8080';

const PortfolioGrid = () => {
    const [portfolios, setPortfolios] = useState([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState(null);
    const [dialogMode, setDialogMode] = useState(null);
    const [editedPortfolio, setEditedPortfolio] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [imageInputRefs, setImageInputRefs] = useState([]);
    const [uploadingImageIndex, setUploadingImageIndex] = useState(null);
    
    // For sidebar navigation
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };
    
    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    // Fetch portfolios from API
    const fetchPortfolios = async () => {
        try {
            setLoading(true);
            console.log('Fetching portfolios from:', `${API_URL}/api/portfolios`);
            
            const response = await axios.get(`${API_URL}/api/portfolios`, {
                // Set a timeout to avoid hanging requests
                timeout: 10000,
                // Add debugging headers
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            console.log('Portfolios response:', response);
            setPortfolios(response.data);
            showSnackbar('Portfolios loaded successfully', 'success');
        } catch (error) {
            console.error('Error fetching portfolios details:', error);
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
                showSnackbar(`Failed to load portfolios: ${error.response.status} - ${error.response.data || 'Server error'}`, 'error');
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Error request:', error.request);
                showSnackbar('Failed to load portfolios: No response from server', 'error');
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
                showSnackbar('Failed to load portfolios: ' + error.message, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolios();
    }, []);

    const handleOpenDialog = (portfolio, mode) => {
        setSelectedPortfolio(portfolio);
        setDialogMode(mode);
        if (mode === 'edit') {
            // Ensure editedPortfolio is always a valid object with required properties
            const defaultPortfolio = {
                title: '',
                description: '',
                coverImage: '',
                category: '',
                date: '',
                images: [],
                userId: localStorage.getItem('userId') || ''
            };
            
            setEditedPortfolio(portfolio ? { 
                ...defaultPortfolio,
                ...portfolio,
                // Ensure images is always an array
                images: portfolio.images || []
            } : defaultPortfolio);
            
            // Initialize imageInputRefs with the correct length
            const imagesLength = (portfolio?.images?.length || 0);
            setImageInputRefs(Array(imagesLength).fill(null));
        }
    };

    const handleCloseDialog = () => {
        setSelectedPortfolio(null);
        setDialogMode(null);
        setEditedPortfolio(null);
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    const handleSave = async () => {
        if (!editedPortfolio) return;

        try {
            setLoading(true);
            
            if (selectedPortfolio && selectedPortfolio.id) {
                // Update existing portfolio
                await axios.put(
                    `${API_URL}/api/portfolios/${selectedPortfolio.id}`, 
                    editedPortfolio
                );
                showSnackbar('Portfolio updated successfully', 'success');
            } else {
                // Add new portfolio
                await axios.post(
                    `${API_URL}/api/portfolios`, 
                    editedPortfolio
                );
                showSnackbar('Portfolio created successfully', 'success');
            }
            
            // Refresh portfolios list
            fetchPortfolios();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving portfolio:', error);
            showSnackbar('Failed to save portfolio: ' + (error.response?.data || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPortfolio) return;

        try {
            setLoading(true);
            await axios.delete(`${API_URL}/api/portfolios/${selectedPortfolio.id}`);
            showSnackbar('Portfolio deleted successfully', 'success');
            
            // Refresh portfolios list
            fetchPortfolios();
            handleCloseDialog();
        } catch (error) {
            console.error('Error deleting portfolio:', error);
            showSnackbar('Failed to delete portfolio: ' + (error.response?.data || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setEditedPortfolio(prev => {
            if (!prev) return null;
            return { ...prev, [name]: value };
        });
    }, []);

    const handleImageChange = useCallback((index, field, value) => {
        setEditedPortfolio(prev => {
            if (!prev || !Array.isArray(prev.images)) return prev;
            
            return {
                ...prev,
                images: prev.images.map((img, i) => 
                    i === index ? { ...img, [field]: value } : img
                )
            };
        });
    }, []);

    const handleAddImage = () => {
        setEditedPortfolio(prev => {
            if (!prev) {
                // If editedPortfolio is null, create a default object
                const defaultPortfolio = {
                    title: '',
                    description: '',
                    coverImage: '',
                    category: '',
                    date: '',
                    userId: localStorage.getItem('userId') || '',
                    images: [{ url: '', title: '', description: '' }]
                };
                console.log('Creating default portfolio for adding image:', defaultPortfolio);
                return defaultPortfolio;
            }
            
            // Make sure images is an array before adding to it
            const currentImages = Array.isArray(prev.images) ? prev.images : [];
            
            const updatedPortfolio = {
                ...prev,
                images: [...currentImages, { url: '', title: '', description: '' }]
            };
            console.log('Adding new image to portfolio:', updatedPortfolio);
            return updatedPortfolio;
        });
        
        // Don't update refs immediately after state change - this causes infinite loop
        // Will be handled by the ref callback function in render
    };

    const handleRemoveImage = (index) => {
        if (!editedPortfolio || !Array.isArray(editedPortfolio.images)) {
            console.error('Cannot remove image: editedPortfolio or images array is not valid');
            return;
        }
        
        setEditedPortfolio(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
        
        // Update the refs array to remove the deleted ref
        setImageInputRefs(prev => {
            const newRefs = [...prev];
            newRefs.splice(index, 1);
            return newRefs;
        });
    };

    // Handle cover image upload
    const uploadCoverImage = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            console.log('Uploading cover image file:', file.name);
            const response = await axios.post(`${API_URL}/api/files/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (!response.data || !response.data.fileDownloadUri) {
                throw new Error('Invalid response from server');
            }

            console.log('Cover image uploaded successfully:', response.data);
            setEditedPortfolio(prev => {
                if (!prev) {
                    return {
                        title: '',
                        description: '',
                        coverImage: response.data.fileDownloadUri,
                        category: '',
                        date: '',
                        userId: localStorage.getItem('userId') || '',
                        images: []
                    };
                }
                return {
                    ...prev,
                    coverImage: response.data.fileDownloadUri
                };
            });

            showSnackbar('Cover image uploaded successfully', 'success');
        } catch (error) {
            console.error('Error uploading cover image file:', error);
            showSnackbar('Failed to upload image: ' + (error.response?.data || error.message), 'error');
        } finally {
            setUploading(false);
        }
    };

    // Handle portfolio image upload
    const uploadPortfolioImage = async (e, index) => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            setUploadingImageIndex(index);
            const formData = new FormData();
            formData.append('file', file);

            console.log(`Uploading portfolio image ${index} file:`, file.name);
            const response = await axios.post(`${API_URL}/api/files/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (!response.data || !response.data.fileDownloadUri) {
                throw new Error('Invalid response from server');
            }

            console.log(`Portfolio image ${index} uploaded successfully:`, response.data);
            handleImageChange(index, 'url', response.data.fileDownloadUri);
            showSnackbar('Image uploaded successfully', 'success');
        } catch (error) {
            console.error(`Error uploading portfolio image ${index} file:`, error);
            showSnackbar('Failed to upload image: ' + (error.response?.data || error.message), 'error');
        } finally {
            setUploadingImageIndex(null);
        }
    };

    // Use this function in the mapped portfolio images
    const triggerImageUpload = (index) => {
        try {
            // Ensure ref exists before clicking
            if (!imageInputRefs[index]) {
                console.log(`Image input ref at index ${index} is not available yet`);
                showSnackbar('Please try again in a moment', 'info');
                return;
            }
            
            console.log(`Triggering image upload for index ${index}`);
            imageInputRefs[index].click();
        } catch (error) {
            console.error('Error triggering image upload:', error);
            showSnackbar('Error accessing file input. Please try again.', 'error');
        }
    };

    const filteredPortfolios = portfolios.filter(portfolio => {
        if (filter === 'ALL') return true;
        return portfolio.category && portfolio.category.toUpperCase() === filter;
    });

    // Add a more robust error boundary component
    const ErrorFallback = ({ error, resetErrorBoundary }) => (
        <Box sx={{ p: 3, border: '1px solid #f44336', borderRadius: 1, mb: 2 }}>
            <Typography color="error" variant="h6">Something went wrong:</Typography>
            <Typography color="error" variant="body2">{error.message}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                This might be caused by an issue with adding or managing images. 
                Try clicking the button below to reset and try again.
            </Typography>
            <Button 
                onClick={resetErrorBoundary} 
                variant="outlined" 
                color="primary" 
                sx={{ mt: 2 }}
            >
                Reset and try again
            </Button>
        </Box>
    );

    // Add a more robust error handler
    const handleError = (error, info) => {
        console.error('Error in PortfolioGrid component:', error);
        console.error('Error info:', info);
        
        // Check if it's an infinite loop error
        if (error.message.includes('Maximum update depth exceeded')) {
            console.error('Infinite update loop detected. This is likely due to a state update loop.');
        }
        
        // Show a user-friendly message
        showSnackbar('An error occurred while updating the UI. Please try again.', 'error');
    };

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={handleError}
            onReset={() => {
                // Reset state to recover from errors
                if (dialogMode === 'edit') {
                    handleCloseDialog();
                    setTimeout(() => {
                        // Reopen with a clean state after a brief delay
                        handleOpenDialog(selectedPortfolio, 'edit');
                    }, 100);
                }
            }}
        >
            <Layout>
                <div className="portfolio-container" style={{ padding: '24px', height: '100%', width: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', maxWidth: '1400px', margin: '0 auto' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <Typography variant="h4">Portfolio</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField select size="small" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 150 }}>
                                    <MenuItem value="ALL">All Categories</MenuItem>
                                    <MenuItem value="WEDDING">Wedding</MenuItem>
                                    <MenuItem value="CORPORATE">Corporate</MenuItem>
                                    <MenuItem value="PRODUCT">Product</MenuItem>
                                    <MenuItem value="PORTRAIT">Portrait</MenuItem>
                                </TextField>
                                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog(null, 'edit')}>Add Portfolio</Button>
                            </Box>
                        </Box>

                    {loading && portfolios.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredPortfolios.length > 0 ? (
                                filteredPortfolios.map((portfolio) => (
                                    <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
                                        <Card sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={portfolio.coverImage || 'https://via.placeholder.com/400x200?text=No+Image'}
                                                alt={portfolio.title}
                                                sx={{ objectFit: 'cover' }}
                                            />
                                            <CardContent sx={{ flex: 1 }}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    mb: 2
                                                }}>
                                                    <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                                                        {portfolio.title}
                                                    </Typography>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        gap: 1,
                                                        ml: 2
                                                    }}>
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenDialog(portfolio, 'view')}
                                                        >
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenDialog(portfolio, 'edit')}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleOpenDialog(portfolio, 'delete')}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {portfolio.description}
                                                </Typography>
                                                <Box sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {portfolio.category}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {portfolio.date}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))
                            ) : (
                                <Grid item xs={12}>
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="h6" color="text.secondary">
                                            No portfolios found
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    )}

                    {/* View Dialog */}
                    <Dialog
                        open={dialogMode === 'view'}
                        onClose={handleCloseDialog}
                        maxWidth="md"
                        fullWidth
                    >
                        <DialogTitle>
                            {selectedPortfolio?.title}
                        </DialogTitle>
                        <DialogContent>
                            <Typography variant="body1" paragraph>
                                {selectedPortfolio?.description}
                            </Typography>
                            {selectedPortfolio?.images && selectedPortfolio.images.length > 0 ? (
                                <ImageList cols={3} gap={8}>
                                    {selectedPortfolio.images.map((image, index) => (
                                        <ImageListItem key={index}>
                                            <img
                                                src={image.url || 'https://via.placeholder.com/400x300?text=No+Image'}
                                                alt={image.title || 'Portfolio image'}
                                                loading="lazy"
                                                style={{ height: '200px', objectFit: 'cover' }}
                                            />
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="subtitle2">{image.title}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {image.description}
                                                </Typography>
                                            </Box>
                                        </ImageListItem>
                                    ))}
                                </ImageList>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    No images in this portfolio
                                </Typography>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Close</Button>
                        </DialogActions>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog
                        open={dialogMode === 'edit'}
                        onClose={handleCloseDialog}
                        maxWidth="md"
                        fullWidth
                    >
                        <DialogTitle>
                            {selectedPortfolio ? 'Edit Portfolio' : 'New Portfolio'}
                        </DialogTitle>
                        <DialogContent>
                            {editedPortfolio ? (
                                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="Title"
                                        name="title"
                                        value={editedPortfolio?.title || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        required
                                    />
                                    <TextField
                                        label="Description"
                                        name="description"
                                        value={editedPortfolio?.description || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        multiline
                                        rows={3}
                                    />
                                    
                                    {/* Cover Image Upload */}
                                    <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
                                        <Typography variant="subtitle1" gutterBottom>Cover Image</Typography>
                                        
                                        {editedPortfolio?.coverImage && (
                                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                                                <img 
                                                    src={editedPortfolio.coverImage} 
                                                    alt="Cover Preview"
                                                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                                />
                                            </Box>
                                        )}
                                        
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={uploadCoverImage}
                                        />
                                        
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<CloudUploadIcon />}
                                            onClick={() => fileInputRef.current.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? <CircularProgress size={24} /> : 'Upload Cover Image'}
                                        </Button>
                                    </Box>
                                    
                                    <TextField
                                        select
                                        label="Category"
                                        name="category"
                                        value={editedPortfolio?.category || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                    >
                                        <MenuItem value="">Select a category</MenuItem>
                                        <MenuItem value="Wedding">Wedding</MenuItem>
                                        <MenuItem value="Corporate">Corporate</MenuItem>
                                        <MenuItem value="Product">Product</MenuItem>
                                        <MenuItem value="Portrait">Portrait</MenuItem>
                                    </TextField>
                                    <TextField
                                        label="Date"
                                        name="date"
                                        type="month"
                                        value={editedPortfolio?.date || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <Typography variant="h6" sx={{ mt: 2 }}>
                                        Portfolio Images
                                    </Typography>
                                    {editedPortfolio?.images && editedPortfolio.images.map((image, index) => (
                                        <Box 
                                            key={index} 
                                            sx={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: 2, 
                                                p: 2, 
                                                border: '1px solid #e0e0e0', 
                                                borderRadius: 1 
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="subtitle1">Image {index + 1}</Typography>
                                                <Button 
                                                    color="error" 
                                                    size="small" 
                                                    onClick={() => handleRemoveImage(index)}
                                                >
                                                    Remove
                                                </Button>
                                            </Box>
                                            
                                            {/* Image Upload */}
                                            <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
                                                {image.url && (
                                                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                                                        <img 
                                                            src={image.url} 
                                                            alt="Preview" 
                                                            style={{ 
                                                                maxHeight: '150px', 
                                                                maxWidth: '100%', 
                                                                objectFit: 'contain' 
                                                            }} 
                                                        />
                                                    </Box>
                                                )}
                                                
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    ref={(el) => {
                                                        if (el) {
                                                            // Create a new copy to avoid mutating state directly
                                                            const newRefs = [...imageInputRefs];
                                                            if (newRefs[index] !== el) {
                                                                newRefs[index] = el;
                                                                // Only update if the reference actually changed
                                                                setImageInputRefs(newRefs);
                                                            }
                                                        }
                                                    }}
                                                    onChange={(e) => uploadPortfolioImage(e, index)}
                                                />
                                                
                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                    startIcon={<ImageIcon />}
                                                    onClick={() => triggerImageUpload(index)}
                                                    disabled={uploadingImageIndex === index}
                                                >
                                                    {uploadingImageIndex === index ? 
                                                        <CircularProgress size={24} /> : 
                                                        (image.url ? 'Change Image' : 'Upload Image')
                                                    }
                                                </Button>
                                            </Box>
                                            
                                            <TextField
                                                label="Title"
                                                value={image.title || ''}
                                                onChange={(e) => handleImageChange(index, 'title', e.target.value)}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Description"
                                                value={image.description || ''}
                                                onChange={(e) => handleImageChange(index, 'description', e.target.value)}
                                                fullWidth
                                                multiline
                                                rows={2}
                                            />
                                        </Box>
                                    ))}
                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={handleAddImage}
                                        sx={{ alignSelf: 'flex-start', mt: 1 }}
                                    >
                                        Add Image
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress />
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button 
                                onClick={handleSave} 
                                variant="contained" 
                                color="primary"
                                disabled={loading || !editedPortfolio}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Save'}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <Dialog
                        open={dialogMode === 'delete'}
                        onClose={handleCloseDialog}
                    >
                        <DialogTitle>Delete Portfolio</DialogTitle>
                        <DialogContent>
                            <Typography>
                                Are you sure you want to delete this portfolio? This action cannot be undone.
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button 
                                onClick={handleDelete} 
                                color="error" 
                                variant="contained"
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Delete'}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Snackbar for notifications */}
                    <Snackbar 
                        open={snackbar.open} 
                        autoHideDuration={6000} 
                        onClose={handleCloseSnackbar}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    >
                        <Alert 
                            onClose={handleCloseSnackbar} 
                            severity={snackbar.severity} 
                            variant="filled"
                        >
                            {snackbar.message}
                        </Alert>
                    </Snackbar>
                </Box>
            </div>
        </Layout>
        </ErrorBoundary>
    );
};

export default PortfolioGrid;
