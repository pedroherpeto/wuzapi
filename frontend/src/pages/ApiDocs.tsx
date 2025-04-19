import React from 'react';
import { Box, Typography } from '@mui/material';

const ApiDocs: React.FC = () => {
  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4">Documentação da API</Typography>
      </Box>
      <Box sx={{ 
        width: '100%', 
        height: 'calc(100vh - 200px)', // altura total menos o espaço do header/margins
        border: '1px solid #ddd',
        borderRadius: 1,
        overflow: 'hidden'
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