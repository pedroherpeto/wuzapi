import React from 'react';
import { 
  Box, 
  // Typography 
} from '@mui/material';

const ApiDocs: React.FC = () => {
  return (
    <Box sx={{ bgcolor: '#111b21', minHeight: 'calc(100vh - 64px)', p: 3 }}>
      {/* <Box mb={3}>
        <Typography variant="h4" sx={{ color: '#e9edef', fontWeight: 400 }}>
          Documentação da API
        </Typography>
      </Box> */}
      <Box sx={{ 
        width: '100%', 
        height: 'calc(100vh - 200px)',
        border: '1px solid #202c33',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: '#202c33'
      }}>
        <iframe
          src={`${process.env.REACT_APP_API_URL}/api/#/`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title="API Documentation"
        />
      </Box>
    </Box>
  );
};

export default ApiDocs; 