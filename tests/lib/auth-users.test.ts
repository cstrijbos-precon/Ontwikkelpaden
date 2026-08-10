import { afterEach, describe, expect, it } from "vitest";
import { findUserByEmail, parseAppUsers } from "@/lib/auth-users";

describe("parseAppUsers", () => {
  const original = process.env.APP_USERS;

  afterEach(() => {
    process.env.APP_USERS = original;
  });

  it("parses valid user entries", () => {
    process.env.APP_USERS =
      "alice@precon.nl:$2b$12$abcdefghijklmnopqrstuv, bob@precon.nl:$2b$12$xyz";
    const users = parseAppUsers();
    expect(users).toHaveLength(2);
    expect(users[0]?.email).toBe("alice@precon.nl");
    expect(users[1]?.email).toBe("bob@precon.nl");
  });

  it("skips malformed entries", () => {
    process.env.APP_USERS = "no-colon, :nohash, valid@precon.nl:notbcrypt";
    expect(parseAppUsers()).toHaveLength(0);
  });

  it("vult de lijst aan met APP_USERS_EXTRA", () => {
    process.env.APP_USERS = "alice@precon.nl:$2b$12$aaa";
    process.env.APP_USERS_EXTRA = "nieuw@precon.nl:$2b$12$bbb";

    const emails = parseAppUsers().map((u) => u.email);
    expect(emails).toEqual(["alice@precon.nl", "nieuw@precon.nl"]);

    process.env.APP_USERS_EXTRA = "";
  });

  it("werkt ook als alleen APP_USERS_EXTRA gevuld is", () => {
    process.env.APP_USERS = "";
    process.env.APP_USERS_EXTRA = "solo@precon.nl:$2b$12$ccc";
    expect(parseAppUsers()).toHaveLength(1);
    process.env.APP_USERS_EXTRA = "";
  });

  it("laat het account uit APP_USERS winnen bij een dubbel adres", () => {
    process.env.APP_USERS = "dubbel@precon.nl:$2b$12$origineel";
    process.env.APP_USERS_EXTRA = "dubbel@precon.nl:$2b$12$nieuwer";

    const users = parseAppUsers();
    expect(users).toHaveLength(1);
    expect(users[0]?.passwordHash).toBe("$2b$12$origineel");

    process.env.APP_USERS_EXTRA = "";
  });
});

describe("findUserByEmail", () => {
  const original = process.env.APP_USERS;

  afterEach(() => {
    process.env.APP_USERS = original;
  });

  it("finds user by normalized email", async () => {
    process.env.APP_USERS = "user@precon.nl:$2b$12$hashvaluehere";
    await expect(findUserByEmail("  USER@precon.nl ")).resolves.toEqual({
      email: "user@precon.nl",
      passwordHash: "$2b$12$hashvaluehere",
    });
  });

  it("returns undefined when not found", async () => {
    process.env.APP_USERS = "";
    await expect(findUserByEmail("missing@precon.nl")).resolves.toBeUndefined();
  });
});
