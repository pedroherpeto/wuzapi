import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogContentText,
  Checkbox,
  ListItemText,
  Menu,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  QrCode as QrCodeIcon,
  PowerSettingsNew as PowerSettingsNewIcon,
  PowerOff as PowerOffIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Instance {
  id: number;
  name: string;
  token: string;
  connected: boolean;
  qrcode?: string;
  loggedIn: boolean;
  webhook: string;
  jid: string;
  events: string[];
  expiration: number;
}

// Adicionar nova interface para mensagem
interface TextMessage {
  Phone: string;
  Body: string;
  Id?: string;
  ContextInfo?: {
    StanzaId?: string;
    Participant?: string;
  };
}

const Instances: React.FC = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [openQrDialog, setOpenQrDialog] = useState(false);
  const [editingInstance, setEditingInstance] = useState<Instance | null>(null);
  const [openSendMessageDialog, setOpenSendMessageDialog] = useState(false);
  const [selectedInstanceForMessage, setSelectedInstanceForMessage] = useState<Instance | null>(null);
  const [messageResponse, setMessageResponse] = useState<any>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendStatus, setSendStatus] = useState<'success' | 'error' | null>(null);
  const [shouldContinueSending, setShouldContinueSending] = useState(true);
  const [message, setMessage] = useState<TextMessage>({
    Phone: '',
    Body: '',
    Id: uuidv4()
  });
  const [newInstance, setNewInstance] = useState({
    name: '',
    token: uuidv4(),
    webhook: '',
    expiration: 0,
    events: ['All'],
  });
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    token: true,
    webhook: true,
    jid: true,
    events: true,
    expiration: true,
  });
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);

  const handleColumnMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setColumnMenuAnchor(event.currentTarget);
  };

  const handleColumnMenuClose = () => {
    setColumnMenuAnchor(null);
  };

  const handleColumnToggle = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev]
    }));
  };

  const fetchInstances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Para cada instância, verifica o status
      const instancesWithStatus = await Promise.all(
        response.data.instances.map(async (instance: any) => {
          try {
            const statusResponse = await axios.get(`${process.env.REACT_APP_API_URL}/session/status`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'token': instance.token
              }
            });

            console.log('Resposta do status:', statusResponse.data);

            return {
              ...instance,
              connected: statusResponse.data.data.Connected,
              loggedIn: statusResponse.data.data.LoggedIn,
              events: Array.isArray(instance.events) ? instance.events : [instance.events]
            };
          } catch (error) {
            return {
              ...instance,
              connected: false,
              loggedIn: false,
              events: Array.isArray(instance.events) ? instance.events : [instance.events]
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

  useEffect(() => {
    fetchInstances();
  }, []);

  const handleConnect = async (instance: Instance) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/session/connect`, {}, {
        headers: { 
          'token': instance.token,
          'Authorization': `Bearer ${token}`
        }
      });
      fetchInstances();
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
    }
  };

  const handleDisconnect = async (instance: Instance) => {
    try {
      const token = localStorage.getItem('token');
      
      // Tenta desconectar
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/session/disconnect`, null, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'token': instance.token
          }
        });
      } catch (error) {
        // Se o erro for "Cannot disconnect because it is not logged in",
        // significa que a instância já está desconectada
        if (axios.isAxiosError(error) && 
            error.response?.data?.error === "Cannot disconnect because it is not logged in") {
          console.log('Instância já está desconectada');
          // Atualiza o estado da instância para desconectada
          setInstances(instances.map(i => 
            i.id === instance.id ? { ...i, connected: false } : i
          ));
          return;
        } else {
          throw error;
        }
      }

      // Atualiza a lista de instâncias para refletir o estado atual
      fetchInstances();
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        console.log('Mensagem de erro do servidor:', error.response.data.error);
      }
    }
  };

  const handleLogout = async (instance: Instance) => {
    try {
      if (!instance.connected) {
        console.log('Instância já está desconectada');
        return;
      }

      const token = localStorage.getItem('token');
      
      // Tenta conectar a instância primeiro
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/session/connect`, {
          Subscribe: ["All"],
          Immediate: true
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'token': instance.token
          }
        });
      } catch (error) {
        // Ignora erros de conexão, pois a instância pode já estar conectada
        console.log('Ignorando erro de conexão:', error);
      }

      // Aguarda um pouco para a conexão ser estabelecida
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Tenta fazer logout
      await axios.post(`${process.env.REACT_APP_API_URL}/session/logout`, null, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'token': instance.token
        }
      });

      // Atualiza a lista de instâncias
      fetchInstances();
    } catch (error) {
      console.error('Erro ao fazer logout da instância:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        console.log('Mensagem de erro do servidor:', error.response.data.error);
      }
    }
  };

  const handleGetQR = async (instance: Instance) => {
    try {
      const token = localStorage.getItem('token');
      
      // Verifica o status da instância
      const statusResponse = await axios.get(`${process.env.REACT_APP_API_URL}/session/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'token': instance.token
        }
      });

      // Se não estiver conectado, tenta conectar
      if (!statusResponse.data.data.Connected) {
        await axios.post(`${process.env.REACT_APP_API_URL}/session/connect`, {
          Subscribe: ["All"],
          Immediate: true
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'token': instance.token
          }
        });

        // Aguarda um pouco para a conexão ser estabelecida
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Tenta obter o QR code
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/session/qr`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'token': instance.token
        }
      });
      
      console.log('Resposta completa do QR code:', response);
      console.log('Dados do QR code:', response.data);
      
      if (response.data && response.data.data && response.data.data.QRCode) {
        const qrCodeBase64 = response.data.data.QRCode;
        console.log('QR code base64:', qrCodeBase64);
        setSelectedInstance({ ...instance, qrcode: qrCodeBase64 });
        setOpenQrDialog(true);
      } else {
        console.error('Estrutura da resposta inesperada:', response.data);
      }
    } catch (error) {
      console.error('Erro ao obter QR code:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedInstance) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/admin/users/${selectedInstance.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await handleDisconnect(selectedInstance);
      await handleLogout(selectedInstance);
      setInstances(instances.filter(instance => instance.id !== selectedInstance.id));
      setOpenDeleteDialog(false);
      setSelectedInstance(null);
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
    }
  };

  const handleCreateInstance = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/admin/users`, {
        ...newInstance,
        events: newInstance.events.join(',')
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setOpenModal(false);
      setNewInstance({ 
        name: '', 
        token: uuidv4(),
        webhook: '', 
        expiration: 0, 
        events: ['All'] 
      });
      fetchInstances();
    } catch (error) {
      console.error('Erro ao criar instância:', error);
    }
  };

  const handleEdit = async () => {
    if (!editingInstance) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.REACT_APP_API_URL}/admin/users/${editingInstance.id}`, {
        ...editingInstance,
        events: editingInstance.events.join(',')
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setOpenEditDialog(false);
      setEditingInstance(null);
      fetchInstances();
    } catch (error) {
      console.error('Erro ao atualizar instância:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('Detalhes do erro:', error.response.data);
      }
    }
  };

  const handleEventsChange = (value: string | string[]) => {
    if (Array.isArray(value)) {
      // Se "All" estiver na seleção, mantém apenas "All"
      if (value.includes('All')) {
        return ['All'];
      }
      return value;
    } else {
      // Se for uma string única (caso do Select não múltiplo)
      return [value];
    }
  };

  // Modificar a função handleSendMessage
  const handleSendMessage = async () => {
    if (!selectedInstanceForMessage || !shouldContinueSending) return;
    
    setSendingMessage(true);
    setSendStatus(null);
    setShouldContinueSending(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/chat/send/text`,
        message,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'token': selectedInstanceForMessage.token
          }
        }
      );
      
      // Verifica se devemos continuar processando a resposta
      if (shouldContinueSending) {
        setMessageResponse(response.data);
        setSendStatus('success');
      }
    } catch (error) {
      // Só processa o erro se ainda devemos continuar
      if (shouldContinueSending) {
        console.error('Erro ao enviar mensagem:', error);
        if (axios.isAxiosError(error) && error.response) {
          setMessageResponse(error.response.data);
        } else {
          setMessageResponse({ error: 'Erro ao enviar mensagem' });
        }
        setSendStatus('error');
      }
    } finally {
      if (shouldContinueSending) {
        setSendingMessage(false);
      }
    }
  };

  // Função para limpar todos os estados do modal
  const handleCloseMessageDialog = () => {
    setShouldContinueSending(false);
    setSendingMessage(false);
    setOpenSendMessageDialog(false);
    setMessageResponse(null);
    setMessage({
      Phone: '',
      Body: '',
      Id: uuidv4()
    });
    setSendStatus(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress sx={{ color: '#00a884' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: '#111b21', 
      minHeight: '100%',
      p: 3,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#e9edef', fontWeight: 400 }}>
          Instâncias
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
            sx={{
              bgcolor: '#00a884',
              '&:hover': {
                bgcolor: '#00a884',
                filter: 'brightness(1.1)'
              },
              textTransform: 'none',
              mr: 1
            }}
          >
            Nova Instância
          </Button>
          <Button
            variant="contained"
            onClick={handleColumnMenuClick}
            sx={{
              bgcolor: '#202c33',
              '&:hover': {
                bgcolor: '#202c33',
                filter: 'brightness(1.1)'
              },
              textTransform: 'none',
              color: '#e9edef'
            }}
          >
            Colunas
          </Button>
        </Box>
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          bgcolor: '#202c33',
          borderRadius: 2,
          flex: 1,
          mb: 3,
          '& .MuiTableCell-root': {
            borderColor: 'rgba(55, 64, 69, 0.5)',
            py: 2.5,
            px: 2,
            fontSize: '0.925rem'
          },
          '& .MuiTableRow-root': {
            transition: 'background-color 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(134, 150, 160, 0.05)'
            }
          },
          '& .MuiTableHead-root .MuiTableRow-root': {
            '&:hover': {
              bgcolor: 'transparent'
            }
          },
          '& .MuiTableCell-head': {
            fontWeight: 500,
            bgcolor: '#202c33',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            borderBottom: '2px solid rgba(55, 64, 69, 0.8)',
            '&:first-of-type': {
              borderTopLeftRadius: 16
            },
            '&:last-of-type': {
              borderTopRightRadius: 16
            }
          },
          '&::-webkit-scrollbar': {
            width: '10px',
            height: '10px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#111b21'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#374045',
            borderRadius: '5px',
            '&:hover': {
              backgroundColor: '#8696a0'
            }
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#8696a0', width: '15%' }}>Nome</TableCell>
              <TableCell sx={{ color: '#8696a0', width: '15%' }}>Status</TableCell>
              {visibleColumns.id && <TableCell sx={{ color: '#8696a0', width: '8%' }}>ID</TableCell>}
              {visibleColumns.token && (
                <TableCell sx={{ color: '#8696a0', width: '20%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Token
                    <Typography variant="caption" sx={{ ml: 1, color: 'rgba(134, 150, 160, 0.7)' }}>
                      (clique para copiar)
                    </Typography>
                  </Box>
                </TableCell>
              )}
              {visibleColumns.webhook && <TableCell sx={{ color: '#8696a0', width: '20%' }}>Webhook</TableCell>}
              {visibleColumns.jid && <TableCell sx={{ color: '#8696a0', width: '20%' }}>JID</TableCell>}
              {visibleColumns.events && <TableCell sx={{ color: '#8696a0', width: '10%' }}>Eventos</TableCell>}
              {visibleColumns.expiration && <TableCell sx={{ color: '#8696a0', width: '12%' }}>Expiração</TableCell>}
              <TableCell sx={{ color: '#8696a0', width: '15%' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instances.map((instance) => (
              <TableRow key={instance.id}>
                <TableCell sx={{ 
                  color: '#e9edef',
                  fontWeight: 500
                }}>
                  {instance.name}
                </TableCell>
                <TableCell>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 1
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: instance.connected ? 'rgba(0, 168, 132, 0.1)' : 'rgba(234, 67, 53, 0.1)',
                      borderRadius: '8px',
                      py: 0.75,
                      px: 1.5,
                      width: 'fit-content'
                    }}>
                      <Box sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: instance.connected ? '#00a884' : '#ea4335',
                        mr: 1,
                        boxShadow: instance.connected ? '0 0 0 2px rgba(0, 168, 132, 0.2)' : '0 0 0 2px rgba(234, 67, 53, 0.2)'
                      }} />
                      <Typography sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: instance.connected ? '#00a884' : '#ea4335',
                        letterSpacing: '0.01em'
                      }}>
                        {instance.connected ? 'Conectado' : 'Desconectado'}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: instance.loggedIn ? 'rgba(0, 168, 132, 0.1)' : 'rgba(245, 124, 0, 0.1)',
                      borderRadius: '8px',
                      py: 0.75,
                      px: 1.5,
                      width: 'fit-content'
                    }}>
                      <Box sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: instance.loggedIn ? '#00a884' : '#f57c00',
                        mr: 1,
                        boxShadow: instance.loggedIn ? '0 0 0 2px rgba(0, 168, 132, 0.2)' : '0 0 0 2px rgba(245, 124, 0, 0.2)'
                      }} />
                      <Typography sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: instance.loggedIn ? '#00a884' : '#f57c00',
                        letterSpacing: '0.01em'
                      }}>
                        {instance.loggedIn ? 'Autenticado' : 'Ler QRCode'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                {visibleColumns.id && (
                  <TableCell sx={{ 
                    color: '#e9edef',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }}>
                    {instance.id}
                  </TableCell>
                )}
                {visibleColumns.token && (
                  <TableCell 
                    onClick={() => navigator.clipboard.writeText(instance.token)}
                    sx={{ 
                      color: '#e9edef',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(134, 150, 160, 0.1)',
                      }
                    }}
                  >
                    <Tooltip title="Copiar token" placement="top">
                      <Box sx={{ 
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {instance.token}
                      </Box>
                    </Tooltip>
                  </TableCell>
                )}
                {visibleColumns.webhook && (
                  <TableCell>
                    <Box sx={{ 
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#e9edef',
                      fontSize: '0.875rem'
                    }}>
                      {instance.webhook}
                    </Box>
                  </TableCell>
                )}
                {visibleColumns.jid && (
                  <TableCell>
                    <Box sx={{ 
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#e9edef',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}>
                      {instance.jid}
                    </Box>
                  </TableCell>
                )}
                {visibleColumns.events && (
                  <TableCell>
                    <Box sx={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5
                    }}>
                      {instance.events?.map((event) => (
                        <Box
                          key={event}
                          sx={{
                            bgcolor: 'rgba(134, 150, 160, 0.1)',
                            color: '#e9edef',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        >
                          {event}
                        </Box>
                      ))}
                    </Box>
                  </TableCell>
                )}
                {visibleColumns.expiration && (
                  <TableCell sx={{ 
                    color: instance.expiration ? '#e9edef' : '#8696a0',
                    fontWeight: instance.expiration ? 500 : 400
                  }}>
                    {instance.expiration ? `${instance.expiration} dias` : 'Sem expiração'}
                  </TableCell>
                )}
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {instance.connected ? (
                      <>
                        <Tooltip title="Desconectar">
                          <IconButton 
                            onClick={() => handleDisconnect(instance)}
                            sx={{ color: '#8696a0', '&:hover': { color: '#e9edef' } }}
                          >
                            <PowerOffIcon />
                          </IconButton>
                        </Tooltip>
                        {!instance.loggedIn && (
                          <Tooltip title="Obter QR Code">
                            <IconButton 
                              onClick={() => handleGetQR(instance)}
                              sx={{ color: '#8696a0', '&:hover': { color: '#e9edef' } }}
                            >
                              <QrCodeIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {instance.loggedIn && (
                          <Tooltip title="Logout">
                            <IconButton 
                              onClick={() => handleLogout(instance)}
                              sx={{ color: '#8696a0', '&:hover': { color: '#e9edef' } }}
                            >
                              <LogoutIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      <Tooltip title="Conectar">
                        <IconButton 
                          onClick={() => handleConnect(instance)}
                          sx={{ color: '#8696a0', '&:hover': { color: '#e9edef' } }}
                        >
                          <PowerSettingsNewIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Editar">
                      <IconButton 
                        onClick={() => {
                          setEditingInstance(instance);
                          setOpenEditDialog(true);
                        }}
                        sx={{ color: '#8696a0', '&:hover': { color: '#e9edef' } }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton 
                        onClick={() => {
                          setSelectedInstance(instance);
                          setOpenDeleteDialog(true);
                        }}
                        sx={{ color: '#8696a0', '&:hover': { color: '#e9edef' } }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Atualizar">
                      <IconButton 
                        onClick={() => fetchInstances()}
                        sx={{ color: '#8696a0', '&:hover': { color: '#e9edef' } }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    {instance.connected && instance.loggedIn && (
                      <Tooltip title="Enviar Mensagem">
                        <IconButton 
                          onClick={() => {
                            setSelectedInstanceForMessage(instance);
                            setOpenSendMessageDialog(true);
                          }}
                          sx={{ color: '#8696a0', '&:hover': { color: '#e9edef' } }}
                        >
                          <WhatsAppIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={handleColumnMenuClose}
        PaperProps={{
          sx: {
            bgcolor: '#202c33',
            color: '#e9edef',
            '& .MuiMenuItem-root': {
              '&:hover': {
                bgcolor: '#374045'
              }
            }
          }
        }}
      >
        {Object.entries(visibleColumns).map(([column, visible]) => (
          <MenuItem 
            key={column}
            onClick={() => handleColumnToggle(column)}
            sx={{ color: '#e9edef' }}
          >
            <Checkbox 
              checked={visible} 
              sx={{ 
                color: '#8696a0',
                '&.Mui-checked': {
                  color: '#00a884'
                }
              }}
            />
            <ListItemText primary={column} />
          </MenuItem>
        ))}
      </Menu>

      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        PaperProps={{
          sx: {
            bgcolor: '#202c33',
            color: '#e9edef',
            '& .MuiDialogTitle-root': {
              color: '#e9edef'
            }
          }
        }}
      >
        <DialogTitle>Nova Instância</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            fullWidth
            value={newInstance.name}
            onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#e9edef',
                '& fieldset': {
                  borderColor: '#374045'
                },
                '&:hover fieldset': {
                  borderColor: '#00a884'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00a884'
                }
              },
              '& .MuiInputLabel-root': {
                color: '#8696a0'
              }
            }}
          />
          <TextField
            margin="dense"
            label="Token"
            fullWidth
            value={newInstance.token}
            onChange={(e) => setNewInstance({ ...newInstance, token: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Webhook"
            fullWidth
            value={newInstance.webhook}
            onChange={(e) => setNewInstance({ ...newInstance, webhook: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Expiração (em segundos)"
            type="number"
            fullWidth
            value={newInstance.expiration}
            onChange={(e) => setNewInstance({ ...newInstance, expiration: parseInt(e.target.value) })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Eventos</InputLabel>
            <Select
              multiple
              value={newInstance.events}
              label="Eventos"
              onChange={(e) => setNewInstance({ ...newInstance, events: handleEventsChange(e.target.value) })}
              renderValue={(selected) => (selected as string[]).join(', ')}
            >
              <MenuItem value="All">Todos</MenuItem>
              <MenuItem value="Message">Mensagem</MenuItem>
              <MenuItem value="ReadReceipt">Confirmação de Leitura</MenuItem>
              <MenuItem value="Presence">Presença</MenuItem>
              <MenuItem value="HistorySync">Sincronização de Histórico</MenuItem>
              <MenuItem value="ChatPresence">Presença no Chat</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenModal(false)}
            sx={{ 
              color: '#8696a0',
              '&:hover': {
                color: '#e9edef'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateInstance}
            sx={{
              bgcolor: '#00a884',
              color: '#fff',
              '&:hover': {
                bgcolor: '#00a884',
                filter: 'brightness(1.1)'
              }
            }}
          >
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir a instância {selectedInstance?.name}? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openQrDialog} onClose={() => setOpenQrDialog(false)}>
        <DialogTitle>QR Code - {selectedInstance?.name}</DialogTitle>
        <DialogContent>
          {selectedInstance?.qrcode && (
            <Box display="flex" justifyContent="center" p={2}>
              <img
                src={selectedInstance.qrcode}
                alt="QR Code"
                style={{ maxWidth: '300px', height: 'auto' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQrDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openSendMessageDialog} 
        onClose={handleCloseMessageDialog}
        maxWidth="sm"
        fullWidth
        TransitionProps={{
          onEnter: () => {
            setShouldContinueSending(true);
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: '#00a884',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <WhatsAppIcon sx={{ color: '#fff', fontSize: 32 }} />
            </Box>

            <Typography
              variant="h5"
              sx={{
                color: '#e9edef',
                fontWeight: 500,
                mb: 1,
              }}
            >
              Enviar Mensagem
            </Typography>

            {selectedInstanceForMessage && (
              <Typography
                variant="body2"
                sx={{
                  color: '#8696a0',
                  textAlign: 'center',
                }}
              >
                {selectedInstanceForMessage.name}
              </Typography>
            )}
          </Box>

          <Box
            component="form"
            sx={{
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
                  color: '#e9edef',
                  fontWeight: 500,
                }}
              >
                Número do Telefone
              </Typography>
              <TextField
                fullWidth
                placeholder="Ex: 5511999999999"
                value={message.Phone}
                onChange={(e) => setMessage({ ...message, Phone: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#2a3942',
                    color: '#e9edef',
                    '& fieldset': {
                      borderColor: '#374045'
                    },
                    '&:hover fieldset': {
                      borderColor: '#00a884'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00a884'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#8696a0'
                  }
                }}
              />
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  color: '#e9edef',
                  fontWeight: 500,
                }}
              >
                Mensagem
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={message.Body}
                onChange={(e) => setMessage({ ...message, Body: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#2a3942',
                    color: '#e9edef',
                    '& fieldset': {
                      borderColor: '#374045'
                    },
                    '&:hover fieldset': {
                      borderColor: '#00a884'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00a884'
                    }
                  }
                }}
              />
            </Box>

            {messageResponse && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  mb: 1 
                }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: '#e9edef',
                      fontWeight: 500,
                    }}
                  >
                    Resposta do Servidor
                  </Typography>
                  {sendStatus && (
                    <Box
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: sendStatus === 'success' ? 'rgba(0, 168, 132, 0.1)' : 'rgba(234, 67, 53, 0.1)',
                        color: sendStatus === 'success' ? '#00a884' : '#ea4335',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {sendStatus === 'success' ? 'Envio concluído' : 'Erro no envio'}
                    </Box>
                  )}
                </Box>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: '#111b21',
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: '200px',
                    '& pre': {
                      margin: 0,
                      color: '#e9edef',
                      fontFamily: 'monospace',
                    },
                    // Estilização da scrollbar
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#202c33',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#374045',
                      borderRadius: '4px',
                      '&:hover': {
                        background: '#8696a0'
                      }
                    },
                  }}
                >
                  <pre>
                    {JSON.stringify(messageResponse, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}

            {sendingMessage && (
              <Box sx={{ 
                width: '100%', 
                height: 4,
                bgcolor: '#202c33',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '30%',
                  height: '100%',
                  bgcolor: '#00a884',
                  animation: 'loading 1s infinite ease-in-out',
                  borderRadius: 2,
                },
                '@keyframes loading': {
                  '0%': {
                    transform: 'translateX(-100%)',
                  },
                  '100%': {
                    transform: 'translateX(400%)',
                  },
                },
              }} />
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 4 }}>
              <Button
                onClick={handleCloseMessageDialog}
                sx={{
                  color: '#8696a0',
                  '&:hover': {
                    color: '#e9edef',
                  },
                }}
              >
                Fechar
              </Button>
              <Button
                onClick={handleSendMessage}
                variant="contained"
                disabled={!message.Phone || !message.Body || sendingMessage}
                sx={{
                  bgcolor: sendStatus === 'success' ? '#00a884' : 
                          sendStatus === 'error' ? '#ea4335' : 
                          '#00a884',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: sendStatus === 'success' ? '#00a884' : 
                             sendStatus === 'error' ? '#ea4335' : 
                             '#00a884',
                    filter: 'brightness(1.1)'
                  },
                }}
              >
                {sendingMessage ? 'Enviando...' : 'Enviar'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>

      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: '#202c33', 
          color: '#e9edef',
          borderBottom: '1px solid #374045'
        }}>
          Editar Instância
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#202c33', pt: 2 }}>
          {editingInstance && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Nome"
                fullWidth
                value={editingInstance.name}
                onChange={(e) => setEditingInstance({ ...editingInstance, name: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#2a3942',
                    color: '#e9edef',
                    '& fieldset': { borderColor: '#374045' },
                    '&:hover fieldset': { borderColor: '#00a884' },
                    '&.Mui-focused fieldset': { borderColor: '#00a884' }
                  },
                  '& .MuiInputLabel-root': { color: '#8696a0' }
                }}
              />
              <TextField
                label="Token"
                fullWidth
                value={editingInstance.token}
                onChange={(e) => setEditingInstance({ ...editingInstance, token: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#2a3942',
                    color: '#e9edef',
                    '& fieldset': { borderColor: '#374045' },
                    '&:hover fieldset': { borderColor: '#00a884' },
                    '&.Mui-focused fieldset': { borderColor: '#00a884' }
                  },
                  '& .MuiInputLabel-root': { color: '#8696a0' }
                }}
              />
              <TextField
                label="Webhook"
                fullWidth
                value={editingInstance.webhook}
                onChange={(e) => setEditingInstance({ ...editingInstance, webhook: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#2a3942',
                    color: '#e9edef',
                    '& fieldset': { borderColor: '#374045' },
                    '&:hover fieldset': { borderColor: '#00a884' },
                    '&.Mui-focused fieldset': { borderColor: '#00a884' }
                  },
                  '& .MuiInputLabel-root': { color: '#8696a0' }
                }}
              />
              <TextField
                label="Expiração (em segundos)"
                type="number"
                fullWidth
                value={editingInstance.expiration}
                onChange={(e) => setEditingInstance({ ...editingInstance, expiration: parseInt(e.target.value) })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#2a3942',
                    color: '#e9edef',
                    '& fieldset': { borderColor: '#374045' },
                    '&:hover fieldset': { borderColor: '#00a884' },
                    '&.Mui-focused fieldset': { borderColor: '#00a884' }
                  },
                  '& .MuiInputLabel-root': { color: '#8696a0' }
                }}
              />
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#8696a0' }}>Eventos</InputLabel>
                <Select
                  multiple
                  value={editingInstance.events}
                  label="Eventos"
                  onChange={(e) => setEditingInstance({ ...editingInstance, events: handleEventsChange(e.target.value) })}
                  renderValue={(selected) => (selected as string[]).join(', ')}
                  sx={{
                    bgcolor: '#2a3942',
                    color: '#e9edef',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374045' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00a884' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00a884' }
                  }}
                >
                  <MenuItem value="All">Todos</MenuItem>
                  <MenuItem value="Message">Mensagem</MenuItem>
                  <MenuItem value="ReadReceipt">Confirmação de Leitura</MenuItem>
                  <MenuItem value="Presence">Presença</MenuItem>
                  <MenuItem value="HistorySync">Sincronização de Histórico</MenuItem>
                  <MenuItem value="ChatPresence">Presença no Chat</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#202c33', borderTop: '1px solid #374045', p: 2 }}>
          <Button 
            onClick={() => setOpenEditDialog(false)}
            sx={{ 
              color: '#8696a0',
              '&:hover': { color: '#e9edef' }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEdit} 
            variant="contained"
            sx={{
              bgcolor: '#00a884',
              color: '#fff',
              '&:hover': {
                bgcolor: '#00a884',
                filter: 'brightness(1.1)'
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Instances; 