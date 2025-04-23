import React, { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import TopNavbar from '../layout/TopNavbar';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

const mockPortfolios = [
    {
        id: 1,
        title: 'Wedding Collection',
        description: 'Beautiful moments captured at various wedding ceremonies',
        coverImage: 'https://source.unsplash.com/800x600/?wedding',
        category: 'Wedding',
        date: '2024-03',
        images: [
            { url: 'https://source.unsplash.com/800x600/?wedding,ceremony', title: 'Ceremony', description: 'Wedding ceremony at sunset' },
            { url: 'https://source.unsplash.com/800x600/?wedding,couple', title: 'Couple', description: 'Newlyweds portrait' },
            { url: 'https://source.unsplash.com/800x600/?wedding,reception', title: 'Reception', description: 'Evening reception' },
        ]
    },
    {
        id: 2,
        title: 'Corporate Events',
        description: 'Professional photography for business events and conferences',
        coverImage: 'https://source.unsplash.com/800x600/?conference',
        category: 'Corporate',
        date: '2024-02',
        images: [
            { url: 'https://source.unsplash.com/800x600/?business,meeting', title: 'Meeting', description: 'Annual board meeting' },
            { url: 'https://source.unsplash.com/800x600/?conference,speaker', title: 'Speaker', description: 'Keynote presentation' },
            { url: 'https://source.unsplash.com/800x600/?business,networking', title: 'Networking', description: 'Networking session' },
        ]
    },
    {
        id: 3,
        title: 'Product Photography',
        description: 'High-quality product shots for e-commerce and marketing',
        coverImage: 'https://source.unsplash.com/800x600/?product',
        category: 'Product',
        date: '2024-01',
        images: [
            { url: 'https://source.unsplash.com/800x600/?product,jewelry', title: 'Jewelry', description: 'Luxury jewelry collection' },
            { url: 'https://source.unsplash.com/800x600/?product,cosmetics', title: 'Cosmetics', description: 'Beauty product line' },
            { url: 'https://source.unsplash.com/800x600/?product,fashion', title: 'Fashion', description: 'Fashion accessories' },
        ]
    }
];

const PortfolioGrid = () => {
    const [portfolios, setPortfolios] = useState([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState(null);
    const [dialogMode, setDialogMode] = useState(null);
    const [editedPortfolio, setEditedPortfolio] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const isActiveRoute = (path) => window.location.pathname === path;

    useEffect(() => {
        setPortfolios(mockPortfolios);
    }, []);

    const handleOpenDialog = (portfolio, mode) => {
        setSelectedPortfolio(portfolio);
        setDialogMode(mode);
        if (mode === 'edit') {
            setEditedPortfolio(portfolio ? { ...portfolio } : {
                id: portfolios.length + 1,
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

    const handleSave = () => {
        if (!editedPortfolio) return;
        if (selectedPortfolio) {
            setPortfolios(portfolios.map(p => p.id === editedPortfolio.id ? editedPortfolio : p));
        } else {
            setPortfolios([...portfolios, editedPortfolio]);
        }
        handleCloseDialog();
    };

    const handleDelete = () => {
        if (!selectedPortfolio) return;
        setPortfolios(portfolios.filter(p => p.id !== selectedPortfolio.id));
        handleCloseDialog();
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
            images: [...prev.images, { url: '', title: '', description: '' }]
        }));
    };

    const handleRemoveImage = (index) => {
        setEditedPortfolio(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const filteredPortfolios = portfolios.filter(p => filter === 'ALL' || p.category.toUpperCase() === filter);

    return (
        <div className="dashboard-container">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} isActiveRoute={isActiveRoute} />
            <div className="main-content">
                <TopNavbar toggleSidebar={toggleSidebar} handleLogout={() => localStorage.clear()} />
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

                        <Grid container spacing={3}>
                            {filteredPortfolios.map((portfolio) => (
                                <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                        <CardMedia component="img" height="200" image={portfolio.coverImage} alt={portfolio.title} sx={{ objectFit: 'cover' }} />
                                        <CardContent sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Typography variant="h6" component="div" sx={{ flex: 1 }}>{portfolio.title}</Typography>
                                                <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(portfolio, 'view')}><VisibilityIcon /></IconButton>
                                                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(portfolio, 'edit')}><EditIcon /></IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleOpenDialog(portfolio, 'delete')}><DeleteIcon /></IconButton>
                                                </Box>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{portfolio.description}</Typography>
                                            <Box sx={{ mt: 'auto' }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Category: {portfolio.category}</Typography>
                                                <Typography variant="body2" color="text.secondary">Date: {portfolio.date}</Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

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
                                <ImageList cols={3} gap={8}>
                                    {selectedPortfolio?.images.map((image, index) => (
                                        <ImageListItem key={index}>
                                            <img
                                                src={image.url}
                                                alt={image.title}
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
                                    <TextField
                                        label="Cover Image URL"
                                        name="coverImage"
                                        value={editedPortfolio?.coverImage || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                    />
                                    <TextField
                                        select
                                        label="Category"
                                        name="category"
                                        value={editedPortfolio?.category || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                    >
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

                                    <Typography variant="h6" sx={{ mt: 2 }}>Images</Typography>
                                    {editedPortfolio?.images?.map((image, index) => (
                                        <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                            <TextField
                                                label="Image URL"
                                                value={image.url}
                                                onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Title"
                                                value={image.title}
                                                onChange={(e) => handleImageChange(index, 'title', e.target.value)}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Description"
                                                value={image.description}
                                                onChange={(e) => handleImageChange(index, 'description', e.target.value)}
                                                fullWidth
                                            />
                                            <IconButton
                                                color="error"
                                                onClick={() => handleRemoveImage(index)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    ))}
                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={handleAddImage}
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Add Image
                                    </Button>
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseDialog}>Cancel</Button>
                                <Button onClick={handleSave} variant="contained" color="primary">
                                    Save
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
                                <Button onClick={handleDelete} color="error" variant="contained">
                                    Delete
                                </Button>
                            </DialogActions>
                        </Dialog>

                    </Box>
                </div>
            </div>
        </div>
    );
};

export default PortfolioGrid;
