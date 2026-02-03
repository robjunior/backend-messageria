import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { getRedis } from "../services/redisService";
import jwt from "jsonwebtoken";

export const createOrg = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Organization name required" });

    // Retrieve authenticated user from JWT
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Missing token" });
    const token = auth.replace("Bearer ", "");
    let decoded: any;
    try {
      decoded = jwt.decode(token);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userId = decoded?.userId;
    const email = decoded?.email;
    if (!userId) return res.status(401).json({ error: "Invalid token" });

    const redis = getRedis();
    const orgId = uuidv4();
    const org = { id: orgId, name, ownerUserId: userId };
    await redis.hset("orgs", orgId, JSON.stringify(org));

    // Membership: userId <-> orgId
    await redis.sadd(`memberships:${userId}`, orgId);
    await redis.sadd(`org_members:${orgId}`, userId);

    // Optionally: save role/admin
    await redis.hset(`org_roles:${orgId}`, userId, "admin");

    res.status(201).json({ org, membership: { userId, orgId, role: "admin" } });
  } catch (err: any) {
    res.status(500).json({ error: "Organization creation failed", details: err.message });
  }
};
