import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Instances from './pages/Instances';
import Login from './pages/Login';
import ApiDocs from './pages/ApiDocs';
import Footer from './components/Footer';

const Layout = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ 
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <Navbar />
    <Box sx={{ 
      flex: 1,
      overflow: 'auto',
      pb: '300px' // Espaço para o footer
    }}>
      {children}
    </Box>
    <Box sx={{ 
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)'
    }}>
      <Footer />
    </Box>
  </Box>
);

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
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instances"
        element={
          <ProtectedRoute>
            <Layout>
              <Instances />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/docs"
        element={
          <ProtectedRoute>
            <Layout>
              <ApiDocs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
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