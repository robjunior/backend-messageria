import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getRedis } from "../services/redisService";
import jwt from "jsonwebtoken";

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

/**
 * Login endpoint: authenticates user and returns JWT
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const redis = getRedis();
    const userKey = "users";
    const userStr = await redis.hget(userKey, email);
    if (!userStr) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = JSON.parse(userStr);
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT (expires in 24h)
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" },
    );

    res.status(200).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};
