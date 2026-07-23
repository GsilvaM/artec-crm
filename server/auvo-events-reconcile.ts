import { loadConfig } from "./config.js";
import { disconnectPrismaClient, getPrismaClient } from "./database/prisma.js";
import { PrismaCrmDataRepository } from "./crm/prisma-repository.js";

const config = loadConfig();
const prisma = getPrismaClient(config.CRM_DATABASE_URL);
const repository = new PrismaCrmDataRepository(prisma);

const limitArg = process.argv[2] ? Number(process.argv[2]) : undefined;

try {
  const result = await repository.reconcileAuvoWebhookEvents(limitArg);
  console.log(JSON.stringify(result));
} finally {
  await repository.close();
  await disconnectPrismaClient();
}
