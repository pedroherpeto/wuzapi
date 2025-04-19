import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configuração da URL base do axios
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5555';
console.log('API URL:', API_URL);
axios.defaults.baseURL = API_URL;

interface AuthContextType {
  isAuthenticated: boolean;
  validateToken: () => Promise<boolean>;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const validateToken = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Token não encontrado no localStorage');
        setIsAuthenticated(false);
        return false;
      }

      console.log('Validando token...');
      const response = await axios.get('/api/validate-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Resposta da validação:', response.data);
      if (response.data.valid) {
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      setIsAuthenticated(false);
      return false;
    }
  };

  const login = async (token: string) => {
    try {
      console.log('Iniciando login...');
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const isValid = await validateToken();
      if (!isValid) {
        throw new Error('Token inválido');
      }
      console.log('Login realizado com sucesso');
    } catch (error) {
      console.error('Erro no login:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      throw error;
    }
  };

  const logout = () => {
    console.log('Realizando logout...');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  useEffect(() => {
    console.log('Verificando autenticação inicial...');
    validateToken();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, validateToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 