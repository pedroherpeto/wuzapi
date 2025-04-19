import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';

interface Instance {
  id: number;
  name: string;
  token: string;
  connected: boolean;
  loggedIn: boolean;
  qrcode?: string;
}

const Dashboard: React.FC = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Para cada instância, verifica o status
        const instancesWithStatus = await Promise.all(
          response.data.instances.map(async (instance: Instance) => {
            try {
              const statusResponse = await axios.get(`${process.env.REACT_APP_API_URL}/session/status`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'token': instance.token
                }
              });

              return {
                ...instance,
                connected: statusResponse.data.data.Connected,
                loggedIn: statusResponse.data.data.LoggedIn
              };
            } catch (error) {
              return {
                ...instance,
                connected: false,
                loggedIn: false
              };
            }
          })
        );

        setInstances(instancesWithStatus);
      } catch (error) {
        console.error('Erro ao buscar instâncias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstances();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress sx={{ color: '#00a884' }} />
      </Box>
    );
  }

  const totalInstances = instances.length;
  const activeInstances = instances.filter(instance => instance.connected).length;
  const loggedInstances = instances.filter(instance => instance.loggedIn).length;

  return (
    <Box sx={{ bgcolor: '#111b21', minHeight: 'calc(100vh - 64px)', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#e9edef', fontWeight: 400, mb: 3 }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper 
            sx={{ 
              p: 3, 
              bgcolor: '#202c33',
              borderRadius: 2,
              color: '#e9edef',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: '#8696a0', fontSize: '1rem' }}>
              Total de Instâncias
            </Typography>
            <Typography variant="h3" sx={{ color: '#00a884', fontWeight: 400 }}>
              {totalInstances}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper 
            sx={{ 
              p: 3, 
              bgcolor: '#202c33',
              borderRadius: 2,
              color: '#e9edef',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: '#8696a0', fontSize: '1rem' }}>
              Instâncias Ativas
            </Typography>
            <Typography variant="h3" sx={{ color: '#00a884', fontWeight: 400 }}>
              {activeInstances}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper 
            sx={{ 
              p: 3, 
              bgcolor: '#202c33',
              borderRadius: 2,
              color: '#e9edef',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: '#8696a0', fontSize: '1rem' }}>
              Instâncias Logadas
            </Typography>
            <Typography variant="h3" sx={{ color: '#00a884', fontWeight: 400 }}>
              {loggedInstances}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;