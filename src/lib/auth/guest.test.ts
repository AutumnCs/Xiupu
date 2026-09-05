import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { requireGuest } from "./guest";

describe("requireGuest", () => {
  it("creates an HTTP-only guest cookie when absent", () => {
    const result = requireGuest(new NextRequest("http://localhost"));
    expect(result.guestId).toMatch(/^guest_/);
    expect(result.response?.cookies.get("xiupu_guest_id")?.httpOnly).toBe(true);
  });

  it("reuses a valid guest cookie", () => {
    const result = requireGuest(new NextRequest("http://localhost", { headers: { cookie: "xiupu_guest_id=guest_existing_12345678" } }));
    expect(result.guestId).toBe("guest_existing_12345678");
    expect(result.response).toBeUndefined();
  });
});
