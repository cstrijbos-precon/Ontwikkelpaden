import { vi } from "vitest";
import { auth } from "@/auth";
import { mockSession } from "@/tests/helpers/session";

export function mockAuth(session: ReturnType<typeof mockSession> | null) {
  vi.mocked(auth).mockResolvedValue(session as never);
}

export function mockAuthUser(email = "u@precon.nl", isAdmin = false) {
  mockAuth(mockSession(email, isAdmin));
}
