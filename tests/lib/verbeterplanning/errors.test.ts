import { describe, expect, it } from "vitest";
import {
  KpiLimitError,
  MilestoneLimitError,
  ProjectCodeExistsError,
  ProjectNotFoundError,
  UpdateNotFoundError,
  verbeterplanningErrorResponse,
} from "@/lib/verbeterplanning/errors";

describe("verbeterplanningErrorResponse", () => {
  it("maps not-found errors to 404", async () => {
    const res = verbeterplanningErrorResponse(new ProjectNotFoundError());
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Project niet gevonden");
  });

  it("maps update-not-found to 404", () => {
    expect(
      verbeterplanningErrorResponse(new UpdateNotFoundError()).status,
    ).toBe(404);
  });

  it("maps conflict errors to 409", () => {
    expect(
      verbeterplanningErrorResponse(new ProjectCodeExistsError("KMO01")).status,
    ).toBe(409);
    expect(
      verbeterplanningErrorResponse(new MilestoneLimitError()).status,
    ).toBe(409);
    expect(verbeterplanningErrorResponse(new KpiLimitError()).status).toBe(409);
  });

  it("maps unknown errors to a generic 500", async () => {
    const res = verbeterplanningErrorResponse(new Error("iets anders"));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Interne fout");
  });
});
