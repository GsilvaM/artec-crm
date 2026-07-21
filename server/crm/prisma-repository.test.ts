import { describe, expect, it } from "vitest";
import { isOutOfScopeAuvoEventType } from "./prisma-repository.js";

describe("isOutOfScopeAuvoEventType", () => {
  it("allows the approved MVP event types", () => {
    expect(isOutOfScopeAuvoEventType("CONTACT_NEW")).toBe(false);
    expect(isOutOfScopeAuvoEventType("CONTACT_UPDATE")).toBe(false);
    expect(isOutOfScopeAuvoEventType(null)).toBe(false);
  });

  it("allows unrecognized event types instead of guessing attendance naming", () => {
    expect(isOutOfScopeAuvoEventType("ATTENDANCE_NEW")).toBe(false);
    expect(isOutOfScopeAuvoEventType("attendance.created")).toBe(false);
  });

  it("blocks message, session, payment, card, panel and template events observed for real in production", () => {
    expect(isOutOfScopeAuvoEventType("MESSAGE_SENT")).toBe(true);
    expect(isOutOfScopeAuvoEventType("MESSAGE_RECEIVED")).toBe(true);
    expect(isOutOfScopeAuvoEventType("MESSAGE_UPDATED")).toBe(true);
    expect(isOutOfScopeAuvoEventType("SESSION_NEW")).toBe(true);
    expect(isOutOfScopeAuvoEventType("SESSION_UPDATE")).toBe(true);
    expect(isOutOfScopeAuvoEventType("PAYMENT_CREATED")).toBe(true);
    expect(isOutOfScopeAuvoEventType("payment_updated")).toBe(true);
    expect(isOutOfScopeAuvoEventType("CARD_MOVED")).toBe(true);
    expect(isOutOfScopeAuvoEventType("PANEL_NOTE_CREATED")).toBe(true);
    expect(isOutOfScopeAuvoEventType("TEMPLATE_CREATED")).toBe(true);
  });

  it("blocks contact tag updates specifically without blocking other contact events", () => {
    expect(isOutOfScopeAuvoEventType("CONTACT_TAG_UPDATE")).toBe(true);
    expect(isOutOfScopeAuvoEventType("contact_tag_update")).toBe(true);
  });
});
