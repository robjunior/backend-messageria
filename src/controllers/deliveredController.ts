import { Request, Response } from "express";
import { getRedis } from "../services/redisService";

// Handler to list all delivered messages
export const listDeliveredMessages = async (_req: Request, res: Response) => {
  try {
    const redis = getRedis();
    const results = await redis.hvals("delivered_messages");
    const messages = results.map((msgStr: string) => JSON.parse(msgStr));
    res.status(200).json({ messages });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch delivered messages", details: error });
  }
};
