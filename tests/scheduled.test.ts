dev / backend / tests / scheduled.test.ts;
import request from "supertest";
import app from "../src/app";

describe("Scheduled Messages Endpoints", () => {
  let scheduledId: string;

  it("POST /scheduled should schedule a new message", async () => {
    const res = await request(app)
      .post("/scheduled")
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
    const res = await request(app).get("/scheduled");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages.length).toBeGreaterThan(0);
  });

  it("PUT /scheduled/:id should update a scheduled message", async () => {
    const res = await request(app)
      .put(`/scheduled/${scheduledId}`)
      .send({ message: "Updated message", channel: "sms" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Updated message");
    expect(res.body.data.channel).toBe("sms");
  });

  it("DELETE /scheduled/:id should remove a scheduled message", async () => {
    const res = await request(app).delete(`/scheduled/${scheduledId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBe(scheduledId);

    // Confirm removal
    const res2 = await request(app).get("/scheduled");
    const found = res2.body.messages.find((msg: any) => msg.id === scheduledId);
    expect(found).toBeUndefined();
  });

  it("PUT /scheduled/:id should return 404 if message not found", async () => {
    const res = await request(app)
      .put("/scheduled/nonexistent-id")
      .send({ message: "Should not update" });
    expect(res.status).toBe(404);
  });

  it("DELETE /scheduled/:id should return 404 if message not found", async () => {
    const res = await request(app).delete("/scheduled/nonexistent-id");
    expect(res.status).toBe(404);
  });
});
