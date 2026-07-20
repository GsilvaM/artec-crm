import { createClient, ensureMigrationHistory, listAppliedMigrations, listMigrationFiles, migrationLockId } from "./migration-utils";

async function main() {
  const client = await createClient();

  try {
    await ensureMigrationHistory(client);
    await client.query("SELECT pg_advisory_lock($1)", [migrationLockId]);

    const files = await listMigrationFiles();
    const applied = await listAppliedMigrations(client);
    const appliedByVersion = new Map(applied.map((migration) => [migration.version, migration]));

    for (const file of files) {
      const existing = appliedByVersion.get(file.version);

      if (existing) {
        if (existing.checksum !== file.checksum) {
          throw new Error(`Checksum divergente para migration ${file.version}_${file.name}. Nao altere migrations ja aplicadas.`);
        }

        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(file.sql);
        await client.query(
          `
            INSERT INTO crm_internal.migration_history (version, name, checksum)
            VALUES ($1, $2, $3)
          `,
          [file.version, file.name, file.checksum],
        );
        await client.query("COMMIT");
        console.log(`applied ${file.version}_${file.name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    const pending = files.filter((file) => !appliedByVersion.has(file.version));
    if (pending.length === 0) {
      console.log("CRM migrations already up to date.");
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [migrationLockId]).catch(() => undefined);
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
