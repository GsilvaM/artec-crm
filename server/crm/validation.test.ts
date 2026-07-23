import { describe, expect, it } from "vitest";
import { loseOpportunitySchema, opportunityCreateSchema, TIPO_DEMANDA_OPTIONS } from "./validation.js";

const baseOpportunity = {
  clienteId: "11111111-1111-4111-8111-111111111111",
  titulo: "Instalacao de split 12000 BTUs",
  responsavelId: "22222222-2222-4222-8222-222222222222",
  situacao: "em andamento",
  proximaAcao: "Ligar para o cliente",
  proximaAcaoEm: "2026-08-01T10:00:00.000Z",
};

describe("opportunityCreateSchema tipoDemanda", () => {
  it("accepts every real Artec demand category", () => {
    for (const option of TIPO_DEMANDA_OPTIONS) {
      const result = opportunityCreateSchema.safeParse({ ...baseOpportunity, tipoDemanda: option.value });
      expect(result.success).toBe(true);
    }
  });

  it("rejects a tipoDemanda outside the closed vocabulary, including business types that are not opportunities", () => {
    for (const invalid of ["instalação", "manutencao", "garantia", "suporte", "pos_venda", "qualquer coisa"]) {
      const result = opportunityCreateSchema.safeParse({ ...baseOpportunity, tipoDemanda: invalid });
      expect(result.success).toBe(false);
    }
  });
});

describe("loseOpportunitySchema", () => {
  it("requires a valid motivoPerdaId", () => {
    expect(loseOpportunitySchema.safeParse({ motivoPerdaId: "33333333-3333-4333-8333-333333333333" }).success).toBe(true);
    expect(loseOpportunitySchema.safeParse({}).success).toBe(false);
    expect(loseOpportunitySchema.safeParse({ motivoPerdaId: "not-a-uuid" }).success).toBe(false);
  });
});
