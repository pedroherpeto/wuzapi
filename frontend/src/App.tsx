import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Instances from './pages/Instances';
import Login from './pages/Login';
import ApiDocs from './pages/ApiDocs';

const AppContent: React.FC = () => {
  const { validateToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const isValid = await validateToken();
        if (isValid) {
          // Se estiver na página de login, redireciona para o dashboard
          if (location.pathname === '/login') {
            navigate('/');
          }
        } else {
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    checkAuth();
  }, [validateToken, navigate, location.pathname]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instances"
            element={
              <ProtectedRoute>
                <Instances />
              </ProtectedRoute>
            }
          />
          <Route path="/api-docs" element={<ApiDocs />} />
        </Routes>
      </Container>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App; 