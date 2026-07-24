import { loadConfig } from "./config.js";
import { disconnectPrismaClient, getPrismaClient } from "./database/prisma.js";
import { PrismaCrmDataRepository } from "./crm/prisma-repository.js";

const arg = process.argv[2];
if (arg === "--help" || arg === "-h") {
  console.log("Uso: npm.cmd run auvo:signals:backfill -- [limite]");
  console.log("Reaplica parser/intelligence em eventos Auvo historicos apos a migration 0022.");
  process.exit(0);
}

const parsedLimit = arg ? Number(arg) : undefined;
if (parsedLimit !== undefined && (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
  console.error("Limite invalido. Use um numero positivo ou --help.");
  process.exit(1);
}
const limitArg = parsedLimit;

const config = loadConfig();
const prisma = getPrismaClient(config.CRM_DATABASE_URL);
const repository = new PrismaCrmDataRepository(prisma);

try {
  const result = await repository.backfillAuvoParsedSignals(limitArg);
  console.log(JSON.stringify(result));
} finally {
  await repository.close();
  await disconnectPrismaClient();
}
