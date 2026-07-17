import { describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/verbeterplanning/agenda/[monthIndex]/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/agenda", () => ({ setAgendaField: vi.fn() }));

import { hasDatabase } from "@/lib/db";
import { setAgendaField } from "@/lib/verbeterplanning/agenda";

function ctx(monthIndex = "0") {
  return { params: Promise.resolve({ monthIndex }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/verbeterplanning/agenda/[monthIndex]", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect((await PATCH(req({ datum: "1 juni" }), ctx())).status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect((await PATCH(req({ datum: "1 juni" }), ctx())).status).toBe(503);
  });

  it("returns 400 for invalid JSON", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    const res = await PATCH(
      new Request("http://x", { method: "PATCH", body: "not-json{" }),
      ctx(),
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when setAgendaField throws unexpectedly", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(setAgendaField).mockRejectedValue(new Error("db"));
    expect((await PATCH(req({ datum: "1 juni" }), ctx())).status).toBe(500);
  });

  it("returns 400 for an out-of-range monthIndex", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect((await PATCH(req({ datum: "1 juni" }), ctx("99"))).status).toBe(400);
  });

  it("returns 400 for an empty body (no fields)", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect((await PATCH(req({}), ctx())).status).toBe(400);
  });

  it("saves a valid field", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(setAgendaField).mockResolvedValue({
      monthIndex: 0,
      datum: "1 juni",
      projecten: "",
      opmerkingen: "",
    });

    const res = await PATCH(req({ datum: "1 juni" }), ctx());
    expect(res.status).toBe(200);
    expect((await res.json()).datum).toBe("1 juni");
  });
});
