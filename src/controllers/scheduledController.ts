import { Request, Response } from "express";
import { io } from "../server";
import { getRedis } from "../services/redisService";
import { v4 as uuidv4 } from "uuid";

// Handler to schedule a new message
export const scheduleMessage = async (req: Request, res: Response) => {
  const { recipient, message, sendAt, channel } = req.body;

  if (!recipient || !message || !sendAt || !channel) {
    return res
      .status(400)
      .json({ error: "recipient, message, sendAt, and channel are required" });
  }

  const id = uuidv4();
  const msgData = {
    id,
    recipient,
    message,
    sendAt,
    channel,
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };

  try {
    const redis = getRedis();
    await redis.zadd("scheduled_messages", sendAt, JSON.stringify(msgData));
    io.emit("messageScheduled", msgData);
    res.status(201).json({ success: true, id, data: msgData });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to schedule message", details: error });
  }
};

// Handler to list all scheduled messages
export const listScheduledMessages = async (_req: Request, res: Response) => {
  try {
    const redis = getRedis();
    const results = await redis.zrange("scheduled_messages", 0, -1);
    const messages = results.map((msgStr: string) => JSON.parse(msgStr));
    res.status(200).json({ messages });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch scheduled messages", details: error });
  }
};

// Handler to update a scheduled message by ID
export const updateScheduledMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { recipient, message, sendAt, channel } = req.body;

  try {
    const redis = getRedis();
    const results = await redis.zrange("scheduled_messages", 0, -1);
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

    await redis.zrem("scheduled_messages", foundMsgStr);
    await redis.zadd(
      "scheduled_messages",
      updatedMsg.sendAt,
      JSON.stringify(updatedMsg),
    );
    io.emit("messageUpdated", updatedMsg);
    res.status(200).json({ success: true, data: updatedMsg });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update scheduled message", details: error });
  }
};

// Handler to delete a scheduled message by ID
export const deleteScheduledMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const redis = getRedis();
    const results = await redis.zrange("scheduled_messages", 0, -1);
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
      await redis.zrem("scheduled_messages", foundMsgStr);
      io.emit("messageDeleted", { id, ...deletedMsg });
      res.status(200).json({ success: true, id });
    } else {
      res.status(404).json({ error: "Message not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete scheduled message", details: error });
  }
};
