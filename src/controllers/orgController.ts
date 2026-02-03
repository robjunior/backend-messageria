import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { getRedis } from "../services/redisService";
import jwt from "jsonwebtoken";

export const createOrg = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ error: "Organization name required" });

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
    res
      .status(500)
      .json({ error: "Organization creation failed", details: err.message });
  }
};

import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

// Invite a user to an organization
export const inviteUserToOrg = async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { email, role = "member" } = req.body;
    if (!orgId || !email) {
      return res
        .status(400)
        .json({ error: "Organization ID and email required" });
    }

    const redis = getRedis();
    // Check if org exists
    const orgStr = await redis.hget("orgs", orgId);
    if (!orgStr) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Generate invite token
    const inviteId = uuidv4();
    const token = uuidv4();
    const invite = {
      id: inviteId,
      orgId,
      email,
      role,
      invitedByUserId: req.userId || null, // Optionally set by middleware
      status: "pending",
      token,
      createdAt: new Date().toISOString(),
    };

    // Save invite
    await redis.hset("invites", inviteId, JSON.stringify(invite));
    await redis.hset(`invite_tokens`, token, inviteId);

    // (Future: send email with token link)
    res.status(201).json({ invite, inviteToken: token });
  } catch (err: any) {
    res.status(500).json({ error: "Invite failed", details: err.message });
  }
};

// Accept an organization invite
export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const { inviteToken } = req.body;
    if (!inviteToken) {
      return res.status(400).json({ error: "Invite token required" });
    }

    const redis = getRedis();
    const inviteId = await redis.hget("invite_tokens", inviteToken);
    if (!inviteId) {
      return res.status(404).json({ error: "Invalid or expired invite token" });
    }

    const inviteStr = await redis.hget("invites", inviteId);
    if (!inviteStr) {
      return res.status(404).json({ error: "Invite not found" });
    }

    const invite = JSON.parse(inviteStr);
    if (invite.status !== "pending") {
      return res.status(400).json({ error: "Invite already used or expired" });
    }

    // Find or create user by email (for demo, user must exist)
    const userKey = "users";
    const userStr = await redis.hget(userKey, invite.email);
    if (!userStr) {
      return res
        .status(404)
        .json({ error: "User must register before accepting invite" });
    }
    const user = JSON.parse(userStr);

    // Create membership
    await redis.sadd(`memberships:${user.id}`, invite.orgId);
    await redis.sadd(`org_members:${invite.orgId}`, user.id);
    await redis.hset(`org_roles:${invite.orgId}`, user.id, invite.role);

    // Mark invite as accepted
    invite.status = "accepted";
    invite.acceptedAt = new Date().toISOString();
    await redis.hset("invites", inviteId, JSON.stringify(invite));

    res
      .status(200)
      .json({ orgId: invite.orgId, userId: user.id, role: invite.role });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Accept invite failed", details: err.message });
  }
};
