# WuzAPI Dashboard

Interface de usuário para gerenciamento do WuzAPI.

## Requisitos

- Node.js 14.x ou superior
- npm 6.x ou superior

## Instalação

1. Clone o repositório
2. Navegue até o diretório do frontend:
   ```bash
   cd frontend
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```

## Executando o Projeto

Para iniciar o servidor de desenvolvimento:

```bash
npm start
```

O aplicativo estará disponível em [http://localhost:3000](http://localhost:3000).

## Estrutura do Projeto

```
frontend/
├── public/              # Arquivos estáticos
├── src/
│   ├── components/      # Componentes React
│   ├── pages/          # Páginas da aplicação
│   ├── App.tsx         # Componente principal
│   └── index.tsx       # Ponto de entrada
├── package.json        # Dependências e scripts
└── tsconfig.json       # Configuração do TypeScript
```

## Funcionalidades

- Dashboard com visão geral das instâncias
- Gerenciamento de instâncias (iniciar/parar)
- Configurações do sistema
- Interface responsiva e moderna

## Desenvolvimento

Para criar uma build de produção:

```bash
npm run build
```

Para testar a aplicação:

```bash
npm test
``` 