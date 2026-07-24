import { loadConfig } from "./config.js";
import { disconnectPrismaClient, getPrismaClient } from "./database/prisma.js";
import { buildAuvoCustomerMatchReport } from "./crm/auvo-customer-match.js";

const arg = process.argv[2];
if (arg === "--help" || arg === "-h") {
  console.log("Uso: npm.cmd run auvo:customers:match-dry-run -- [limite]");
  console.log("Gera candidatos explicaveis para vincular clientes CRM a contatos Auvo. Nao grava dados.");
  process.exit(0);
}

const parsedLimit = arg ? Number(arg) : undefined;
if (parsedLimit !== undefined && (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
  console.error("Limite invalido. Use um numero positivo ou --help.");
  process.exit(1);
}

const limit = parsedLimit ? Math.trunc(parsedLimit) : 500;
const config = loadConfig();
const prisma = getPrismaClient(config.CRM_DATABASE_URL);

try {
  const [customers, signals] = await Promise.all([
    prisma.customer.findMany({
      where: { archivedAt: null, isTestFixture: false },
      select: { id: true, nome: true, telefoneNormalizado: true, email: true, auvoContactId: true },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit,
    }),
    prisma.auvoContactSignal.findMany({
      select: { auvoContactId: true, contactName: true, phoneNormalized: true, email: true, lastInteractionAt: true },
      orderBy: [{ lastInteractionAt: "desc" }, { auvoContactId: "asc" }],
      take: limit,
    }),
  ]);

  const report = buildAuvoCustomerMatchReport(
    customers.map((customer) => ({
      id: customer.id,
      name: customer.nome,
      phoneNormalized: customer.telefoneNormalizado,
      email: customer.email,
      auvoContactId: customer.auvoContactId,
    })),
    signals.map((signal) => ({
      auvoContactId: signal.auvoContactId,
      contactName: signal.contactName,
      phoneNormalized: signal.phoneNormalized,
      email: signal.email,
      lastInteractionAt: signal.lastInteractionAt?.toISOString() ?? null,
    })),
  );

  console.log(JSON.stringify(report, null, 2));
} finally {
  await disconnectPrismaClient();
}
