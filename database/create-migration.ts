import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { migrationsDir } from "./migration-utils";

const VERSION_PATTERN = /^(\d{4})_[a-z0-9_]+\.sql$/;

function normalizeName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function nextVersion(): Promise<string> {
  const filenames = await readdir(migrationsDir);
  const highest = filenames.reduce((max, filename) => {
    const match = VERSION_PATTERN.exec(filename);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return String(highest + 1).padStart(4, "0");
}

async function main() {
  const rawName = process.argv.slice(2).join(" ");
  const name = normalizeName(rawName);

  if (!name) {
    throw new Error("Informe o nome da migration. Exemplo: npm run db:migrate:create -- criar_clientes");
  }

  const version = await nextVersion();
  const filePath = path.join(migrationsDir, `${version}_${name}.sql`);

  await writeFile(filePath, "-- Escreva a migration do CRM aqui.\n", { flag: "wx" });
  console.log(filePath);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
