import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00a884',
      light: '#00bd94',
      dark: '#008f6f',
    },
    secondary: {
      main: '#8696a0',
      light: '#a4b0b7',
      dark: '#697780',
    },
    background: {
      default: '#111b21',
      paper: '#202c33',
    },
    text: {
      primary: '#e9edef',
      secondary: '#8696a0',
    },
    divider: '#374045',
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 400,
      color: '#e9edef',
    },
    h6: {
      fontWeight: 400,
      color: '#e9edef',
    },
    body1: {
      color: '#e9edef',
    },
    body2: {
      color: '#8696a0',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#374045',
            },
            '&:hover fieldset': {
              borderColor: '#00a884',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00a884',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#374045',
        },
        head: {
          fontWeight: 600,
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
); 