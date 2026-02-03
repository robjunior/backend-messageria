import request from "supertest";
import app from "../src/app";
import { getRedis } from "../src/services/redisService";
import { v4 as uuidv4 } from "uuid";

describe("Scheduled Messages Endpoints", () => {
  let scheduledId: string;
  let tenantHeader: any;

  beforeAll(async () => {
    const redis = getRedis();
    // Create user
    const user = {
      id: uuidv4(),
      email: "testuser@example.com",
      name: "Test User",
      passwordHash: "fakehash",
    };
    await redis.hset("users", user.email, JSON.stringify(user));
    // Create org
    const orgId = uuidv4();
    const org = { id: orgId, name: "Test Org", ownerUserId: user.id };
    await redis.hset("orgs", orgId, JSON.stringify(org));
    // Membership
    await redis.sadd(`memberships:${user.id}`, orgId);
    await redis.sadd(`org_members:${orgId}`, user.id);
    await redis.hset(`org_roles:${orgId}`, user.id, "admin");
    tenantHeader = { "x-tenant-id": orgId };
  });

  it("POST /scheduled should schedule a new message", async () => {
    const res = await request(app)
      .post("/scheduled")
      .set(tenantHeader)
      .send({
        recipient: "5511999999999",
        message: "Test message",
        sendAt: Date.now() + 60000,
        channel: "whatsapp",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipient).toBe("5511999999999");
    expect(res.body.data.message).toBe("Test message");
    scheduledId = res.body.data.id;
  });

  it("GET /scheduled should list scheduled messages", async () => {
    const res = await request(app).get("/scheduled").set(tenantHeader);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages.length).toBeGreaterThan(0);
  });

  it("PUT /scheduled/:id should update a scheduled message", async () => {
    const res = await request(app)
      .put(`/scheduled/${scheduledId}`)
      .set(tenantHeader)
      .send({ message: "Updated message", channel: "sms" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Updated message");
    expect(res.body.data.channel).toBe("sms");
  });

  it("DELETE /scheduled/:id should remove a scheduled message", async () => {
    const res = await request(app)
      .delete(`/scheduled/${scheduledId}`)
      .set(tenantHeader);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBe(scheduledId);

    // Confirm removal
    const res2 = await request(app).get("/scheduled").set(tenantHeader);
    const found = res2.body.messages.find((msg: any) => msg.id === scheduledId);
    expect(found).toBeUndefined();
  });

  it("PUT /scheduled/:id should return 404 if message not found", async () => {
    const res = await request(app)
      .put("/scheduled/nonexistent-id")
      .set(tenantHeader)
      .send({ message: "Should not update" });
    expect(res.status).toBe(404);
  });

  it("DELETE /scheduled/:id should return 404 if message not found", async () => {
    const res = await request(app)
      .delete("/scheduled/nonexistent-id")
      .set(tenantHeader);
    expect(res.status).toBe(404);
  });
});
