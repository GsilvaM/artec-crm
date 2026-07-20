import { writeFile } from "node:fs/promises";
import path from "node:path";
import { migrationsDir } from "./migration-utils";

function normalizeName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function main() {
  const rawName = process.argv.slice(2).join(" ");
  const name = normalizeName(rawName);

  if (!name) {
    throw new Error("Informe o nome da migration. Exemplo: npm run db:migrate:create -- criar_clientes");
  }

  const now = new Date();
  const version = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}`;
  const filePath = path.join(migrationsDir, `${version}_${name}.sql`);

  await writeFile(filePath, "-- Escreva a migration do CRM aqui.\n", { flag: "wx" });
  console.log(filePath);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
