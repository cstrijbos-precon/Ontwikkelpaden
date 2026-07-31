import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/users/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

describe("GET /api/users", () => {
  const originalAppUsers = process.env.APP_USERS;

  afterEach(() => {
    process.env.APP_USERS = originalAppUsers;
  });

  it("returns 401 without session", async () => {
    mockAuth(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns known account emails, sorted", async () => {
    mockAuthUser();
    process.env.APP_USERS =
      "zeb@precon.nl:$2b$12$abc, alice@precon.nl:$2b$12$def";

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.emails).toEqual(["alice@precon.nl", "zeb@precon.nl"]);
  });
});
