import { createHash } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import type { AuvoWebhookStatus } from "./types.js";

export const AUVO_WEBHOOK_MAX_BYTES = 256 * 1024;

const ALLOWED_HEADER_NAMES = new Set([
  "content-type",
  "user-agent",
  "content-length",
  "x-request-id",
  "x-auvo-signature",
  "x-auvo-signature-256",
]);

const SENSITIVE_KEY_PATTERN = /authorization|cookie|token|secret|password|passwd|api[-_]?key|private[-_]?key|service[-_]?role/i;
const VALID_STATUSES: AuvoWebhookStatus[] = ["received", "processing", "processed", "ignored", "failed"];

export function sanitizeWebhookHeaders(headers: IncomingHttpHeaders | Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [rawName, rawValue] of Object.entries(headers)) {
    const name = rawName.toLowerCase();
    if (!ALLOWED_HEADER_NAMES.has(name)) continue;
    if (rawValue === undefined) continue;
    const value = Array.isArray(rawValue) ? rawValue.join(", ") : String(rawValue);
    sanitized[name] = value.slice(0, 500);
  }

  return sanitized;
}

export function sanitizeWebhookPayload(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[depth-limit]";
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeWebhookPayload(item, depth + 1));

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    output[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeWebhookPayload(nested, depth + 1);
  }
  return output;
}

export function createWebhookPayloadHash(payload: unknown): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
    .join(",")}}`;
}

export function normalizeAuvoWebhookStatus(status: string): AuvoWebhookStatus {
  return VALID_STATUSES.includes(status as AuvoWebhookStatus) ? (status as AuvoWebhookStatus) : "failed";
}
