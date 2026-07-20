import { ApiError } from "../errors.js";
import type { CrmPrismaClient } from "./prisma.js";

export type DatabaseHealth = {
  check(): Promise<"connected">;
  close(): Promise<void>;
};

export class PrismaDatabaseHealth implements DatabaseHealth {
  constructor(private readonly prisma: CrmPrismaClient) {}

  async check(): Promise<"connected"> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return "connected";
    } catch {
      throw new ApiError(503, "database_unavailable", "Banco de dados indisponivel.");
    }
  }

  async close(): Promise<void> {
    return undefined;
  }
}
