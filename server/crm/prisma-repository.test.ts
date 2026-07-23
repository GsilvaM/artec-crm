import { describe, expect, it } from "vitest";
import { buildCanonicalContactTitle, isOutOfScopeAuvoEventType, isTestFixtureName, startOfLocalDay } from "./prisma-repository.js";

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

  it("allows SESSION_* events: real capture on 2026-07-21 showed these are the only events firing for atendimento criado/alterado/concluido when just the 5 MVP events are enabled in Auvo, so they are not out of scope", () => {
    expect(isOutOfScopeAuvoEventType("SESSION_NEW")).toBe(false);
    expect(isOutOfScopeAuvoEventType("SESSION_UPDATE")).toBe(false);
    expect(isOutOfScopeAuvoEventType("SESSION_COMPLETE")).toBe(false);
  });

  it("blocks message, payment, card, panel and template events observed for real in production", () => {
    expect(isOutOfScopeAuvoEventType("MESSAGE_SENT")).toBe(true);
    expect(isOutOfScopeAuvoEventType("MESSAGE_RECEIVED")).toBe(true);
    expect(isOutOfScopeAuvoEventType("MESSAGE_UPDATED")).toBe(true);
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

describe("isTestFixtureName", () => {
  it("flags the exact naming convention already used by e2e/customer-and-opportunity.spec.ts", () => {
    expect(isTestFixtureName("E2E Cliente mrxedk6o")).toBe(true);
    expect(isTestFixtureName("E2E Oportunidade mrxedk6o")).toBe(true);
  });

  it("flags manual homologacao records regardless of case or position", () => {
    expect(isTestFixtureName("Cliente Homologacao Marco 4 m4-mrtl7m5y")).toBe(true);
    expect(isTestFixtureName("cliente homologação teste")).toBe(true);
  });

  it("does not flag real customer or opportunity names", () => {
    expect(isTestFixtureName("Aldo Campanha Filho")).toBe(false);
    expect(isTestFixtureName("Instalacao de ar-condicionado - Sala comercial")).toBe(false);
  });
});

describe("startOfLocalDay (America/Sao_Paulo, UTC-3, sem horario de verao desde 2019)", () => {
  it("classifies a moment just before midnight in Sao Paulo as still the earlier calendar day, even though it is already the next day in UTC", () => {
    // 23:30 em Sao Paulo em 22/07 = 02:30 UTC em 23/07 — sem correcao de fuso, getFullYear/getMonth/getDate
    // do processo Node em UTC leriam isso como dia 23, nao 22 (o bug real encontrado na auditoria).
    const almostMidnightSaoPaulo = new Date("2026-07-23T02:30:00.000Z");
    const start = startOfLocalDay(almostMidnightSaoPaulo);
    expect(start.toISOString()).toBe("2026-07-22T03:00:00.000Z"); // 00:00 em Sao Paulo em 22/07
  });

  it("classifies a moment just after midnight in Sao Paulo as the new calendar day, even though UTC has not rolled over yet", () => {
    // 00:30 em Sao Paulo em 23/07 = 03:30 UTC em 23/07.
    const justAfterMidnightSaoPaulo = new Date("2026-07-23T03:30:00.000Z");
    const start = startOfLocalDay(justAfterMidnightSaoPaulo);
    expect(start.toISOString()).toBe("2026-07-23T03:00:00.000Z"); // 00:00 em Sao Paulo em 23/07
  });

  it("is idempotent exactly at the Sao Paulo day boundary", () => {
    const exactBoundary = new Date("2026-07-23T03:00:00.000Z");
    expect(startOfLocalDay(exactBoundary).toISOString()).toBe(exactBoundary.toISOString());
  });
});

describe("buildCanonicalContactTitle", () => {
  it("prefers the contact name when available", () => {
    expect(buildCanonicalContactTitle("Lindamar", "5527996152200")).toBe("Lindamar");
  });

  it("falls back to a formatted phone number when there is no contact name", () => {
    expect(buildCanonicalContactTitle(null, "5527996152200")).toBe("(27) 99615-2200");
  });

  it("falls back to a human label when neither name nor phone is available", () => {
    expect(buildCanonicalContactTitle(null, null)).toBe("Contato sem nome");
  });
});
