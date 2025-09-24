// Lista de tipos de eventos suportados
export const SUPPORTED_EVENT_TYPES = [
  // Messages and Communication
  "Message",
  "UndecryptableMessage",
  "Receipt",
  "MediaRetry",
  "ReadReceipt",

  // Groups and Contacts
  "GroupInfo",
  "JoinedGroup",
  "Picture",
  "BlocklistChange",
  "Blocklist",

  // Connection and Session
  "Connected",
  "Disconnected",
  "ConnectFailure",
  "KeepAliveRestored",
  "KeepAliveTimeout",
  "LoggedOut",
  "ClientOutdated",
  "TemporaryBan",
  "StreamError",
  "StreamReplaced",
  "PairSuccess",
  "PairError",
  "QR",
  "QRScannedWithoutMultidevice",

  // Privacy and Settings
  "PrivacySettings",
  "PushNameSetting",
  "UserAbout",

  // Synchronization and State
  "AppState",
  "AppStateSyncComplete",
  "HistorySync",
  "OfflineSyncCompleted",
  "OfflineSyncPreview",

  // Calls
  "CallOffer",
  "CallAccept",
  "CallTerminate",
  "CallOfferNotice",
  "CallRelayLatency",

  // Presence and Activity
  "Presence",
  "ChatPresence",

  // Identity
  "IdentityChange",

  // Erros
  "CATRefreshError",

  // Newsletter (WhatsApp Channels)
  "NewsletterJoin",
  "NewsletterLeave",
  "NewsletterMuteChange",
  "NewsletterLiveUpdate",

  // Facebook/Meta Bridge
  "FBMessage",

  // Special - receives all events
  "All",
] as const;

// Mapeamento de tipos de eventos para labels em português
export const EVENT_TYPE_LABELS: Record<string, string> = {
  "All": "Todos",
  "Message": "Mensagem",
  "ReadReceipt": "Confirmação de Leitura",
  "Presence": "Presença",
  "HistorySync": "Sincronização de Histórico",
  "ChatPresence": "Presença no Chat",
  "UndecryptableMessage": "Mensagem Não Criptografada",
  "Receipt": "Recibo",
  "MediaRetry": "Tentativa de Mídia",
  "GroupInfo": "Informações do Grupo",
  "JoinedGroup": "Entrou no Grupo",
  "Picture": "Foto",
  "BlocklistChange": "Mudança na Lista de Bloqueio",
  "Blocklist": "Lista de Bloqueio",
  "Connected": "Conectado",
  "Disconnected": "Desconectado",
  "ConnectFailure": "Falha na Conexão",
  "KeepAliveRestored": "Keep-Alive Restaurado",
  "KeepAliveTimeout": "Timeout do Keep-Alive",
  "LoggedOut": "Deslogado",
  "ClientOutdated": "Cliente Desatualizado",
  "TemporaryBan": "Banimento Temporário",
  "StreamError": "Erro de Stream",
  "StreamReplaced": "Stream Substituído",
  "PairSuccess": "Pareamento Bem-sucedido",
  "PairError": "Erro de Pareamento",
  "QR": "QR Code",
  "QRScannedWithoutMultidevice": "QR Escaneado Sem Multidispositivo",
  "PrivacySettings": "Configurações de Privacidade",
  "PushNameSetting": "Configuração do Nome Push",
  "UserAbout": "Sobre o Usuário",
  "AppState": "Estado do App",
  "AppStateSyncComplete": "Sincronização de Estado Completa",
  "OfflineSyncCompleted": "Sincronização Offline Completa",
  "OfflineSyncPreview": "Preview de Sincronização Offline",
  "CallOffer": "Oferta de Chamada",
  "CallAccept": "Aceitar Chamada",
  "CallTerminate": "Terminar Chamada",
  "CallOfferNotice": "Aviso de Oferta de Chamada",
  "CallRelayLatency": "Latência do Relay de Chamada",
  "IdentityChange": "Mudança de Identidade",
  "CATRefreshError": "Erro de Atualização CAT",
  "NewsletterJoin": "Entrar no Newsletter",
  "NewsletterLeave": "Sair do Newsletter",
  "NewsletterMuteChange": "Mudança de Silenciamento do Newsletter",
  "NewsletterLiveUpdate": "Atualização ao Vivo do Newsletter",
  "FBMessage": "Mensagem do Facebook",
};

// Tipos de eventos mais comuns para o frontend
export const COMMON_EVENT_TYPES = [
  "All",
  "Message",
  "ReadReceipt",
  "Presence",
  "HistorySync",
  "ChatPresence",
] as const;
