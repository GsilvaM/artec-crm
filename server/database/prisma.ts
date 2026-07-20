import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

export type CrmPrismaClient = PrismaClient;

let prisma: PrismaClient | null = null;

export function createPrismaClient(connectionString: string | undefined): PrismaClient {
  if (!connectionString) {
    throw new Error("CRM_DATABASE_URL_missing");
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({ adapter });
}

export function getPrismaClient(connectionString: string | undefined): PrismaClient {
  prisma ??= createPrismaClient(connectionString);
  return prisma;
}

export async function disconnectPrismaClient(): Promise<void> {
  await prisma?.$disconnect();
  prisma = null;
}
