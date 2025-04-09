import React from 'react';
import { Box } from '@mui/material';

const PageContainer = ({ children }) => {
  return (
    <Box sx={{ 
      p: 3, 
      height: '100%',
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }}>
      {children}
    </Box>
  );
};

export default PageContainer; 