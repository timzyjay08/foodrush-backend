import { describe, expect, it } from "vitest";
import { ApiError, calcDeliveryFee, calcServiceFee, fail, parseId, round2 } from "@/lib/http";
import { z } from "zod";

describe("HTTP contract helpers", () => {
  it.each([["0"], ["-1"], ["1.5"], ["abc"], [undefined]])("rejects invalid route id %s", (value) => {
    expect(() => parseId(value)).toThrowError(new ApiError(400, "Invalid id", "INVALID_ID"));
  });

  it("accepts only positive integer route ids", () => {
    expect(parseId("42")).toBe(42);
  });

  it("returns the standard API error envelope for domain errors", async () => {
    const response = fail(new ApiError(409, "Already exists", "CONFLICT"));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Already exists",
      code: "CONFLICT",
    });
  });

  it("returns structured validation details for Zod errors", async () => {
    const schema = z.object({ email: z.string().email() });
    let error: unknown;
    try {
      schema.parse({ email: "not-an-email" });
    } catch (caught) {
      error = caught;
    }

    const response = fail(error);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: "VALIDATION_ERROR",
      details: [{ path: "email" }],
    });
  });

  it("returns a safe response for malformed JSON", async () => {
    const response = fail(new SyntaxError("Unexpected token"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Invalid JSON in request body",
      code: "BAD_JSON",
    });
  });

  it("calculates money using stable two-decimal rounding", () => {
    expect(round2(10.005)).toBe(10.01);
    expect(calcDeliveryFee(3.5)).toBe(850);
    expect(calcServiceFee(1234.56)).toBe(61.73);
  });
});
