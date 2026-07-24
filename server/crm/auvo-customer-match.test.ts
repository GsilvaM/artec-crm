import { describe, expect, it } from "vitest";
import { buildAuvoCustomerMatchReport } from "./auvo-customer-match.js";

describe("buildAuvoCustomerMatchReport", () => {
  it("returns a high confidence candidate for exact phone matches", () => {
    const report = buildAuvoCustomerMatchReport(
      [customer({ id: "customer-1", phoneNormalized: "5511999990000" })],
      [signal({ auvoContactId: "auvo-1", phoneNormalized: "5511999990000" })],
    );

    expect(report.highConfidence).toBe(1);
    expect(report.candidates[0]).toMatchObject({
      customerId: "customer-1",
      auvoContactId: "auvo-1",
      score: 95,
      confidence: "alta",
      reasons: ["telefone_exato", "nome_compativel"],
      blockers: [],
    });
  });

  it("marks exact phone matches as blocked when the CRM phone is duplicated", () => {
    const report = buildAuvoCustomerMatchReport(
      [
        customer({ id: "customer-1", phoneNormalized: "5511999990000" }),
        customer({ id: "customer-2", name: "Cliente Homonimo", phoneNormalized: "5511999990000" }),
      ],
      [signal({ auvoContactId: "auvo-1", phoneNormalized: "5511999990000" })],
    );

    expect(report.blocked).toBe(2);
    expect(report.candidates.every((candidate) => candidate.blockers.includes("telefone_duplicado_no_crm"))).toBe(true);
  });

  it("uses exact email as medium confidence when phone is missing", () => {
    const report = buildAuvoCustomerMatchReport(
      [customer({ id: "customer-1", phoneNormalized: null, email: "cliente@artec.local" })],
      [signal({ auvoContactId: "auvo-1", phoneNormalized: null, email: "CLIENTE@ARTEC.LOCAL", contactName: "Outro nome" })],
    );

    expect(report.candidates[0]).toMatchObject({
      score: 60,
      confidence: "media",
      reasons: ["email_exato"],
    });
  });

  it("does not suggest a customer already linked to another Auvo contact", () => {
    const report = buildAuvoCustomerMatchReport(
      [customer({ id: "customer-1", auvoContactId: "auvo-existing", phoneNormalized: "5511999990000" })],
      [signal({ auvoContactId: "auvo-new", phoneNormalized: "5511999990000" })],
    );

    expect(report.candidates).toHaveLength(0);
  });
});

function customer(overrides: Partial<Parameters<typeof buildAuvoCustomerMatchReport>[0][number]> = {}) {
  return {
    id: overrides.id ?? "customer-1",
    name: overrides.name ?? "Cliente Teste",
    phoneNormalized: "phoneNormalized" in overrides ? overrides.phoneNormalized ?? null : "5511999990000",
    email: overrides.email ?? null,
    auvoContactId: overrides.auvoContactId ?? null,
  };
}

function signal(overrides: Partial<Parameters<typeof buildAuvoCustomerMatchReport>[1][number]> = {}) {
  return {
    auvoContactId: overrides.auvoContactId ?? "auvo-1",
    contactName: overrides.contactName ?? "Cliente Teste",
    phoneNormalized: "phoneNormalized" in overrides ? overrides.phoneNormalized ?? null : "5511999990000",
    email: overrides.email ?? null,
    lastInteractionAt: overrides.lastInteractionAt ?? null,
  };
}
