import { describe, expect, it } from "vitest";
import { isAuvoContactEventType, isAuvoSessionEventType, parseAuvoContactPayload, parseAuvoSessionPayload } from "./auvo-parser.js";

describe("isAuvoSessionEventType", () => {
  it("matches SESSION_* case-insensitively", () => {
    expect(isAuvoSessionEventType("SESSION_NEW")).toBe(true);
    expect(isAuvoSessionEventType("session_update")).toBe(true);
    expect(isAuvoSessionEventType("CONTACT_NEW")).toBe(false);
    expect(isAuvoSessionEventType(null)).toBe(false);
  });
});

describe("parseAuvoSessionPayload", () => {
  it("extracts identification fields from a real-shaped session payload", () => {
    const parsed = parseAuvoSessionPayload({
      date: "2026-07-21T14:18:54.772Z",
      eventType: "SESSION_NEW",
      content: {
        id: "session-123",
        contactId: "contact-456",
        channelType: "whatsapp",
        contactDetails: {
          id: "contact-456",
          name: "Fulano de Tal",
          phonenumber: "5511999990000",
          phonenumberFormatted: "+55 11 99999-0000",
          email: "fulano@example.com",
        },
      },
    });

    expect(parsed).toEqual({
      externalServiceId: "session-123",
      auvoContactId: "contact-456",
      contactName: "Fulano de Tal",
      phoneRaw: "+55 11 99999-0000",
      email: "fulano@example.com",
      channelType: "whatsapp",
    });
  });

  it("falls back to phonenumber when phonenumberFormatted is missing, and returns null for absent fields", () => {
    const parsed = parseAuvoSessionPayload({
      content: {
        id: "session-789",
        contactDetails: { phonenumber: "5511988880000" },
      },
    });

    expect(parsed).toMatchObject({
      externalServiceId: "session-789",
      auvoContactId: null,
      contactName: null,
      phoneRaw: "5511988880000",
      email: null,
      channelType: null,
    });
  });

  it("returns null when the payload does not have a usable content.id", () => {
    expect(parseAuvoSessionPayload({ content: {} })).toBeNull();
    expect(parseAuvoSessionPayload({})).toBeNull();
    expect(parseAuvoSessionPayload(null)).toBeNull();
    expect(parseAuvoSessionPayload("not an object")).toBeNull();
  });
});

describe("isAuvoContactEventType", () => {
  it("matches CONTACT_* case-insensitively", () => {
    expect(isAuvoContactEventType("CONTACT_NEW")).toBe(true);
    expect(isAuvoContactEventType("contact_update")).toBe(true);
    expect(isAuvoContactEventType("SESSION_NEW")).toBe(false);
    expect(isAuvoContactEventType(null)).toBe(false);
  });
});

describe("parseAuvoContactPayload", () => {
  it("extracts identification fields from a real-shaped CONTACT_NEW/CONTACT_UPDATE payload", () => {
    const parsed = parseAuvoContactPayload({
      date: "2026-07-23T00:07:10.019Z",
      eventType: "CONTACT_NEW",
      content: {
        id: "contact-456",
        name: "Fulano de Tal",
        nameWhatsapp: "Fulano",
        email: "fulano@example.com",
        phonenumber: "+55|11999990000",
        phonenumberFormatted: "(11) 99999-0000",
      },
    });

    expect(parsed).toEqual({
      auvoContactId: "contact-456",
      contactName: "Fulano de Tal",
      phoneRaw: "(11) 99999-0000",
      email: "fulano@example.com",
    });
  });

  it("falls back to nameWhatsapp and raw phonenumber when the primary fields are absent", () => {
    const parsed = parseAuvoContactPayload({
      content: { id: "contact-789", nameWhatsapp: "Fulano WhatsApp", phonenumber: "+55|11988880000" },
    });

    expect(parsed).toEqual({
      auvoContactId: "contact-789",
      contactName: "Fulano WhatsApp",
      phoneRaw: "+55|11988880000",
      email: null,
    });
  });

  it("returns null when the payload does not have a usable content.id", () => {
    expect(parseAuvoContactPayload({ content: {} })).toBeNull();
    expect(parseAuvoContactPayload({})).toBeNull();
    expect(parseAuvoContactPayload(null)).toBeNull();
  });
});
