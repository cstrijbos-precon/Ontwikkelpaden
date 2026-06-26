import type { Session } from "next-auth";

/** Minimal session shape for API route tests (avoids NextAuth middleware type overlap). */
export function mockSession(email = "u@precon.nl", isAdmin = false): Session {
  return {
    user: { email, isAdmin, name: email },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session;
}
