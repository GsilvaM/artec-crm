import { describe, expect, it } from "vitest";
import { deriveAuvoIntelligence } from "./auvo-intelligence.js";
import type { ParsedAuvoSignals } from "./auvo-parser.js";

describe("deriveAuvoIntelligence", () => {
  it("prioritizes commercial installation requests with missing address/equipment data", () => {
    const derived = deriveAuvoIntelligence({
      contactName: "Cliente",
      phoneRaw: "+55 11 99999-0000",
      phoneNormalized: "5511999990000",
      email: null,
      channelType: "whatsapp",
      signals: signals({
        lastMessageText: "Quero orcamento para instalar ar condicionado",
      }),
    });

    expect(derived).toMatchObject({
      intent: "instalacao",
      urgency: "normal",
      suggestedAction: "create_opportunity",
      needsHumanReview: true,
    });
    expect(derived.missingData).toContain("endereco");
    expect(derived.confidence).toBeGreaterThan(50);
  });

  it("routes warranty and support away from opportunity creation", () => {
    expect(deriveAuvoIntelligence({ contactName: "Cliente", phoneRaw: "11999990000", phoneNormalized: "11999990000", email: null, channelType: "whatsapp", signals: signals({ lastMessageText: "Preciso acionar garantia" }) }).suggestedAction).toBe("register_warranty");
    expect(deriveAuvoIntelligence({ contactName: "Cliente", phoneRaw: "11999990000", phoneNormalized: "11999990000", email: null, channelType: "whatsapp", signals: signals({ lastMessageText: "Meu ar nao gela" }) }).suggestedAction).toBe("register_support");
  });

  it("understands real Portuguese accents before classifying intent", () => {
    const cases = [
      ["Preciso de orçamento para instalação", "instalacao"],
      ["Agendar visita técnica", "instalacao"],
      ["Manutenção do equipamento", "manutencao"],
      ["Higienização e limpeza", "higienizacao"],
      ["Pós-venda do serviço", "pos_venda"],
      ["O ar não gela", "suporte"],
    ] as const;

    for (const [message, intent] of cases) {
      expect(
        deriveAuvoIntelligence({
          contactName: "Cliente",
          phoneRaw: "11999990000",
          phoneNormalized: "11999990000",
          email: null,
          channelType: "whatsapp",
          signals: signals({ lastMessageText: message }),
        }).intent,
      ).toBe(intent);
    }
  });
});

function signals(overrides: Partial<ParsedAuvoSignals> = {}): ParsedAuvoSignals {
  return {
    origin: null,
    utm: {},
    tags: [],
    customFields: [],
    classification: null,
    departmentId: null,
    departmentName: null,
    agentId: null,
    agentName: null,
    sessionStartedAt: null,
    sessionEndedAt: null,
    firstUserInteractionAt: null,
    firstAgentMessageAt: null,
    lastInteractionAt: null,
    lastMessageText: null,
    unreadCount: null,
    waitReply: null,
    windowStatus: null,
    derived: {
      intent: "outro",
      urgency: "normal",
      suggestedAction: "human_review",
      confidence: 0,
      missingData: ["tipo_demanda"],
      slaState: "novo",
      needsHumanReview: true,
      summary: "Atendimento aguardando triagem",
    },
    ...overrides,
  };
}
