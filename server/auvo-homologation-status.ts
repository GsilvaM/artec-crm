import { loadConfig } from "./config.js";
import { disconnectPrismaClient, getPrismaClient } from "./database/prisma.js";

type StatusRow = {
  total_events: bigint;
  synthetic_events: bigint;
  likely_real_events: bigint;
  received_events: bigint;
  processing_events: bigint;
  failed_events: bigint;
  ignored_events: bigint;
  processed_events: bigint;
  latest_received_at: Date | null;
  latest_likely_real_received_at: Date | null;
};

const config = loadConfig();
const prisma = getPrismaClient(config.CRM_DATABASE_URL);

try {
  const [row] = await prisma.$queryRaw<StatusRow[]>`
    SELECT
      count(*)::bigint AS total_events,
      count(*) FILTER (WHERE raw_payload_json->>'homologation' = 'true')::bigint AS synthetic_events,
      count(*) FILTER (WHERE COALESCE(raw_payload_json->>'homologation', 'false') <> 'true')::bigint AS likely_real_events,
      count(*) FILTER (WHERE status = 'received')::bigint AS received_events,
      count(*) FILTER (WHERE status = 'processing')::bigint AS processing_events,
      count(*) FILTER (WHERE status = 'failed')::bigint AS failed_events,
      count(*) FILTER (WHERE status = 'ignored')::bigint AS ignored_events,
      count(*) FILTER (WHERE status = 'processed')::bigint AS processed_events,
      max(received_at) AS latest_received_at,
      max(received_at) FILTER (WHERE COALESCE(raw_payload_json->>'homologation', 'false') <> 'true') AS latest_likely_real_received_at
    FROM crm_internal.auvo_webhook_events
  `;

  const likelyRealEvents = toNumber(row?.likely_real_events);

  const output = {
    webhookSecretConfigured: Boolean(config.AUVO_WEBHOOK_SECRET),
    totalEvents: toNumber(row?.total_events),
    syntheticEvents: toNumber(row?.synthetic_events),
    likelyRealEvents,
    pendingEvents: toNumber(row?.received_events) + toNumber(row?.processing_events),
    failedEvents: toNumber(row?.failed_events),
    ignoredEvents: toNumber(row?.ignored_events),
    processedEvents: toNumber(row?.processed_events),
    latestReceivedAt: row?.latest_received_at?.toISOString() ?? null,
    latestLikelyRealReceivedAt: row?.latest_likely_real_received_at?.toISOString() ?? null,
    nextOfficialStep: likelyRealEvents > 0 ? "analyze_real_auvo_payloads" : "capture_real_auvo_payloads",
  };

  console.log(JSON.stringify(output, null, 2));
} finally {
  await disconnectPrismaClient();
}

function toNumber(value: bigint | number | null | undefined): number {
  if (typeof value === "bigint") return Number(value);
  return value ?? 0;
}
