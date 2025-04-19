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

const Instances: React.FC = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [openQrDialog, setOpenQrDialog] = useState(false);
  const [editingInstance, setEditingInstance] = useState<Instance | null>(null);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Instâncias</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            onClick={handleColumnMenuClick}
            startIcon={<EditIcon />}
          >
            Colunas
          </Button>
          <Menu
            anchorEl={columnMenuAnchor}
            open={Boolean(columnMenuAnchor)}
            onClose={handleColumnMenuClose}
          >
            {Object.entries(visibleColumns).map(([column, visible]) => (
              <MenuItem key={column} onClick={() => handleColumnToggle(column)}>
                <Checkbox checked={visible} />
                <ListItemText primary={column.charAt(0).toUpperCase() + column.slice(1)} />
              </MenuItem>
            ))}
          </Menu>
          <Tooltip title="Atualizar">
            <IconButton onClick={fetchInstances} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
          >
            Nova Instância
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              {visibleColumns.id && <TableCell>ID</TableCell>}
              {visibleColumns.token && <TableCell>Token</TableCell>}
              {visibleColumns.webhook && <TableCell>Webhook</TableCell>}
              {visibleColumns.jid && <TableCell>JID</TableCell>}
              {visibleColumns.events && <TableCell>Eventos</TableCell>}
              {visibleColumns.expiration && <TableCell>Expiração</TableCell>}
              <TableCell>Ativado</TableCell>
              <TableCell>Logado</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instances.map((instance) => (
              <TableRow key={instance.id}>
                <TableCell>{instance.name}</TableCell>
                {visibleColumns.id && <TableCell>{instance.id}</TableCell>}
                {visibleColumns.token && <TableCell>{instance.token}</TableCell>}
                {visibleColumns.webhook && <TableCell>{instance.webhook}</TableCell>}
                {visibleColumns.jid && <TableCell>{instance.jid}</TableCell>}
                {visibleColumns.events && <TableCell>{instance.events.join(', ')}</TableCell>}
                {visibleColumns.expiration && <TableCell>{instance.expiration}</TableCell>}
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: instance.connected ? 'success.main' : 'error.main',
                      mr: 1,
                    }}
                  />
                  {instance.connected ? 'Ativo' : 'Inativo'}
                </TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: instance.loggedIn ? 'success.main' : 'error.main',
                      mr: 1,
                    }}
                  />
                  {instance.loggedIn ? 'Conectado' : 'Desconectado'}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {instance.connected && (
                      <Tooltip title="QR Code">
                        <IconButton onClick={() => handleGetQR(instance)}>
                          <QrCodeIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {instance.connected || instance.loggedIn ? (
                      <>
                        <Tooltip title="Inativar">
                          <IconButton onClick={() => handleDisconnect(instance)}>
                            <PowerOffIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Desconectar">
                          <IconButton onClick={() => handleLogout(instance)}>
                            <LogoutIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <Tooltip title="Ativar">
                        <IconButton onClick={() => handleConnect(instance)}>
                          <PowerSettingsNewIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Deletar">
                      <IconButton onClick={() => {
                        setSelectedInstance(instance);
                        setOpenDeleteDialog(true);
                      }}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton 
                        onClick={() => {
                          setEditingInstance(instance);
                          setOpenEditDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Criar Nova Instância</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            fullWidth
            value={newInstance.name}
            onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
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
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button onClick={handleCreateInstance} variant="contained" color="primary">
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

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Editar Instância</DialogTitle>
        <DialogContent>
          {editingInstance && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Nome"
                fullWidth
                value={editingInstance.name}
                onChange={(e) => setEditingInstance({ ...editingInstance, name: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Token"
                fullWidth
                value={editingInstance.token}
                onChange={(e) => setEditingInstance({ ...editingInstance, token: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Webhook"
                fullWidth
                value={editingInstance.webhook}
                onChange={(e) => setEditingInstance({ ...editingInstance, webhook: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Expiração (em segundos)"
                type="number"
                fullWidth
                value={editingInstance.expiration}
                onChange={(e) => setEditingInstance({ ...editingInstance, expiration: parseInt(e.target.value) })}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Eventos</InputLabel>
                <Select
                  multiple
                  value={editingInstance.events}
                  label="Eventos"
                  onChange={(e) => setEditingInstance({ ...editingInstance, events: handleEventsChange(e.target.value) })}
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
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button onClick={handleEdit} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Instances; 