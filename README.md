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

## API Endpoints

### Health

- **GET /health**  
  Returns server and Redis status.

---

### Scheduled Messages

- **GET /scheduled**  
  List all scheduled messages.

- **POST /scheduled**  
  Schedule a new message.  
  **Body:**
  ```json
  {
    "recipient": "5511999999999",
    "message": "Hello from the API!",
    "sendAt": 1735689600000,
    "channel": "whatsapp"
  }
  ```

- **PUT /scheduled/:id**  
  Update a scheduled message.  
  **Body:** (any updatable field)
  ```json
  {
    "message": "Updated message",
    "channel": "sms"
  }
  ```

- **DELETE /scheduled/:id**  
  Cancel a scheduled message.

---

### Delivered Messages

- **GET /delivered**  
  List all delivered messages.

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