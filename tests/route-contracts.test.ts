import "dotenv/config";
import { describe, expect, it } from "vitest";
import { DELETE as deleteMenuItem } from "@/app/api/menu-items/[id]/route";
import { GET as health } from "@/app/api/health/route";

describe("route contracts", () => {
  it("rejects an invalid menu item id before authentication or database access", async () => {
    const response = await deleteMenuItem(
      new Request("http://localhost/api/menu-items/not-an-id", { method: "DELETE" }),
      { params: Promise.resolve({ id: "not-an-id" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Invalid id",
      code: "INVALID_ID",
    });
  });

  it("requires authentication for a valid protected menu item id", async () => {
    const response = await deleteMenuItem(
      new Request("http://localhost/api/menu-items/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: "UNAUTHORIZED",
    });
  });

  it("returns a liveness response without requiring database readiness", async () => {
    const response = await health();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toEqual(expect.any(String));
    expect(body.uptimeSeconds).toEqual(expect.any(Number));
  });
});
