import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appUrl } from "@/lib/verificatiemail";

const NAMEN = [
  "APP_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
] as const;
const origineel: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const naam of NAMEN) {
    origineel[naam] = process.env[naam];
    delete process.env[naam];
  }
});

afterEach(() => {
  for (const naam of NAMEN) {
    if (origineel[naam] === undefined) delete process.env[naam];
    else process.env[naam] = origineel[naam];
  }
});

describe("appUrl", () => {
  it("geeft een vaste APP_URL de voorrang, zonder slash aan het eind", () => {
    process.env.APP_URL = "https://ontwikkelpaden-precon.vercel.app/";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "anders.vercel.app";
    process.env.VERCEL_URL = "deploy-123.vercel.app";
    expect(appUrl()).toBe("https://ontwikkelpaden-precon.vercel.app");
  });

  it("valt zonder APP_URL terug op het vaste productiedomein, niet op de deploy-URL", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL =
      "ontwikkelpaden-precon.vercel.app";
    process.env.VERCEL_URL = "ontwikkelpaden-abc123-tal-leadership.vercel.app";
    expect(appUrl()).toBe("https://ontwikkelpaden-precon.vercel.app");
  });

  it("gebruikt de deploy-URL alleen als er niets anders is", () => {
    process.env.VERCEL_URL = "ontwikkelpaden-abc123-tal-leadership.vercel.app";
    expect(appUrl()).toBe(
      "https://ontwikkelpaden-abc123-tal-leadership.vercel.app",
    );
  });

  it("valt lokaal terug op localhost", () => {
    expect(appUrl()).toBe("http://localhost:3000");
  });
});
