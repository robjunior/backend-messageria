"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// Create HTTP server and Socket.IO server
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // Adjust as needed for production
        methods: ["GET", "POST", "DELETE"],
    },
});
// Redis connection
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new ioredis_1.default(redisUrl);
redis.on("connect", () => {
    console.log("Connected to Redis");
});
redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});
// Middleware
app.use(express_1.default.json());
// Health check endpoint
app.get("/health", async (_req, res) => {
    try {
        await redis.ping();
        res.status(200).json({ status: "ok", redis: "connected" });
    }
    catch (error) {
        res.status(500).json({ status: "error", redis: "disconnected", error });
    }
});
// Schedule a message
app.post("/schedule", async (req, res) => {
    const { recipient, message, sendAt, channel } = req.body;
    if (!recipient || !message || !sendAt || !channel) {
        return res
            .status(400)
            .json({ error: "recipient, message, sendAt, and channel are required" });
    }
    const id = `msg:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
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
        // Store message in a sorted set with sendAt as the score
        await redis.zadd("scheduled_messages", sendAt, JSON.stringify(msgData));
        res.status(201).json({ success: true, id, data: msgData });
        // Emit real-time event
        io.emit("messageScheduled", msgData);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Failed to schedule message", details: error });
    }
});
// List all scheduled messages
app.get("/scheduled", async (_req, res) => {
    try {
        const results = await redis.zrange("scheduled_messages", 0, -1);
        const messages = results.map((msgStr) => JSON.parse(msgStr));
        res.status(200).json({ messages });
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Failed to fetch scheduled messages", details: error });
    }
});
// Delete (cancel) a scheduled message by ID
app.delete("/scheduled/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Get all scheduled messages
        const results = await redis.zrange("scheduled_messages", 0, -1);
        let found = false;
        let deletedMsg = null;
        for (const msgStr of results) {
            const msg = JSON.parse(msgStr);
            if (msg.id === id) {
                await redis.zrem("scheduled_messages", msgStr);
                found = true;
                deletedMsg = msg;
                break;
            }
        }
        if (found) {
            res.status(200).json({ success: true, id });
            // Emit real-time event
            io.emit("messageDeleted", { id, ...deletedMsg });
        }
        else {
            res.status(404).json({ error: "Message not found" });
        }
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Failed to delete scheduled message", details: error });
    }
});
// Socket.IO connection handler (optional logging)
io.on("connection", (socket) => {
    console.log("A client connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});
// Start server
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Socket.IO server running on http://localhost:${port}`);
});
