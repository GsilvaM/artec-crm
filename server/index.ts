import { buildCrmServer } from "./bootstrap.js";
import { loadConfig } from "./config.js";
import { disconnectPrismaClient } from "./database/prisma.js";

const config = loadConfig();
const app = buildCrmServer(config);

let isClosing = false;

async function closeGracefully(signal: NodeJS.Signals) {
  if (isClosing) return;
  isClosing = true;

  app.log.info({ signal }, "crm_api_shutdown_started");
  await app.close();
  await disconnectPrismaClient();
  app.log.info({ signal }, "crm_api_shutdown_finished");
}

process.on("SIGINT", (signal) => {
  void closeGracefully(signal);
});

process.on("SIGTERM", (signal) => {
  void closeGracefully(signal);
});

try {
  await app.listen({ host: config.CRM_SERVER_HOST, port: config.CRM_PORT });
} catch (error) {
  app.log.fatal({ err: error }, "crm_api_start_failed");
  process.exitCode = 1;
}
