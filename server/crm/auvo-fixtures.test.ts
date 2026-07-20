import { describe, expect, it } from "vitest";
import { anonymizeAuvoPayload, buildAuvoFixture } from "./auvo-fixtures.js";

describe("Auvo fixture anonymization", () => {
  it("redacts credentials and replaces personal data before fixture export", () => {
    const payload = {
      token: "secret-token",
      contact: {
        nome: "Maria Cliente",
        email: "maria@example.com",
        telefone: "(11) 99999-9999",
        documento: "123.456.789-00",
        endereco: "Rua Real, 123",
      },
      message: "O equipamento fica no apartamento 42.",
      nested: [{ customerId: "auvo-123" }],
    };

    expect(anonymizeAuvoPayload(payload)).toEqual({
      token: "[redacted]",
      contact: {
        nome: "Pessoa Anonimizada",
        email: "anon@example.invalid",
        telefone: "+5500000000000",
        documento: "00000000000",
        endereco: "Endereco Anonimizado",
      },
      message: "Texto anonimizado",
      nested: [{ customerId: expect.stringMatching(/^anon-[a-f0-9]{12}$/) }],
    });
  });

  it("keeps fixture metadata without leaking raw payload hash changes", () => {
    const fixture = buildAuvoFixture(
      {
        id: "11111111-1111-4111-8111-111111111111",
        eventType: "attendance.created",
        externalEventId: "evt-real-1",
        payloadHash: "original-hash",
        receivedAt: new Date("2026-07-20T10:00:00.000Z"),
        payload: { email: "real@example.com" },
      },
      new Date("2026-07-20T11:00:00.000Z"),
    );

    expect(fixture).toMatchObject({
      sourceEventId: "11111111-1111-4111-8111-111111111111",
      eventType: "attendance.created",
      externalEventId: expect.stringMatching(/^anon-[a-f0-9]{12}$/),
      originalPayloadHash: "original-hash",
      receivedAt: "2026-07-20T10:00:00.000Z",
      anonymizedAt: "2026-07-20T11:00:00.000Z",
      payload: { email: "anon@example.invalid" },
    });
    expect(fixture.anonymizedPayloadHash).not.toBe(fixture.originalPayloadHash);
  });
});
