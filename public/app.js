(() => {
  const $ = (id) => document.getElementById(id);

  const loginSection = $('login');
  const loginForm = $('login-form');
  const usernameInput = $('username');
  const loginError = $('login-error');

  const chatSection = $('chat');
  const statusEl = $('status');
  const messagesEl = $('messages');
  const userListEl = $('user-list');
  const userCountEl = $('user-count');
  const typingEl = $('typing');
  const messageForm = $('message-form');
  const messageInput = $('message-input');

  let ws = null;
  let currentUser = null;
  let pendingName = null;
  let reconnectTimer = null;
  let typingTimer = null;
  let lastTypingSent = 0;
  const renderedIds = new Set();

  function wsUrl() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${location.host}`;
  }

  function connect() {
    ws = new WebSocket(wsUrl());

    ws.addEventListener('open', () => {
      setStatus('conectado');
      const name = currentUser || pendingName;
      if (name) send({ type: 'join', user: name });
    });

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      handlers[data.type]?.(data);
    });

    ws.addEventListener('close', () => {
      setStatus('desconectado — tentando reconectar...');
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 2000);
    });
  }

  function send(payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  const handlers = {
    joined({ user }) {
      currentUser = user;
      loginSection.classList.add('hidden');
      chatSection.classList.remove('hidden');
      messageInput.focus();
    },
    history({ messages }) {
      messagesEl.innerHTML = '';
      renderedIds.clear();
      messages.forEach(renderMessage);
      scrollToBottom();
    },
    message({ message }) {
      renderMessage(message);
      scrollToBottom();
      if (message.type === 'message') clearTyping();
    },
    users({ users }) {
      userCountEl.textContent = users.length;
      userListEl.innerHTML = '';
      users.forEach((u) => {
        const li = document.createElement('li');
        li.textContent = u === currentUser ? `${u} (você)` : u;
        userListEl.appendChild(li);
      });
    },
    typing({ user }) {
      typingEl.textContent = `${user} está digitando...`;
      clearTimeout(typingTimer);
      typingTimer = setTimeout(clearTyping, 2500);
    },
    error({ error }) {
      if (!currentUser) {
        loginError.textContent = error;
        pendingName = null;
      } else {
        alertInChat(error);
      }
    },
  };

  function clearTyping() {
    typingEl.textContent = '';
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Usa textContent para evitar injeção de HTML (XSS)
  function renderMessage(msg) {
    if (renderedIds.has(msg.id)) return;
    renderedIds.add(msg.id);

    const li = document.createElement('li');

    if (msg.type === 'system') {
      li.className = 'msg system';
      li.textContent = `${msg.text} · ${formatTime(msg.timestamp)}`;
    } else {
      li.className = msg.user === currentUser ? 'msg mine' : 'msg';
      const meta = document.createElement('div');
      meta.className = 'meta';
      const name = document.createElement('strong');
      name.textContent = msg.user;
      meta.append(name, formatTime(msg.timestamp));
      const text = document.createElement('div');
      text.textContent = msg.text;
      li.append(meta, text);
    }

    messagesEl.appendChild(li);
  }

  function alertInChat(text) {
    renderMessage({ id: `local-${Date.now()}`, type: 'system', text, timestamp: new Date().toISOString() });
    scrollToBottom();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = usernameInput.value.trim();
    if (!name) return;
    loginError.textContent = '';
    pendingName = name;
    if (!send({ type: 'join', user: name })) {
      loginError.textContent = 'Sem conexão com o servidor. Tentando novamente...';
    }
  });

  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;
    if (send({ type: 'message', text })) {
      messageInput.value = '';
    } else {
      alertInChat('Sem conexão. A mensagem não foi enviada.');
    }
  });

  messageInput.addEventListener('input', () => {
    const now = Date.now();
    if (now - lastTypingSent > 1500) {
      lastTypingSent = now;
      send({ type: 'typing' });
    }
  });

  connect();
})();
