import { getRedis } from "../services/redisService";
import { ScheduledMessage } from "../types/message";

const POLL_INTERVAL_MS = 5000;

async function deliverMessage(msg: ScheduledMessage) {
  // TODO: Replace with real delivery logic (e.g., WhatsApp/SMS API)
  console.log(
    `[DELIVERY ATTEMPT] To: ${msg.recipient} | Channel: ${msg.channel} | Message: "${msg.message}" | Scheduled: ${msg.sendAt}`,
  );
  return true;
}

async function pollAndDeliver() {
  const redis = getRedis();
  const now = Date.now();

  try {
    const results = await redis.zrangebyscore("scheduled_messages", 0, now);

    for (const msgStr of results) {
      const msg: ScheduledMessage = JSON.parse(msgStr);

      const delivered = await deliverMessage(msg);

      if (delivered) {
        await redis.zrem("scheduled_messages", msgStr);

        await redis.hset(
          "delivered_messages",
          msg.id,
          JSON.stringify({
            ...msg,
            status: "delivered",
            deliveredAt: new Date().toISOString(),
          }),
        );

        console.log(`[DELIVERED] Message ID: ${msg.id}`);
      } else {
        // Optionally, handle retries or move to a failed set
        console.error(`[FAILED DELIVERY] Message ID: ${msg.id}`);
      }
    }
  } catch (error) {
    console.error("Error polling or delivering messages:", error);
  }
}

console.log("Message delivery worker started. Polling for due messages...");
setInterval(pollAndDeliver, POLL_INTERVAL_MS);
