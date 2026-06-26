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
});

describe("findUserByEmail", () => {
  const original = process.env.APP_USERS;

  afterEach(() => {
    process.env.APP_USERS = original;
  });

  it("finds user by normalized email", () => {
    process.env.APP_USERS = "user@precon.nl:$2b$12$hashvaluehere";
    expect(findUserByEmail("  USER@precon.nl ")).toEqual({
      email: "user@precon.nl",
      passwordHash: "$2b$12$hashvaluehere",
    });
  });

  it("returns undefined when not found", () => {
    process.env.APP_USERS = "";
    expect(findUserByEmail("missing@precon.nl")).toBeUndefined();
  });
});
