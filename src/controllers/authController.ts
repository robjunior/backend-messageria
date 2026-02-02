dev/backend/src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getRedis } from "../services/redisService";
import { getTenantId, tenantKey } from "../services/tenantService";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const login = async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const redis = getRedis();
    const userKey = tenantKey(tenantId, "users");
    const userStr = await redis.hget(userKey, email);
    if (!userStr) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = JSON.parse(userStr);
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, tenantId, email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};
