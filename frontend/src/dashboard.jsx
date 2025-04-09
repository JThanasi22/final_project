import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, Grid, Paper, LinearProgress } from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import './dash.css';

const Dashboard = () => {
  const [userEmail, setUserEmail] = useState('User');
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const justSignedUp = localStorage.getItem('justSignedUp') === 'true';

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.name || decoded.sub);
        if (justSignedUp) {
          setGreeting('Welcome');
          localStorage.removeItem('justSignedUp');
        }
      } catch (err) {
        console.error('Invalid token:', err);
      }
    }
  }, []);

  return (
    <Box className="dashboard-container" sx={{ 
      p: 3, 
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box className="content-section" sx={{ width: '100%', flex: 1 }}>
        <Paper elevation={0} sx={{
          background: '#fff',
          borderRadius: '12px',
          p: 3,
          mb: 3,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #4a6fdc',
          width: '100%'
        }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            {greeting}, {userEmail}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Here's what's happening with your projects today.
          </Typography>
        </Paper>

        <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
          <Grid item xs={12} lg={8} sx={{ width: '100%' }}>
            <Paper elevation={0} sx={{
              background: '#fff',
              borderRadius: '12px',
              p: 3,
              height: '100%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              width: '100%'
            }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Project Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                <ProjectStatus 
                  label="Wedding Shoot" 
                  percent={75} 
                  dueDate="Oct 15, 2023"
                  team={["John D.", "Sarah M."]}
                />
                <ProjectStatus 
                  label="Corporate Event" 
                  percent={45} 
                  dueDate="Oct 20, 2023"
                  team={["Mike R.", "Emily J."]}
                />
                <ProjectStatus 
                  label="Product Photoshoot" 
                  percent={90} 
                  dueDate="Oct 12, 2023"
                  team={["Lisa K.", "Tom B."]}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4} sx={{ width: '100%' }}>
            <Paper elevation={0} sx={{
              background: '#fff',
              borderRadius: '12px',
              p: 3,
              height: '100%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              width: '100%'
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3,
                width: '100%'
              }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Today's Schedule
                </Typography>
                <EventIcon color="action" />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                <AppointmentItem 
                  time="10:00 AM" 
                  title="Client Consultation" 
                  with="John Smith"
                  location="Studio A"
                />
                <AppointmentItem 
                  time="2:30 PM" 
                  title="Project Review" 
                  with="Emily Johnson"
                  location="Conference Room"
                />
                <AppointmentItem 
                  time="4:15 PM" 
                  title="Portfolio Review" 
                  with="Creative Team"
                  location="Meeting Room B"
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sx={{ width: '100%' }}>
            <Paper elevation={0} sx={{
              background: '#fff',
              borderRadius: '12px',
              p: 3,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              width: '100%'
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3,
                width: '100%'
              }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Active Projects
                </Typography>
                <Select
                  size="small"
                  defaultValue="all"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </Box>
              <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
                {['Wedding Photography', 'Corporate Headshots', 'Product Launch'].map((project, index) => (
                  <Grid item xs={12} md={4} key={index} sx={{ width: '100%' }}>
                    <ProjectItem 
                      title={project}
                      client={['Rebecca & Tom', 'Tech Solutions Inc.', 'Fashion Brand'][index]}
                      date={['Oct 15, 2023', 'Oct 10, 2023', 'Oct 20, 2023'][index]}
                      status={['In Progress', 'Completed', 'Pending'][index]}
                      statusColor={['#4a6fdc', '#50c878', '#f0ad4e'][index]}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

const ProjectStatus = ({ label, percent, dueDate, team }) => (
  <Box sx={{ width: '100%' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Box>
        <Typography variant="h6" sx={{ mb: 0.5 }}>{label}</Typography>
        <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon fontSize="small" />
            <span>Due {dueDate}</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon fontSize="small" />
            <span>{team.join(', ')}</span>
          </Box>
        </Box>
      </Box>
      <Typography 
        variant="h6" 
        sx={{ 
          color: percent >= 90 ? '#50c878' : percent >= 50 ? '#4a6fdc' : '#f0ad4e'
        }}
      >
        {percent}%
      </Typography>
    </Box>
    <LinearProgress 
      variant="determinate" 
      value={percent} 
      sx={{
        height: 8,
        borderRadius: 4,
        bgcolor: '#f0f0f0',
        '& .MuiLinearProgress-bar': {
          bgcolor: percent >= 90 ? '#50c878' : percent >= 50 ? '#4a6fdc' : '#f0ad4e',
          borderRadius: 4
        }
      }}
    />
  </Box>
);

const AppointmentItem = ({ time, title, with: withWhom, location }) => (
  <Paper elevation={0} sx={{ 
    display: 'flex', 
    gap: 2, 
    p: 2,
    bgcolor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  }}>
    <Box sx={{ 
      minWidth: '80px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderRight: '1px solid #e9ecef',
      pr: 2
    }}>
      <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
        {time.split(' ')[0]}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {time.split(' ')[1]}
      </Typography>
    </Box>
    <Box>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        with {withWhom}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <EventIcon fontSize="small" />
        {location}
      </Typography>
    </Box>
  </Paper>
);

const ProjectItem = ({ title, client, date, status, statusColor }) => (
  <Paper elevation={0} sx={{ 
    p: 2,
    bgcolor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  }}>
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
      <Box sx={{ 
        bgcolor: statusColor,
        color: '#fff',
        px: 1.5,
        py: 0.5,
        borderRadius: '16px',
        fontSize: '0.875rem',
        display: 'inline-block'
      }}>
        {status}
      </Box>
    </Box>
    <Box sx={{ mt: 'auto' }}>
      <Typography variant="body2" color="text.secondary" sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        mb: 0.5
      }}>
        <PersonIcon fontSize="small" />
        Client: {client}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <AccessTimeIcon fontSize="small" />
        Due: {date}
      </Typography>
    </Box>
  </Paper>
);

export default Dashboard;
