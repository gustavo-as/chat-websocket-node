const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Armazenamento de mensagens persistido em um arquivo JSON.
 * As mensagens ficam em memória e são gravadas no disco a cada alteração
 * (escrita atômica: grava em arquivo temporário e depois renomeia).
 */
class MessageStore {
  constructor(filePath, { maxMessages = 500 } = {}) {
    this.filePath = filePath;
    this.maxMessages = maxMessages;
    this.messages = this.load();
  }

  load() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Não foi possível ler o arquivo de mensagens, iniciando vazio:', err.message);
      }
      return [];
    }
  }

  flush() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.messages, null, 2));
    fs.renameSync(tmp, this.filePath);
  }

  add({ type = 'message', user, text }) {
    const message = {
      id: crypto.randomUUID(),
      type,
      user,
      text,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
    this.flush();
    return message;
  }

  getAll() {
    return [...this.messages];
  }

  getRecent(limit = 50) {
    return this.messages.slice(-limit);
  }
}

module.exports = MessageStore;
