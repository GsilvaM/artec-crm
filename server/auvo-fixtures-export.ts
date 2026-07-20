import { resolve } from "node:path";
import { loadConfig } from "./config.js";
import { writeAuvoFixtures, type CapturedAuvoEvent } from "./crm/auvo-fixtures.js";
import { disconnectPrismaClient, getPrismaClient } from "./database/prisma.js";

type CapturedAuvoEventRow = {
  id: string;
  event_type: string | null;
  external_event_id: string | null;
  payload_hash: string;
  received_at: Date;
  raw_payload_json: unknown;
};

const config = loadConfig();
const prisma = getPrismaClient(config.CRM_DATABASE_URL);
const outputDir = resolve(process.cwd(), "tmp", "auvo-fixtures");

try {
  const rows = await prisma.$queryRaw<CapturedAuvoEventRow[]>`
    SELECT id, event_type, external_event_id, payload_hash, received_at, raw_payload_json
    FROM crm_internal.auvo_webhook_events
    WHERE COALESCE(raw_payload_json->>'homologation', 'false') <> 'true'
    ORDER BY received_at ASC, id ASC
    LIMIT 50
  `;

  const events: CapturedAuvoEvent[] = rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    externalEventId: row.external_event_id,
    payloadHash: row.payload_hash,
    receivedAt: row.received_at,
    payload: row.raw_payload_json,
  }));
  const result = await writeAuvoFixtures(events, outputDir);

  console.log(JSON.stringify({ ...result, note: "fixtures_are_anonymized_and_local_only" }, null, 2));
} finally {
  await disconnectPrismaClient();
}
