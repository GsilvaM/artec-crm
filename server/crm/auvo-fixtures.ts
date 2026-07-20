import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createWebhookPayloadHash, stableStringify } from "./auvo-webhook.js";

export type CapturedAuvoEvent = {
  id: string;
  eventType: string | null;
  externalEventId: string | null;
  payloadHash: string;
  receivedAt: Date;
  payload: unknown;
};

export type AuvoFixture = {
  sourceEventId: string;
  eventType: string | null;
  externalEventId: string | null;
  originalPayloadHash: string;
  anonymizedPayloadHash: string;
  receivedAt: string;
  anonymizedAt: string;
  payload: unknown;
};

const REDACT_KEYS = /authorization|cookie|token|secret|password|passwd|api[-_]?key|private[-_]?key|service[-_]?role|signature/i;
const EMAIL_KEYS = /email|e-mail|mail/i;
const PHONE_KEYS = /phone|telefone|celular|mobile|whatsapp/i;
const DOCUMENT_KEYS = /cpf|cnpj|documento|document|rg|inscricao|tax/i;
const NAME_KEYS = /^name$|nome|cliente|customer|contato|contact|responsavel|seller|vendedor/i;
const ADDRESS_KEYS = /address|endereco|logradouro|bairro|cidade|city|estado|state|cep|zip|complemento|numero/i;
const TEXT_KEYS = /message|mensagem|observacao|observacoes|description|descricao|note|notes|body|texto|text/i;
const ID_KEYS = /id$|_id$|external/i;

export function buildAuvoFixture(event: CapturedAuvoEvent, anonymizedAt = new Date()): AuvoFixture {
  const payload = anonymizeAuvoPayload(event.payload);
  return {
    sourceEventId: event.id,
    eventType: event.eventType,
    externalEventId: event.externalEventId ? anonymizedId(event.externalEventId) : null,
    originalPayloadHash: event.payloadHash,
    anonymizedPayloadHash: createWebhookPayloadHash(payload),
    receivedAt: event.receivedAt.toISOString(),
    anonymizedAt: anonymizedAt.toISOString(),
    payload,
  };
}

export function anonymizeAuvoPayload(value: unknown, key = "", depth = 0): unknown {
  if (depth > 10) return "[depth-limit]";
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => anonymizeAuvoPayload(item, key, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([nestedKey, nestedValue]) => [nestedKey, anonymizeAuvoPayload(nestedValue, nestedKey, depth + 1)]));
  }

  if (typeof value !== "string" && typeof value !== "number") return value;
  const normalizedKey = key.toLowerCase();
  if (REDACT_KEYS.test(normalizedKey)) return "[redacted]";
  if (EMAIL_KEYS.test(normalizedKey)) return "anon@example.invalid";
  if (PHONE_KEYS.test(normalizedKey)) return "+5500000000000";
  if (DOCUMENT_KEYS.test(normalizedKey)) return "00000000000";
  if (ID_KEYS.test(normalizedKey)) return anonymizedId(String(value));
  if (NAME_KEYS.test(normalizedKey)) return "Pessoa Anonimizada";
  if (ADDRESS_KEYS.test(normalizedKey)) return "Endereco Anonimizado";
  if (TEXT_KEYS.test(normalizedKey)) return "Texto anonimizado";

  if (typeof value === "string" && /\S+@\S+\.\S+/.test(value)) return value.replace(/\S+@\S+\.\S+/g, "anon@example.invalid");
  if (typeof value === "string" && /\d{10,}/.test(value.replace(/\D/g, ""))) return "+5500000000000";
  return value;
}

export async function writeAuvoFixtures(events: CapturedAuvoEvent[], outputDir: string): Promise<{ written: number; outputDir: string }> {
  await mkdir(outputDir, { recursive: true });
  const now = new Date();
  let written = 0;

  for (const event of events) {
    const fixture = buildAuvoFixture(event, now);
    const filename = `${sanitizeFilename(event.eventType ?? "unknown")}-${event.id}.json`;
    await writeFile(join(outputDir, filename), `${stableStringifyPretty(fixture)}\n`, "utf8");
    written += 1;
  }

  return { written, outputDir };
}

function anonymizedId(value: string): string {
  return `anon-${createWebhookPayloadHash(value).slice(0, 12)}`;
}

function sanitizeFilename(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "unknown";
}

function stableStringifyPretty(value: unknown): string {
  return JSON.stringify(JSON.parse(stableStringify(value)), null, 2);
}
