import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Container,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(token);
      navigate('/');
    } catch (err) {
      setError('Token inválido. Por favor, verifique e tente novamente.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            p: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <WhatsAppIcon sx={{ color: '#fff', fontSize: 32 }} />
          </Box>

          <Typography
            component="h1"
            variant="h5"
            sx={{
              color: 'text.primary',
              fontWeight: 500,
              mb: 1,
            }}
          >
            WuzAPI Manager
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 4,
              textAlign: 'center',
            }}
          >
            Faça login para acessar o dashboard
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                width: '100%',
                mb: 3,
                bgcolor: 'error.dark',
                color: 'error.light',
                '& .MuiAlert-icon': {
                  color: 'error.light',
                },
              }}
            >
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  color: 'text.primary',
                  fontWeight: 500,
                }}
              >
                Token de Acesso
              </Typography>

              <TextField
                required
                fullWidth
                size="medium"
                placeholder="Digite seu token de acesso"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'action.hover',
                  },
                }}
              />

              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 1,
                  color: 'text.secondary',
                }}
              >
                Token usado para autenticar suas requisições à API.
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'primary.main',
                color: '#fff',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                height: 48,
                fontSize: '1rem',
              }}
            >
              Entrar
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 