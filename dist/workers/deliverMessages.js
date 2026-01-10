"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new ioredis_1.default(redisUrl);
const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
async function deliverMessage(msg) {
    // Placeholder for actual delivery logic (e.g., WhatsApp/SMS API)
    console.log(`[DELIVERY ATTEMPT] To: ${msg.recipient} | Channel: ${msg.channel} | Message: "${msg.message}" | Scheduled: ${msg.sendAt}`);
    // Simulate delivery success
    return true;
}
async function pollAndDeliver() {
    const now = Date.now();
    try {
        // Get all messages with sendAt <= now
        const results = await redis.zrangebyscore('scheduled_messages', 0, now);
        for (const msgStr of results) {
            const msg = JSON.parse(msgStr);
            // Attempt delivery
            const delivered = await deliverMessage(msg);
            if (delivered) {
                // Remove from scheduled set
                await redis.zrem('scheduled_messages', msgStr);
                // Optionally, store in a delivered set or log
                await redis.hset('delivered_messages', msg.id, JSON.stringify({
                    ...msg,
                    status: 'delivered',
                    deliveredAt: new Date().toISOString(),
                }));
                console.log(`[DELIVERED] Message ID: ${msg.id}`);
            }
            else {
                // Optionally, handle retries or move to a failed set
                console.error(`[FAILED DELIVERY] Message ID: ${msg.id}`);
            }
        }
    }
    catch (error) {
        console.error('Error polling or delivering messages:', error);
    }
}
console.log('Message delivery worker started. Polling for due messages...');
setInterval(pollAndDeliver, POLL_INTERVAL_MS);
