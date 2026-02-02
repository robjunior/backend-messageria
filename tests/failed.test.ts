import request from "supertest";
import app from "../src/app";

describe("Failed Messages Endpoints", () => {
  it("GET /failed should list all failed messages", async () => {
    const res = await request(app).get("/failed");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    // Optionally, check for status property if any failed messages exist
    if (res.body.messages.length > 0) {
      expect(res.body.messages[0]).toHaveProperty("status", "failed");
    }
  });
});
