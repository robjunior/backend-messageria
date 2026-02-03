import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getRedis } from "../services/redisService";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password, and name required" });
    }

    const redis = getRedis();
    const userKey = "users";
    const exists = await redis.hexists(userKey, email);
    if (exists) {
      return res.status(409).json({ error: "User already exists" });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id, email, name, passwordHash };
    await redis.hset(userKey, email, JSON.stringify(user));
    res.status(201).json({ id, email, name });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Registration failed", details: err.message });
  }
};
