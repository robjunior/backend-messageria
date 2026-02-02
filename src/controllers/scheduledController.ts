import { Request, Response } from "express";
import { io } from "../server";
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

    const { recipient, message, sendAt, channel } = req.body;
    if (!recipient || !message || !sendAt || !channel) {
      return res.status(400).json({
        error: "recipient, message, sendAt, and channel are required",
      });
    }

    const id = uuidv4();
    const msgData = {
      id,
      tenantId,
      recipient,
      message,
      sendAt,
      channel,
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };

    const redis = getRedis();
    await redis.zadd(scheduledKey, sendAt, JSON.stringify(msgData));
    io.emit("messageScheduled", msgData);
    res.status(201).json({ success: true, id, data: msgData });
  } catch (error: any) {
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
    const { recipient, message, sendAt, channel } = req.body;

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
      updatedAt: new Date().toISOString(),
    };

    await redis.zrem(scheduledKey, foundMsgStr);
    await redis.zadd(
      scheduledKey,
      updatedMsg.sendAt,
      JSON.stringify(updatedMsg),
    );
    io.emit("messageUpdated", updatedMsg);
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
      io.emit("messageDeleted", { id, ...deletedMsg });
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
