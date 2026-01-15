import request from "supertest";
import express from "express";
import bodyParser from "body-parser";
import Redis from "ioredis";
import { Server } from "http";

// Mock Redis para evitar dependência real em testes
jest.mock("ioredis");

let app: express.Express;
let server: Server;

// Utilitário para criar mensagens simuladas
const makeMessage = (overrides = {}) => ({
  id: "msg:123",
  recipient: "5511999999999",
  message: "Teste de mensagem",
  sendAt: Date.now() + 60000,
  channel: "whatsapp",
  status: "scheduled",
  createdAt: new Date().toISOString(),
  ...overrides,
});

let scheduledMessages: string[] = [];

beforeAll(() => {
  app = express();
  app.use(bodyParser.json());

  // Mock do Redis
  (Redis as any).mockImplementation(() => ({
    zadd: jest.fn((_key: string, _score: number, value: string) => {
      scheduledMessages.push(value);
      return Promise.resolve(1);
    }),
    zrange: jest.fn((_key: string, _start: number, _stop: number) => {
      return Promise.resolve(scheduledMessages);
    }),
    zrem: jest.fn((_key: string, value: string) => {
      const idx = scheduledMessages.indexOf(value);
      if (idx !== -1) scheduledMessages.splice(idx, 1);
      return Promise.resolve(1);
    }),
    ping: jest.fn().mockResolvedValue("PONG"),
    on: jest.fn(),
  }));

  // POST /schedule
  app.post("/schedule", async (req, res) => {
    const { recipient, message, sendAt, channel } = req.body;
    if (!recipient || !message || !sendAt || !channel) {
      return res.status(400).json({ error: "recipient, message, sendAt, and channel are required" });
    }
    const id = `msg:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const msgData = {
      id,
      recipient,
      message,
      sendAt,
      channel,
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };
    await new Redis().zadd("scheduled_messages", sendAt, JSON.stringify(msgData));
    res.status(201).json({ success: true, id, data: msgData });
  });

  // GET /scheduled
  app.get("/scheduled", async (_req, res) => {
    const results = await new Redis().zrange("scheduled_messages", 0, -1);
    const messages = results.map((msgStr: string) => JSON.parse(msgStr));
    res.status(200).json({ messages });
  });

  // PUT /scheduled/:id
  app.put("/scheduled/:id", async (req, res) => {
    const { id } = req.params;
    const { recipient, message, sendAt, channel } = req.body;
    const results = await new Redis().zrange("scheduled_messages", 0, -1);
    let foundMsg: any = null;
    let foundMsgStr: string | null = null;
    for (const msgStr of results) {
      const msg = JSON.parse(msgStr);
      if (msg.id === id) {
        foundMsg = msg;
        foundMsgStr = msgStr;
        break;
      }
    }
    if (!foundMsg || !foundMsgStr) {
      return res.status(404).json({ error: "Mensagem não encontrada" });
    }
    const updatedMsg = {
      ...foundMsg,
      recipient: recipient ?? foundMsg.recipient,
      message: message ?? foundMsg.message,
      sendAt: sendAt ?? foundMsg.sendAt,
      channel: channel ?? foundMsg.channel,
      updatedAt: new Date().toISOString(),
    };
    await new Redis().zrem("scheduled_messages", foundMsgStr);
    await new Redis().zadd("scheduled_messages", updatedMsg.sendAt, JSON.stringify(updatedMsg));
    res.status(200).json({ success: true, data: updatedMsg });
  });

  // DELETE /scheduled/:id
  app.delete("/scheduled/:id", async (req, res) => {
    const { id } = req.params;
    const results = await new Redis().zrange("scheduled_messages", 0, -1);
    let found = false;
    let foundMsgStr: string | null = null;
    for (const msgStr of results) {
      const msg = JSON.parse(msgStr);
      if (msg.id === id) {
        found = true;
        foundMsgStr = msgStr;
        break;
      }
    }
    if (found && foundMsgStr) {
      await new Redis().zrem("scheduled_messages", foundMsgStr);
      res.status(200).json({ success: true, id });
    } else {
      res.status(404).json({ error: "Message not found" });
    }
  });

  server = app.listen(0); // Porta aleatória para o teste
});

afterEach(() => {
  scheduledMessages = [];
});

afterAll((done) => {
  server.close(done);
});

describe("Endpoints de mensagens agendadas", () => {
  it("POST /schedule deve agendar uma nova mensagem", async () => {
    const msg = makeMessage();
    const res = await request(server)
      .post("/schedule")
      .send({
        recipient: msg.recipient,
        message: msg.message,
        sendAt: msg.sendAt,
        channel: msg.channel,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipient).toBe(msg.recipient);
    expect(res.body.data.message).toBe(msg.message);
  });

  it("GET /scheduled deve listar mensagens agendadas", async () => {
    // Adiciona uma mensagem manualmente
    const msg = makeMessage();
    scheduledMessages.push(JSON.stringify(msg));
    const res = await request(server).get("/scheduled");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages[0].id).toBe(msg.id);
  });

  it("PUT /scheduled/:id deve atualizar uma mensagem agendada", async () => {
    const msg = makeMessage();
    scheduledMessages.push(JSON.stringify(msg));
    const res = await request(server)
      .put(`/scheduled/${msg.id}`)
      .send({ message: "Mensagem atualizada", channel: "sms" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Mensagem atualizada");
    expect(res.body.data.channel).toBe("sms");
  });

  it("DELETE /scheduled/:id deve remover uma mensagem agendada", async () => {
    const msg = makeMessage();
    scheduledMessages.push(JSON.stringify(msg));
    const res = await request(server).delete(`/scheduled/${msg.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBe(msg.id);
    // Verifica se foi removido
    const res2 = await request(server).get("/scheduled");
    expect(res2.body.messages.length).toBe(0);
  });

  it("PUT /scheduled/:id deve retornar 404 se não encontrar a mensagem", async () => {
    const res = await request(server)
      .put("/scheduled/inexistente")
      .send({ message: "Nova mensagem" });
    expect(res.status).toBe(404);
  });

  it("DELETE /scheduled/:id deve retornar 404 se não encontrar a mensagem", async () => {
    const res = await request(server).delete("/scheduled/inexistente");
    expect(res.status).toBe(404);
  });
});
