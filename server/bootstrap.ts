import type { FastifyInstance } from "fastify";
import { PrismaMembershipRepository } from "./auth/prisma-membership-repository.js";
import { SupabaseTokenVerifier } from "./auth/supabase-token-verifier.js";
import { buildServer } from "./app.js";
import { loadConfig, type ServerConfig } from "./config.js";
import { PrismaDatabaseHealth } from "./database/health.js";
import { getPrismaClient } from "./database/prisma.js";
import { PrismaCrmDataRepository } from "./crm/prisma-repository.js";

export function buildCrmServer(config: ServerConfig = loadConfig()): FastifyInstance {
  const prisma = getPrismaClient(config.CRM_DATABASE_POOL_URL ?? config.CRM_DATABASE_URL);

  return buildServer({
    config,
    authVerifier: new SupabaseTokenVerifier(config.CRM_SUPABASE_URL, config.CRM_SUPABASE_ANON_KEY),
    membershipRepository: new PrismaMembershipRepository(prisma),
    crmRepository: new PrismaCrmDataRepository(prisma),
    databaseHealth: new PrismaDatabaseHealth(prisma),
  });
}
