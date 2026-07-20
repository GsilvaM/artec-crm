import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { getDatabaseUrl } from "./env";

const { Client } = pg;

export type MigrationFile = {
  version: string;
  name: string;
  checksum: string;
  sql: string;
  filePath: string;
};

export type AppliedMigration = {
  version: string;
  name: string;
  checksum: string;
  executed_at: Date;
};

const currentFilePath = fileURLToPath(import.meta.url);
export const databaseDir = path.dirname(currentFilePath);
export const migrationsDir = path.join(databaseDir, "migrations");
export const migrationLockId = 9_120_260_720;

export async function createClient() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
  });

  await client.connect();
  return client;
}

export async function ensureMigrationHistory(client: pg.Client): Promise<void> {
  await client.query(`CREATE SCHEMA IF NOT EXISTS crm_internal`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS crm_internal.migration_history (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

export async function listMigrationFiles(): Promise<MigrationFile[]> {
  const filenames = (await readdir(migrationsDir))
    .filter((filename) => /^\d{4}_[a-z0-9_]+\.sql$/.test(filename))
    .sort((first, second) => first.localeCompare(second));

  return Promise.all(
    filenames.map(async (filename) => {
      const filePath = path.join(migrationsDir, filename);
      const sql = await readFile(filePath, "utf8");
      const [version, ...nameParts] = filename.replace(/\.sql$/, "").split("_");
      const name = nameParts.join("_");
      const checksum = createHash("sha256").update(sql).digest("hex");

      return {
        version,
        name,
        checksum,
        sql,
        filePath,
      };
    }),
  );
}

export async function listAppliedMigrations(client: pg.Client): Promise<AppliedMigration[]> {
  const result = await client.query<AppliedMigration>(`
    SELECT version, name, checksum, executed_at
    FROM crm_internal.migration_history
    ORDER BY version ASC
  `);

  return result.rows;
}
