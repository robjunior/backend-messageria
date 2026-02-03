import { Request, Response } from "express";

type AuthRequest = Request & {
  user?: { userId: string; email: string; name: string };
};

import { getRedis } from "../services/redisService";
import { getTenantId, tenantKey } from "../services/tenantService";
import { v4 as uuidv4 } from "uuid";

/**
 * Schedule a new message for a tenant
 */
export const scheduleMessage = async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const scheduledKey = tenantKey(tenantId, "scheduled_messages");

    const { recipient, message, sendAt, channel, type, isDraft, isDeleted } =
      req.body;
    const authReq = req as AuthRequest;
    const authorId = authReq.user?.userId || req.header("x-user-id"); // Suporte para JWT ou header manual
    const orgId = tenantId;

    if (!recipient || !message || !sendAt || !channel || !type || !authorId) {
      return res.status(400).json({
        error:
          "recipient, message, sendAt, channel, type, and authorId are required",
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const msgData = {
      id,
      orgId,
      authorId,
      recipient,
      message,
      sendAt,
      channel,
      type,
      status: isDraft ? "draft" : "scheduled",
      isDraft: !!isDraft,
      isDeleted: !!isDeleted,
      createdAt: now,
      updatedAt: now,
    };

    const redis = getRedis();
    await redis.zadd(scheduledKey, sendAt, JSON.stringify(msgData));
    res.status(201).json({ success: true, id, data: msgData });
  } catch (error: any) {
    console.error(error); // Add this line
    res
      .status(500)
      .json({ error: "Failed to schedule message", details: error.message });
  }
};

/**
 * List all scheduled messages for a tenant
 */
export const getAllScheduled = async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const scheduledKey = tenantKey(tenantId, "scheduled_messages");

    const redis = getRedis();
    const results = await redis.zrange(scheduledKey, 0, -1);
    const messages = results.map((msgStr: string) => JSON.parse(msgStr));
    res.status(200).json({ messages });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to fetch scheduled messages",
      details: error.message,
    });
  }
};

/**
 * Update a scheduled message by ID for a tenant
 */
export const updateScheduled = async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const scheduledKey = tenantKey(tenantId, "scheduled_messages");

    const { id } = req.params;
    const {
      recipient,
      message,
      sendAt,
      channel,
      type,
      isDraft,
      isDeleted,
      status,
    } = req.body;

    const redis = getRedis();
    const results = await redis.zrange(scheduledKey, 0, -1);
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
      return res.status(404).json({ error: "Message not found" });
    }

    const updatedMsg = {
      ...foundMsg,
      recipient: recipient ?? foundMsg.recipient,
      message: message ?? foundMsg.message,
      sendAt: sendAt ?? foundMsg.sendAt,
      channel: channel ?? foundMsg.channel,
      type: type ?? foundMsg.type,
      isDraft: typeof isDraft === "boolean" ? isDraft : foundMsg.isDraft,
      isDeleted:
        typeof isDeleted === "boolean" ? isDeleted : foundMsg.isDeleted,
      status: status ?? foundMsg.status,
      updatedAt: new Date().toISOString(),
    };

    await redis.zrem(scheduledKey, foundMsgStr);
    await redis.zadd(
      scheduledKey,
      updatedMsg.sendAt,
      JSON.stringify(updatedMsg),
    );
    res.status(200).json({ success: true, data: updatedMsg });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to update scheduled message",
      details: error.message,
    });
  }
};

/**
 * Delete (cancel) a scheduled message by ID for a tenant
 */
export const deleteScheduled = async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const scheduledKey = tenantKey(tenantId, "scheduled_messages");

    const { id } = req.params;
    const redis = getRedis();
    const results = await redis.zrange(scheduledKey, 0, -1);
    let found = false;
    let deletedMsg = null;
    let foundMsgStr: string | null = null;

    for (const msgStr of results) {
      const msg = JSON.parse(msgStr);
      if (msg.id === id) {
        found = true;
        deletedMsg = msg;
        foundMsgStr = msgStr;
        break;
      }
    }

    if (found && foundMsgStr) {
      await redis.zrem(scheduledKey, foundMsgStr);
      res.status(200).json({ success: true, id });
    } else {
      res.status(404).json({ error: "Message not found" });
    }
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to delete scheduled message",
      details: error.message,
    });
  }
};
