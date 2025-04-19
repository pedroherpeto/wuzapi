import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import LogoutIcon from '@mui/icons-material/Logout';
import DescriptionIcon from '@mui/icons-material/Description';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        bgcolor: '#202c33',
        borderBottom: '1px solid',
        borderColor: '#374045',
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          maxWidth: {
            lg: '1200px',
            xl: '1400px'
          }
        }}
      >
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <WhatsAppIcon sx={{ color: '#00a884', fontSize: 32, mr: 1 }} />
            <Typography 
              variant="h6" 
              component={RouterLink} 
              to="/"
              sx={{ 
                color: '#e9edef',
                textDecoration: 'none',
                fontWeight: 500,
                letterSpacing: '0.5px',
              }}
            >
              WuzAPI
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={RouterLink}
              to="/"
              startIcon={<DashboardIcon />}
              sx={{
                color: isActive('/') ? '#00a884' : '#8696a0',
                '&:hover': {
                  color: '#00a884',
                },
                minWidth: '120px',
              }}
            >
              Dashboard
            </Button>
            <Button
              component={RouterLink}
              to="/instances"
              startIcon={<StorageIcon />}
              sx={{
                color: isActive('/instances') ? '#00a884' : '#8696a0',
                '&:hover': {
                  color: '#00a884',
                },
                minWidth: '120px',
              }}
            >
              Instâncias
            </Button>
            <Button
              component={RouterLink}
              to="/docs"
              startIcon={<DescriptionIcon />}
              sx={{
                color: isActive('/docs') ? '#00a884' : '#8696a0',
                '&:hover': {
                  color: '#00a884',
                },
                minWidth: '120px',
              }}
            >
              API Docs
            </Button>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              color: '#8696a0',
              '&:hover': {
                color: '#ea4335',
              },
            }}
          >
            Sair
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 