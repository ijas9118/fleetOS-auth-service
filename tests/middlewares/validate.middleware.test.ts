import express from "express";
import request from "supertest";
import { z } from "zod";

import { MESSAGES } from "@/config/constants/messages.constant";
import { STATUS_CODES } from "@/config/constants/status-codes.constant";
import { validate } from "@/middlewares/validate.middleware";

const schema = z.object({
  email: z.string().email(),
});

const app = express();
app.use(express.json());
app.post("/test", validate(schema), (req, res) => res.json({ success: true }));

describe("validate middleware (integration)", () => {
  it("should pass valid body", async () => {
    const res = await request(app).post("/test").send({ email: "user@example.com" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("should reject invalid body", async () => {
    const mockTree = { properties: { email: "Invalid email" } };
    jest.spyOn(z, "treeifyError").mockReturnValue(mockTree as any);

    const res = await request(app).post("/test").send({ email: "not-an-email" });
    expect(res.status).toBe(STATUS_CODES.BAD_REQUEST);
    expect(res.body).toMatchObject({
      message: MESSAGES.ERROR.BAD_REQUEST,
      errors: mockTree.properties,
    });
  });
});
