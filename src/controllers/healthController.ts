dev/backend/src/controllers/healthController.ts
import { Request, Response } from "express";
import { getRedis } from "../services/redisService";

export const healthCheck = async (_req: Request, res: Response) => {
  try {
    const redis = getRedis();
    await redis.ping();
    res.status(200).json({ status: "ok", redis: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", redis: "disconnected", error });
  }
};
