# Messenger Delivery System – Backend

A modular, TypeScript-based backend for scheduling, delivering, and tracking messages (e.g., WhatsApp/SMS) using Node.js, Express, Redis, and Socket.IO.

---

## Features

- Schedule messages for future delivery (WhatsApp/SMS, extensible)
- Real-time updates via Socket.IO
- RESTful API (CRUD for scheduled messages, delivered messages)
- Modular code structure (routes, controllers, services)
- Test-driven development with Jest and Supertest
- Redis-backed queue and delivery tracking

---

## Prerequisites

- Node.js (v18+ recommended)
- npm
- Redis (local or via Docker)

---

## Getting Started

### 1. Clone the repository

```sh
git clone <your-repo-url>
cd dev/backend
```

### 2. Install dependencies

```sh
npm install
```

### 3. Configure environment variables

Create a `.env` file (optional, defaults are provided):

```
PORT=4000
REDIS_URL=redis://localhost:6379
JWT_SECRET=uma_senha_segura_aqui
```

### 4. Start Redis

**Locally:**
```sh
redis-server
```

**Or with Docker:**
```sh
docker run --name redis -p 6379:6379 -d redis
```

### 5. Run the backend (development)

```sh
npm run dev
```

The server will be available at [http://localhost:4000](http://localhost:4000).

---

## Project Structure

```
src/
  app.ts                # Express app setup
  server.ts             # HTTP/Socket.IO server bootstrap
  routes/               # Express route modules
  controllers/          # Route handlers
  services/             # Redis and business logic
  types/                # TypeScript types
  workers/              # Background workers (message delivery)
  config/               # Configuration helpers
tests/                  # Jest/Supertest test suites
```

---

## API Endpoints & Front-End Integration Guide

### Autenticação

- **POST /auth/register**
  - Cria um novo usuário.
  - Body:
    ```json
    {
      "email": "user@email.com",
      "password": "senha123",
      "name": "Nome do Usuário"
    }
    ```
  - Resposta:
    ```json
    { "id": "...", "email": "...", "name": "..." }
    ```

- **POST /auth/login**
  - Autentica usuário e retorna JWT.
  - Body:
    ```json
    {
      "email": "user@email.com",
      "password": "senha123"
    }
    ```
  - Resposta:
    ```json
    {
      "token": "<jwt>",
      "user": { "id": "...", "email": "...", "name": "..." }
    }
    ```

  > **Importante:** Guarde o JWT para enviar no header `Authorization: Bearer <jwt>` nas rotas protegidas.

---

### Organizações

- **POST /orgs**
  - Cria uma nova organização e adiciona o usuário autenticado como admin.
  - Headers: `Authorization: Bearer <jwt>`
  - Body:
    ```json
    { "name": "Nome da Organização" }
    ```
  - Resposta:
    ```json
    {
      "org": { "id": "...", "name": "...", "ownerUserId": "..." },
      "membership": { "userId": "...", "orgId": "...", "role": "admin" }
    }
    ```

- **POST /orgs/:orgId/invite**
  - Convida um usuário para uma organização.
  - Headers: `Authorization: Bearer <jwt>`
  - Body:
    ```json
    { "email": "convidado@email.com", "role": "member" }
    ```
  - Resposta:
    ```json
    { "invite": { ... }, "inviteToken": "<token>" }
    ```

- **POST /orgs/accept-invite**
  - Aceita um convite para organização.
  - Body:
    ```json
    { "inviteToken": "<token recebido>" }
    ```
  - Resposta:
    ```json
    { "orgId": "...", "userId": "...", "role": "member" }
    ```

---

### Mensagens Agendadas

> **Todas as rotas abaixo exigem o header:**  
> `x-tenant-id: <orgId>`

- **GET /scheduled**
  - Lista todas as mensagens agendadas do tenant.
  - Headers: `x-tenant-id: <orgId>`

- **POST /scheduled**
  - Agenda uma nova mensagem.
  - Headers: `x-tenant-id: <orgId>`
  - Body:
    ```json
    {
      "recipient": "5511999999999",
      "message": "Olá!",
      "sendAt": 1735689600000,
      "channel": "whatsapp"
    }
    ```
  - Resposta:
    ```json
    { "success": true, "id": "...", "data": { ... } }
    ```

- **PUT /scheduled/:id**
  - Atualiza uma mensagem agendada.
  - Headers: `x-tenant-id: <orgId>`
  - Body: Campos a atualizar.
  - Resposta:
    ```json
    { "success": true, "data": { ... } }
    ```

- **DELETE /scheduled/:id**
  - Cancela uma mensagem agendada.
  - Headers: `x-tenant-id: <orgId>`
  - Resposta:
    ```json
    { "success": true, "id": "..." }
    ```

---

### Mensagens Entregues e Falhas

- **GET /delivered**
  - Lista todas as mensagens entregues.
  - Resposta:
    ```json
    { "messages": [ ... ] }
    ```

- **GET /failed**
  - Lista todas as mensagens que falharam.
  - Resposta:
    ```json
    { "messages": [ ... ] }
    ```

---

### Health

- **GET /health**  
  Retorna status do servidor e Redis.
  - Resposta:
    ```json
    { "status": "ok", "redis": "connected" }
    ```

---

## Fluxo de Integração Front-End

1. **Registrar usuário:** `POST /auth/register`
2. **Login:** `POST /auth/login` (guarde o JWT)
3. **Criar organização:** `POST /orgs` (com JWT)
4. **Convidar usuário:** `POST /orgs/:orgId/invite` (com JWT)
5. **Aceitar convite:** `POST /orgs/accept-invite` (com token do convite)
6. **Agendar mensagens:** `POST /scheduled` (com `x-tenant-id`)
7. **Consultar entregas/falhas:** `GET /delivered`, `GET /failed`

---

## Headers Importantes

- **Authorization:**  
  Para rotas protegidas, envie:  
  `Authorization: Bearer <jwt>`

- **x-tenant-id:**  
  Para rotas multi-tenant (mensagens), envie:  
  `x-tenant-id: <orgId>`

---

## Padronização de Respostas de Erro

- Erros sempre retornam:
  ```json
  { "error": "Mensagem do erro", "details": "Detalhes (opcional)" }
  ```
  - Exemplo: usuário não autenticado
    ```json
    { "error": "Invalid or missing token" }
    ```

---

## Socket.IO – Atualizações em Tempo Real

- Conecte-se via Socket.IO no mesmo host/porta do backend.
- Eventos emitidos:
  - `messageScheduled`
  - `messageUpdated`
  - `messageDeleted`

  Exemplo de conexão (front-end JS):
  ```js
  import { io } from "socket.io-client";
  const socket = io("http://localhost:4000");
  socket.on("messageScheduled", (msg) => { /* ... */ });
  ```

---

## Exemplos de Requisições (cURL)

**Registrar:**
```sh
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com","password":"senha123","name":"Usuário"}'
```

**Login:**
```sh
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com","password":"senha123"}'
```

**Criar organização:**
```sh
curl -X POST http://localhost:4000/orgs \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Minha Empresa"}'
```

**Agendar mensagem:**
```sh
curl -X POST http://localhost:4000/scheduled \
  -H "x-tenant-id: <orgId>" \
  -H "Content-Type: application/json" \
  -d '{"recipient":"5511999999999","message":"Olá!","sendAt":1735689600000,"channel":"whatsapp"}'
```

---

## Dicas de Desenvolvimento

- Use [Postman](https://www.postman.com/) ou [httpie](https://httpie.io/) para testar a API.
- O worker em `src/workers/deliverMessages.ts` simula a entrega de mensagens.
- Para expandir: adicione novos canais, autenticação, integrações de entrega, etc.

---

## License

MIT

---

## Real-Time Updates

Socket.IO is available on the same port as the HTTP server.  
Events:
- `messageScheduled`
- `messageUpdated`
- `messageDeleted`

---

## Running Tests

```sh
npm test
```

Runs all Jest/Supertest test suites in the `tests/` directory.

---

## Development Tips

- Use [Postman](https://www.postman.com/) or [httpie](https://httpie.io/) to interact with the API.
- The worker in `src/workers/deliverMessages.ts` simulates message delivery and moves messages from scheduled to delivered.
- Extend the system by adding new channels, authentication, or delivery integrations.

---

## License

MIT

---