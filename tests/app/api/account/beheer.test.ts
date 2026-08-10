import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET } from "@/app/api/account/beheer/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

const listMock = vi.fn();
const verwijderMock = vi.fn();

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/db", () => ({
  sql: vi.fn(),
  hasDatabase: () => true,
}));

vi.mock("@/lib/app-users-store", () => ({
  listOpgeslagenAccounts: () => listMock(),
  verwijderOpgeslagenGebruiker: (...args: unknown[]) => verwijderMock(...args),
}));

function verzoek(body: unknown) {
  return new Request("http://localhost/api/account/beheer", {
    method: "DELETE",
    body: JSON.stringify(body),
  });
}

const origineleUsers = process.env.APP_USERS;

beforeEach(() => {
  listMock.mockReset().mockResolvedValue([]);
  verwijderMock.mockReset().mockResolvedValue(true);
  process.env.APP_USERS = "";
});

afterEach(() => {
  process.env.APP_USERS = origineleUsers;
});

describe("account-beheer", () => {
  it("weigert wie niet is ingelogd", async () => {
    mockAuth(null);
    expect((await GET()).status).toBe(401);
  });

  it("weigert een gewone gebruiker", async () => {
    mockAuthUser("gewoon@precon.nl", false);
    expect((await GET()).status).toBe(403);

    mockAuthUser("gewoon@precon.nl", false);
    const res = await DELETE(verzoek({ email: "roos@precongroup.com" }));
    expect(res.status).toBe(403);
    expect(verwijderMock).not.toHaveBeenCalled();
  });

  it("geeft een adres vrij voor een beheerder", async () => {
    mockAuthUser("beheer@precon.nl", true);
    const res = await DELETE(verzoek({ email: "Roos@precongroup.com" }));

    expect(res.status).toBe(200);
    expect(verwijderMock).toHaveBeenCalledWith("roos@precongroup.com");
  });

  it("meldt netjes dat een adres onbekend is", async () => {
    verwijderMock.mockResolvedValue(false);
    mockAuthUser("beheer@precon.nl", true);

    const res = await DELETE(verzoek({ email: "niemand@precongroup.com" }));
    expect(res.status).toBe(404);
  });

  it("raakt accounts uit de serverinstellingen niet aan", async () => {
    process.env.APP_USERS = "kim@precongroup.com:$2b$12$bestaandehash";
    mockAuthUser("beheer@precon.nl", true);

    const res = await DELETE(verzoek({ email: "kim@precongroup.com" }));
    expect(res.status).toBe(409);
    expect(verwijderMock).not.toHaveBeenCalled();
  });
});
