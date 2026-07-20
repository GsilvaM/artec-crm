import { PgMembershipRepository } from "./auth/membership-repository.js";
import { SupabaseTokenVerifier } from "./auth/supabase-token-verifier.js";
import { buildServer } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = buildServer({
  config,
  authVerifier: new SupabaseTokenVerifier(config.CRM_SUPABASE_URL, config.CRM_SUPABASE_ANON_KEY),
  membershipRepository: new PgMembershipRepository(config.CRM_DATABASE_URL),
});

let isClosing = false;

async function closeGracefully(signal: NodeJS.Signals) {
  if (isClosing) return;
  isClosing = true;

  app.log.info({ signal }, "crm_api_shutdown_started");
  await app.close();
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
