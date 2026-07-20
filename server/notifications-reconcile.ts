import { loadConfig } from "./config.js";
import { disconnectPrismaClient, getPrismaClient } from "./database/prisma.js";
import { PrismaCrmDataRepository } from "./crm/prisma-repository.js";

const config = loadConfig();
const prisma = getPrismaClient(config.CRM_DATABASE_URL);
const repository = new PrismaCrmDataRepository(prisma);

try {
  const result = await repository.reconcileNotifications({ id: "00000000-0000-4000-8000-000000000001", role: "gestor" });
  console.log(JSON.stringify(result));
} finally {
  await repository.close();
  await disconnectPrismaClient();
}
