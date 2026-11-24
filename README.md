# Chat em Tempo Real com Node.js e WebSockets

Aplicação web de chat em tempo real desenvolvida com **Node.js**, **Express** e **WebSockets** (biblioteca [`ws`](https://github.com/websockets/ws)). Vários usuários podem se conectar ao mesmo tempo e trocar mensagens instantaneamente. O histórico de mensagens é persistido em um arquivo **JSON**.

## Funcionalidades

- Conexão de múltiplos usuários simultâneos com troca de mensagens instantânea
- Lista de usuários online atualizada em tempo real
- Avisos de entrada e saída de usuários
- Indicador de "digitando..."
- Histórico das últimas mensagens carregado ao entrar no chat
- Persistência das mensagens em `data/messages.json` (mantém as 500 mais recentes)
- Reconexão automática do cliente caso o servidor caia
- Validação de nomes duplicados e proteção contra injeção de HTML

## Estrutura do projeto

```
chat-websocket-node/
├── server.js              # Servidor HTTP (Express) que serve a interface e inicia o WebSocket
├── src/
│   ├── websocket.js       # Módulo de gerenciamento das conexões WebSocket
│   └── messageStore.js    # Armazenamento de mensagens persistido em arquivo JSON
├── public/                # Interface do usuário (HTML, CSS e JavaScript do cliente)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── data/                  # Pasta onde o arquivo messages.json é gerado
└── package.json
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 ou superior
- npm (já vem junto com o Node.js)

Para conferir as versões instaladas:

```bash
node -v
npm -v
```

## Instalação

1. Clone o repositório:

   ```bash
   git clone https://github.com/gustavo-as/chat-websocket-node.git
   cd chat-websocket-node
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

## Executando o servidor

```bash
npm start
```

O terminal exibirá:

```
Servidor rodando em http://localhost:3000
```

Para desenvolvimento, com reinício automático ao alterar arquivos:

```bash
npm run dev
```

### Variáveis de ambiente (opcionais)

| Variável    | Padrão                | Descrição                               |
|-------------|-----------------------|-----------------------------------------|
| `PORT`      | `3000`                | Porta do servidor HTTP/WebSocket        |
| `DATA_FILE` | `data/messages.json`  | Caminho do arquivo JSON de mensagens    |

Exemplo:

```bash
PORT=8080 npm start
```

## Acessando a aplicação

1. Com o servidor rodando, abra o navegador em **http://localhost:3000**
2. Digite um nome de usuário e clique em **Entrar**
3. Para testar com vários usuários, abra outras abas ou janelas (ou outro navegador) no mesmo endereço e entre com nomes diferentes
4. Outros computadores da mesma rede podem acessar pelo IP da máquina, por exemplo `http://192.168.0.10:3000`

O histórico também pode ser consultado em formato JSON em **http://localhost:3000/api/messages**.

## Protocolo WebSocket

A comunicação entre cliente e servidor usa mensagens JSON:

| Direção            | Tipo      | Exemplo                                              |
|--------------------|-----------|------------------------------------------------------|
| Cliente → Servidor | `join`    | `{ "type": "join", "user": "Ana" }`                  |
| Cliente → Servidor | `message` | `{ "type": "message", "text": "Olá!" }`              |
| Cliente → Servidor | `typing`  | `{ "type": "typing" }`                               |
| Servidor → Cliente | `history` | `{ "type": "history", "messages": [ ... ] }`         |
| Servidor → Cliente | `message` | `{ "type": "message", "message": { ... } }`          |
| Servidor → Cliente | `users`   | `{ "type": "users", "users": ["Ana", "Bruno"] }`     |
| Servidor → Cliente | `typing`  | `{ "type": "typing", "user": "Ana" }`                |
| Servidor → Cliente | `error`   | `{ "type": "error", "error": "Mensagem de erro" }`   |

## Tecnologias

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [ws](https://github.com/websockets/ws)
- HTML, CSS e JavaScript puro no front-end

## Autor

Gustavo — [github.com/gustavo-as](https://github.com/gustavo-as)
