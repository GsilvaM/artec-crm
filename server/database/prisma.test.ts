import { describe, expect, it } from "vitest";
import { PrismaDatabaseHealth } from "./health.js";
import { createPrismaClient } from "./prisma.js";

describe("Prisma database wiring", () => {
  it("rejects initialization without CRM_DATABASE_URL", () => {
    expect(() => createPrismaClient(undefined)).toThrow("CRM_DATABASE_URL_missing");
  });

  it("sanitizes database health failures", async () => {
    const health = new PrismaDatabaseHealth({
      async $queryRaw() {
        throw new Error("driver secret details");
      },
    } as never);

    await expect(health.check()).rejects.toMatchObject({
      statusCode: 503,
      code: "database_unavailable",
      message: "Banco de dados indisponivel.",
    });
  });
});
