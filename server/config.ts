import { z } from "zod";
import { loadLocalEnv } from "./load-env.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CRM_SERVER_HOST: z.string().default("0.0.0.0"),
  CRM_PORT: z.coerce.number().int().positive().default(4100),
  CRM_ALLOWED_ORIGINS: z.string().min(1),
  CRM_DATABASE_URL: z.string().min(1),
  CRM_DATABASE_POOL_URL: z.string().min(1).optional(),
  CRM_SUPABASE_URL: z.string().url(),
  CRM_SUPABASE_ANON_KEY: z.string().min(1),
  AUVO_WEBHOOK_SECRET: z.string().min(8).optional(),
  CRM_LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type ServerConfig = z.infer<typeof envSchema> & {
  corsOrigins: string[];
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  loadLocalEnv();
  const parsed = envSchema.parse(env);
  const corsOrigins = parsed.CRM_ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    ...parsed,
    corsOrigins,
  };
}
