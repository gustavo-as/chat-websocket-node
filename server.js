const http = require('http');
const path = require('path');
const express = require('express');

const MessageStore = require('./src/messageStore');
const { setupWebSocket } = require('./src/websocket');

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'messages.json');

const app = express();
const store = new MessageStore(DATA_FILE);

// Servidor HTTP: entrega a interface do usuário (arquivos estáticos em /public)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint auxiliar para consultar o histórico via HTTP
app.get('/api/messages', (req, res) => {
  res.json(store.getAll());
});

const server = http.createServer(app);

// O WebSocket compartilha a mesma porta do servidor HTTP
setupWebSocket(server, store);

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

function shutdown() {
  console.log('\nEncerrando servidor...');
  store.flush();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
