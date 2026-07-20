import { createClient, ensureMigrationHistory, listAppliedMigrations, listMigrationFiles } from "./migration-utils";

async function main() {
  const client = await createClient();

  try {
    await ensureMigrationHistory(client);

    const files = await listMigrationFiles();
    const applied = await listAppliedMigrations(client);
    const appliedByVersion = new Map(applied.map((migration) => [migration.version, migration]));

    for (const file of files) {
      const existing = appliedByVersion.get(file.version);

      if (!existing) {
        console.log(`pending ${file.version}_${file.name}`);
        continue;
      }

      const status = existing.checksum === file.checksum ? "applied" : "checksum-mismatch";
      console.log(`${status} ${file.version}_${file.name}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
