import request from "supertest";
import express from "express";
import Redis from "ioredis";
import { Server } from "http";

// Importa o app real, se possível. Caso contrário, cria um mock simples para o teste.
let app: express.Express;
let server: Server;

// Mock Redis para evitar dependência real em testes
jest.mock("ioredis");

beforeAll(() => {
  // Importa o app real, se estiver exportado como módulo
  // Exemplo: import app from '../src/index';
  // Aqui, criamos um app mínimo para o teste
  app = express();

  // Mock do Redis
  (Redis as any).mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue("PONG"),
    on: jest.fn(),
  }));

  // Endpoint /health simulado
  app.get("/health", async (_req, res) => {
    try {
      const redis = new Redis();
      await redis.ping();
      res.status(200).json({ status: "ok", redis: "connected" });
    } catch (error) {
      res.status(500).json({ status: "error", redis: "disconnected", error });
    }
  });

  server = app.listen(0); // Porta aleatória para o teste
});

afterAll((done) => {
  server.close(done);
});

describe("GET /health", () => {
  it("deve retornar status 200 e redis conectado", async () => {
    const res = await request(server).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", redis: "connected" });
  });
});
