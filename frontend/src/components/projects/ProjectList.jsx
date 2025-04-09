import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';

const mockProjects = [
  {
    id: 1,
    location: 'New York City',
    cost: '$2,500',
    type: 'Wedding',
    status: 'In Progress',
    startDate: '2024-03-15',
    endDate: '2024-03-16',
    description: 'Wedding photography for John & Sarah Smith',
    client: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567'
  },
  {
    id: 2,
    location: 'Los Angeles',
    cost: '$1,800',
    type: 'Corporate Event',
    status: 'Pending',
    startDate: '2024-03-20',
    endDate: '2024-03-20',
    description: 'Annual corporate meeting photography',
    client: 'Tech Solutions Inc.',
    email: 'events@techsolutions.com',
    phone: '(555) 987-6543'
  },
  {
    id: 3,
    location: 'Chicago',
    cost: '$3,000',
    type: 'Product Photography',
    status: 'Completed',
    startDate: '2024-03-01',
    endDate: '2024-03-02',
    description: 'Product catalog photoshoot',
    client: 'Fashion Brand Co.',
    email: 'marketing@fashionbrand.com',
    phone: '(555) 456-7890'
  },
];

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dialogMode, setDialogMode] = useState(null); // 'view', 'edit', 'delete'
  const [editedProject, setEditedProject] = useState(null);

  useEffect(() => {
    // Simulating API call with mock data
    setProjects(mockProjects);
  }, []);

  const handleOpenDialog = (project, mode) => {
    setSelectedProject(project);
    setDialogMode(mode);
    if (mode === 'edit') {
      setEditedProject({ ...project });
    }
  };

  const handleCloseDialog = () => {
    setSelectedProject(null);
    setDialogMode(null);
    setEditedProject(null);
  };

  const handleSave = () => {
    if (!editedProject) return;

    const updatedProjects = projects.map(project =>
      project.id === editedProject.id ? editedProject : project
    );
    setProjects(updatedProjects);
    handleCloseDialog();
  };

  const handleDelete = () => {
    if (!selectedProject) return;

    const updatedProjects = projects.filter(project => project.id !== selectedProject.id);
    setProjects(updatedProjects);
    handleCloseDialog();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Projects
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => handleOpenDialog({
            id: projects.length + 1,
            location: '',
            cost: '',
            type: '',
            status: 'Pending',
            startDate: '',
            endDate: '',
            description: '',
            client: '',
            email: '',
            phone: ''
          }, 'edit')}
        >
          New Project
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project ID</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.id}</TableCell>
                <TableCell>{project.location}</TableCell>
                <TableCell>{project.cost}</TableCell>
                <TableCell>{project.type}</TableCell>
                <TableCell>
                  <Chip 
                    label={project.status}
                    color={getStatusColor(project.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{project.startDate}</TableCell>
                <TableCell>{project.endDate}</TableCell>
                <TableCell>
                  <Button 
                    size="small" 
                    color="primary" 
                    sx={{ mr: 1 }}
                    onClick={() => handleOpenDialog(project, 'view')}
                  >
                    View
                  </Button>
                  <Button 
                    size="small" 
                    color="secondary" 
                    sx={{ mr: 1 }}
                    onClick={() => handleOpenDialog(project, 'edit')}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => handleOpenDialog(project, 'delete')}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View/Edit Dialog */}
      <Dialog 
        open={dialogMode === 'view' || dialogMode === 'edit'} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'view' ? 'Project Details' : 'Edit Project'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Client Name"
              name="client"
              value={dialogMode === 'edit' ? editedProject?.client : selectedProject?.client}
              onChange={handleInputChange}
              fullWidth
              disabled={dialogMode === 'view'}
            />
            <TextField
              label="Email"
              name="email"
              value={dialogMode === 'edit' ? editedProject?.email : selectedProject?.email}
              onChange={handleInputChange}
              fullWidth
              disabled={dialogMode === 'view'}
            />
            <TextField
              label="Phone"
              name="phone"
              value={dialogMode === 'edit' ? editedProject?.phone : selectedProject?.phone}
              onChange={handleInputChange}
              fullWidth
              disabled={dialogMode === 'view'}
            />
            <TextField
              label="Location"
              name="location"
              value={dialogMode === 'edit' ? editedProject?.location : selectedProject?.location}
              onChange={handleInputChange}
              fullWidth
              disabled={dialogMode === 'view'}
            />
            <TextField
              label="Cost"
              name="cost"
              value={dialogMode === 'edit' ? editedProject?.cost : selectedProject?.cost}
              onChange={handleInputChange}
              fullWidth
              disabled={dialogMode === 'view'}
            />
            <TextField
              select
              label="Type"
              name="type"
              value={dialogMode === 'edit' ? editedProject?.type : selectedProject?.type}
              onChange={handleInputChange}
              fullWidth
              disabled={dialogMode === 'view'}
            >
              <MenuItem value="Wedding">Wedding</MenuItem>
              <MenuItem value="Corporate Event">Corporate Event</MenuItem>
              <MenuItem value="Product Photography">Product Photography</MenuItem>
              <MenuItem value="Portrait">Portrait</MenuItem>
            </TextField>
            <TextField
              select
              label="Status"
              name="status"
              value={dialogMode === 'edit' ? editedProject?.status : selectedProject?.status}
              onChange={handleInputChange}
              fullWidth
              disabled={dialogMode === 'view'}
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </TextField>
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              value={dialogMode === 'edit' ? editedProject?.startDate : selectedProject?.startDate}
              onChange={handleInputChange}
              fullWidth
              disabled={dialogMode === 'view'}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              name="endDate"
              type="date"
              value={dialogMode === 'edit' ? editedProject?.endDate : selectedProject?.endDate}
              onChange={handleInputChange}
              fullWidth
              disabled={dialogMode === 'view'}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Description"
              name="description"
              value={dialogMode === 'edit' ? editedProject?.description : selectedProject?.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={4}
              disabled={dialogMode === 'view'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode === 'edit' && (
            <Button onClick={handleSave} variant="contained" color="primary">
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={dialogMode === 'delete'}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this project? This action cannot be undone.
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
  );
};

export default ProjectList; 