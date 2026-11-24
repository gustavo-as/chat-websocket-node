const { WebSocketServer, WebSocket } = require('ws');

const MAX_NAME_LENGTH = 30;
const MAX_TEXT_LENGTH = 1000;

/**
 * Módulo responsável por gerenciar as conexões WebSocket.
 *
 * Protocolo (JSON):
 *  cliente -> servidor
 *    { type: 'join', user: 'nome' }
 *    { type: 'message', text: '...' }
 *    { type: 'typing' }
 *  servidor -> cliente
 *    { type: 'history', messages: [...] }
 *    { type: 'message', message: {...} }   (mensagem de usuário ou de sistema)
 *    { type: 'users', users: [...] }
 *    { type: 'typing', user: 'nome' }
 *    { type: 'error', error: '...' }
 */
function setupWebSocket(server, store) {
  const wss = new WebSocketServer({ server });
  const clients = new Map(); // ws -> { user }

  function send(ws, payload) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  function broadcast(payload, except) {
    const data = JSON.stringify(payload);
    for (const [client, info] of clients) {
      if (client !== except && info.user && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  function onlineUsers() {
    return [...clients.values()].map((c) => c.user).filter(Boolean).sort();
  }

  function broadcastUsers() {
    broadcast({ type: 'users', users: onlineUsers() });
  }

  function systemMessage(text) {
    const message = store.add({ type: 'system', user: null, text });
    broadcast({ type: 'message', message });
  }

  function handleJoin(ws, data) {
    const user = String(data.user || '').trim().slice(0, MAX_NAME_LENGTH);
    if (!user) {
      return send(ws, { type: 'error', error: 'Informe um nome de usuário.' });
    }
    const taken = onlineUsers().some((u) => u.toLowerCase() === user.toLowerCase());
    if (taken) {
      return send(ws, { type: 'error', error: 'Esse nome já está em uso. Escolha outro.' });
    }

    clients.get(ws).user = user;
    send(ws, { type: 'joined', user });
    send(ws, { type: 'history', messages: store.getRecent(100) });
    systemMessage(`${user} entrou no chat`);
    broadcastUsers();
  }

  function handleMessage(ws, data) {
    const { user } = clients.get(ws);
    if (!user) {
      return send(ws, { type: 'error', error: 'Entre no chat antes de enviar mensagens.' });
    }
    const text = String(data.text || '').trim().slice(0, MAX_TEXT_LENGTH);
    if (!text) return;

    const message = store.add({ type: 'message', user, text });
    broadcast({ type: 'message', message });
  }

  function handleTyping(ws) {
    const { user } = clients.get(ws);
    if (user) broadcast({ type: 'typing', user }, ws);
  }

  wss.on('connection', (ws) => {
    clients.set(ws, { user: null });
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (raw) => {
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        return send(ws, { type: 'error', error: 'Formato de mensagem inválido.' });
      }

      switch (data.type) {
        case 'join': return handleJoin(ws, data);
        case 'message': return handleMessage(ws, data);
        case 'typing': return handleTyping(ws);
        default: return send(ws, { type: 'error', error: 'Tipo de mensagem desconhecido.' });
      }
    });

    ws.on('close', () => {
      const { user } = clients.get(ws) || {};
      clients.delete(ws);
      if (user) {
        systemMessage(`${user} saiu do chat`);
        broadcastUsers();
      }
    });

    ws.on('error', (err) => console.error('Erro no WebSocket:', err.message));
  });

  // Heartbeat: encerra conexões que pararam de responder
  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  return wss;
}

module.exports = { setupWebSocket };
