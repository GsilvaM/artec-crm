import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.CRM_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Defina CRM_DATABASE_URL para executar migrations do CRM.");
  }

  return databaseUrl;
}
