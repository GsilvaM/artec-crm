import { deriveAuvoIntelligence, type AuvoDerivedSignals } from "./auvo-intelligence.js";

export type ParsedAuvoSession = {
  externalServiceId: string;
  auvoContactId: string | null;
  contactName: string | null;
  phoneRaw: string | null;
  email: string | null;
  channelType: string | null;
  signals: ParsedAuvoSignals;
};

export type ParsedAuvoContact = {
  auvoContactId: string;
  contactName: string | null;
  phoneRaw: string | null;
  email: string | null;
  signals: ParsedAuvoSignals;
};

export type ParsedAuvoSignals = {
  origin: string | null;
  utm: unknown;
  tags: unknown[];
  customFields: unknown[];
  classification: string | null;
  departmentId: string | null;
  departmentName: string | null;
  agentId: string | null;
  agentName: string | null;
  sessionStartedAt: string | null;
  sessionEndedAt: string | null;
  firstUserInteractionAt: string | null;
  firstAgentMessageAt: string | null;
  lastInteractionAt: string | null;
  lastMessageText: string | null;
  unreadCount: number | null;
  waitReply: boolean | null;
  windowStatus: string | null;
  derived: AuvoDerivedSignals;
};

export function isAuvoSessionEventType(eventType: string | null): boolean {
  return typeof eventType === "string" && eventType.toUpperCase().startsWith("SESSION_");
}

export function isAuvoContactEventType(eventType: string | null): boolean {
  return typeof eventType === "string" && eventType.toUpperCase().startsWith("CONTACT_");
}

// Formato real observado em producao (CONTACT_NEW/CONTACT_UPDATE), catalogado nesta auditoria:
// payload.content = { id, name, nameWhatsapp, email, phonenumber, phonenumberFormatted, ... }
export function parseAuvoContactPayload(payload: unknown): ParsedAuvoContact | null {
  if (!isRecord(payload)) return null;
  const content = payload.content;
  if (!isRecord(content) || typeof content.id !== "string" || !content.id.trim()) return null;

  return {
    auvoContactId: content.id,
    contactName: firstNonEmptyString(content.name, content.nameWhatsapp),
    phoneRaw: firstNonEmptyString(content.phonenumberFormatted, content.phonenumber),
    email: firstNonEmptyString(content.email),
    signals: parseAuvoSignals(content, {
      contactName: firstNonEmptyString(content.name, content.nameWhatsapp),
      phoneRaw: firstNonEmptyString(content.phonenumberFormatted, content.phonenumber),
      email: firstNonEmptyString(content.email),
      channelType: null,
    }),
  };
}

export function parseAuvoSessionPayload(payload: unknown): ParsedAuvoSession | null {
  if (!isRecord(payload)) return null;
  const content = payload.content;
  if (!isRecord(content) || typeof content.id !== "string" || !content.id.trim()) return null;

  const contactDetails = isRecord(content.contactDetails) ? content.contactDetails : null;
  const phoneRaw = firstNonEmptyString(contactDetails?.phonenumberFormatted, contactDetails?.phonenumber);

  return {
    externalServiceId: content.id,
    auvoContactId: firstNonEmptyString(content.contactId),
    contactName: firstNonEmptyString(contactDetails?.name),
    phoneRaw,
    email: firstNonEmptyString(contactDetails?.email),
    channelType: firstNonEmptyString(content.channelType),
    signals: parseAuvoSignals(content, {
      contactName: firstNonEmptyString(contactDetails?.name),
      phoneRaw,
      email: firstNonEmptyString(contactDetails?.email),
      channelType: firstNonEmptyString(content.channelType),
    }),
  };
}

export function parseAuvoSignals(
  content: unknown,
  context: { contactName: string | null; phoneRaw: string | null; email: string | null; channelType: string | null } = {
    contactName: null,
    phoneRaw: null,
    email: null,
    channelType: null,
  },
): ParsedAuvoSignals {
  const record = isRecord(content) ? content : {};
  const departmentDetails = isRecord(record.departmentDetails) ? record.departmentDetails : null;
  const agentDetails = isRecord(record.agentDetails) ? record.agentDetails : null;
  const signals: Omit<ParsedAuvoSignals, "derived"> = {
    origin: firstNonEmptyString(record.origin),
    utm: isRecord(record.utm) ? record.utm : {},
    tags: Array.isArray(record.tags) ? record.tags.slice(0, 50) : [],
    customFields: Array.isArray(record.customFieldValues) ? record.customFieldValues.slice(0, 100) : [],
    classification: firstNonEmptyString(record.classification),
    departmentId: firstNonEmptyString(record.departmentId, departmentDetails?.id),
    departmentName: firstNonEmptyString(departmentDetails?.name, departmentDetails?.title),
    agentId: firstNonEmptyString(record.userId, agentDetails?.id),
    agentName: firstNonEmptyString(agentDetails?.name, agentDetails?.email),
    sessionStartedAt: firstIsoDateString(record.startAt, record.createdAt),
    sessionEndedAt: firstIsoDateString(record.endAt),
    firstUserInteractionAt: firstIsoDateString(record.firstUserInteractionAt),
    firstAgentMessageAt: firstIsoDateString(record.firstAgentMessageAt),
    lastInteractionAt: firstIsoDateString(record.lastInteractionDate, record.updatedAt),
    lastMessageText: firstNonEmptyString(record.lastMessageText),
    unreadCount: coerceNumber(record.unreadCount),
    waitReply: coerceBoolean(record.waitReply),
    windowStatus: firstNonEmptyString(record.windowStatus, record.status),
  };
  return {
    ...signals,
    derived: deriveAuvoIntelligence({
      ...context,
      phoneNormalized: normalizePhoneDigits(context.phoneRaw),
      signals,
    }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstNonEmptyString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function firstIsoDateString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value !== "string" || !value.trim()) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

function normalizePhoneDigits(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits || null;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && /^-?\d+(\.\d+)?$/.test(value.trim())) return Number(value);
  return null;
}

function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}
