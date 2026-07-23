export type ParsedAuvoSession = {
  externalServiceId: string;
  auvoContactId: string | null;
  contactName: string | null;
  phoneRaw: string | null;
  email: string | null;
  channelType: string | null;
};

export type ParsedAuvoContact = {
  auvoContactId: string;
  contactName: string | null;
  phoneRaw: string | null;
  email: string | null;
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
