import React, { useState, useEffect, useRef } from 'react';
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
            setEditedPortfolio(portfolio ? { ...portfolio } : {
                title: '',
                description: '',
                coverImage: '',
                category: '',
                date: '',
                images: []
            });
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedPortfolio(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (index, field, value) => {
        setEditedPortfolio(prev => ({
            ...prev,
            images: prev.images.map((img, i) => i === index ? { ...img, [field]: value } : img)
        }));
    };

    const handleAddImage = () => {
        setEditedPortfolio(prev => ({
            ...prev,
            images: [...(prev.images || []), { url: '', title: '', description: '' }]
        }));
    };

    const handleRemoveImage = (index) => {
        setEditedPortfolio(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // Handle cover image upload
    const uploadCoverImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${API_URL}/api/files/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setEditedPortfolio(prev => ({
                ...prev,
                coverImage: response.data.fileDownloadUri
            }));

            showSnackbar('Cover image uploaded successfully', 'success');
        } catch (error) {
            console.error('Error uploading file:', error);
            showSnackbar('Failed to upload image: ' + (error.response?.data || error.message), 'error');
        } finally {
            setUploading(false);
        }
    };

    // Handle portfolio image upload
    const uploadPortfolioImage = async (e, index) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploadingImageIndex(index);
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${API_URL}/api/files/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            handleImageChange(index, 'url', response.data.fileDownloadUri);
            showSnackbar('Image uploaded successfully', 'success');
        } catch (error) {
            console.error('Error uploading file:', error);
            showSnackbar('Failed to upload image: ' + (error.response?.data || error.message), 'error');
        } finally {
            setUploadingImageIndex(null);
        }
    };

    // Use this function in the mapped portfolio images
    const triggerImageUpload = (index) => {
        if (imageInputRefs[index]) {
            imageInputRefs[index].click();
        }
    };

    const filteredPortfolios = portfolios.filter(portfolio => {
        if (filter === 'ALL') return true;
        return portfolio.category && portfolio.category.toUpperCase() === filter;
    });

    return (
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
                                                // Update the refs array with this element
                                                const newRefs = [...imageInputRefs];
                                                newRefs[index] = el;
                                                setImageInputRefs(newRefs);
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
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button 
                            onClick={handleSave} 
                            variant="contained" 
                            color="primary"
                            disabled={loading}
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
    );
};

export default PortfolioGrid;
