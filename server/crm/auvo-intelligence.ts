import type { ParsedAuvoSignals } from "./auvo-parser.js";

export type AuvoIntent = "instalacao" | "manutencao" | "higienizacao" | "garantia" | "suporte" | "pos_venda" | "orcamento" | "outro";
export type AuvoUrgency = "baixa" | "normal" | "alta";
export type AuvoSuggestedAction = "create_opportunity" | "link_customer" | "request_missing_data" | "register_support" | "register_warranty" | "human_review";
export type AuvoSlaState = "novo" | "aguardando_atendente" | "aguardando_cliente" | "parado" | "vencido";
export type AuvoMissingData = "nome" | "telefone" | "tipo_demanda" | "endereco" | "equipamento";

export type AuvoDerivedSignals = {
  intent: AuvoIntent;
  urgency: AuvoUrgency;
  suggestedAction: AuvoSuggestedAction;
  confidence: number;
  missingData: AuvoMissingData[];
  slaState: AuvoSlaState;
  needsHumanReview: boolean;
  summary: string;
};

export type AuvoIntelligenceInput = {
  contactName: string | null;
  phoneRaw: string | null;
  phoneNormalized: string | null;
  email: string | null;
  channelType: string | null;
  signals: Omit<ParsedAuvoSignals, "derived">;
};

const INTENT_PATTERNS: Array<{ intent: AuvoIntent; score: number; patterns: RegExp[] }> = [
  { intent: "garantia", score: 35, patterns: [/garantia/i, /garant/i] },
  { intent: "suporte", score: 32, patterns: [/suporte/i, /problema/i, /defeito/i, /nao\s+liga/i, /nao\s+gela/i, /erro/i] },
  { intent: "higienizacao", score: 34, patterns: [/higien/i, /limpeza/i, /lavagem/i] },
  { intent: "manutencao", score: 32, patterns: [/manuten/i, /conserto/i, /reparo/i, /vazamento/i] },
  { intent: "instalacao", score: 34, patterns: [/instala/i, /instalar/i, /visita\s+tecnica/i, /split/i, /ar\s*condicionado/i] },
  { intent: "pos_venda", score: 28, patterns: [/pos[-\s]?venda/i, /acompanhar/i, /retorno/i] },
  { intent: "orcamento", score: 30, patterns: [/orcamento/i, /valor/i, /preco/i, /cotacao/i] },
];

export function deriveAuvoIntelligence(input: AuvoIntelligenceInput): AuvoDerivedSignals {
  const text = normalizeSearchText(buildSearchText(input));
  const intentResult = inferIntent(text, input.signals.classification);
  const missingData = inferMissingData(input, intentResult.intent);
  const slaState = inferSlaState(input.signals);
  const urgency = inferUrgency(text, input.signals, slaState);
  const suggestedAction = inferSuggestedAction(intentResult.intent, missingData);
  const confidence = clampConfidence(intentResult.score + (input.phoneNormalized || input.phoneRaw ? 15 : 0) + (input.contactName ? 10 : 0) - missingData.length * 8);
  const needsHumanReview = confidence < 65 || suggestedAction === "human_review" || missingData.length > 0;

  return {
    intent: intentResult.intent,
    urgency,
    suggestedAction,
    confidence,
    missingData,
    slaState,
    needsHumanReview,
    summary: buildSummary(intentResult.intent, urgency, input.signals),
  };
}

function buildSearchText(input: AuvoIntelligenceInput): string {
  return [
    input.signals.classification,
    input.signals.origin,
    input.signals.departmentName,
    input.signals.lastMessageText,
    stringifyList(input.signals.tags),
    stringifyList(input.signals.customFields),
  ]
    .filter(Boolean)
    .join(" ");
}

function inferIntent(text: string, classification: string | null): { intent: AuvoIntent; score: number } {
  const normalizedClassification = normalizeSearchText(classification ?? "");
  for (const candidate of INTENT_PATTERNS) {
    if (candidate.patterns.some((pattern) => pattern.test(normalizedClassification))) return { intent: candidate.intent, score: candidate.score + 20 };
  }

  let best: { intent: AuvoIntent; score: number } = { intent: "outro", score: 20 };
  for (const candidate of INTENT_PATTERNS) {
    const hits = candidate.patterns.filter((pattern) => pattern.test(text)).length;
    if (!hits) continue;
    const score = candidate.score + hits * 8;
    if (score > best.score) best = { intent: candidate.intent, score };
  }
  return best;
}

function inferMissingData(input: AuvoIntelligenceInput, intent: AuvoIntent): AuvoMissingData[] {
  const missing: AuvoMissingData[] = [];
  if (!input.contactName) missing.push("nome");
  if (!input.phoneRaw && !input.phoneNormalized) missing.push("telefone");
  if (intent === "outro") missing.push("tipo_demanda");
  if (["instalacao", "manutencao", "higienizacao"].includes(intent) && !mentionsAddress(input.signals)) missing.push("endereco");
  if (["instalacao", "manutencao", "higienizacao", "garantia", "suporte"].includes(intent) && !mentionsEquipment(input.signals)) missing.push("equipamento");
  return missing;
}

function inferSlaState(signals: Omit<ParsedAuvoSignals, "derived">): AuvoSlaState {
  if (signals.unreadCount && signals.unreadCount > 0) return "aguardando_atendente";
  if (signals.waitReply) return "aguardando_cliente";
  const last = signals.lastInteractionAt ? new Date(signals.lastInteractionAt).getTime() : null;
  if (!last || Number.isNaN(last)) return "novo";
  const ageHours = (Date.now() - last) / 3_600_000;
  if (ageHours >= 24) return "vencido";
  if (ageHours >= 6) return "parado";
  return "novo";
}

function inferUrgency(text: string, signals: Omit<ParsedAuvoSignals, "derived">, slaState: AuvoSlaState): AuvoUrgency {
  if (/urgente|hoje|agora|parou|sem\s+ar|vazando|cliente\s+sem/i.test(text)) return "alta";
  if ((signals.unreadCount ?? 0) >= 3 || slaState === "vencido") return "alta";
  if (slaState === "parado" || slaState === "aguardando_atendente") return "normal";
  return "normal";
}

function inferSuggestedAction(intent: AuvoIntent, missingData: AuvoMissingData[]): AuvoSuggestedAction {
  if (missingData.includes("telefone") || missingData.includes("tipo_demanda")) return "request_missing_data";
  if (intent === "garantia") return "register_warranty";
  if (intent === "suporte" || intent === "pos_venda") return "register_support";
  if (intent === "outro") return "human_review";
  return "create_opportunity";
}

function buildSummary(intent: AuvoIntent, urgency: AuvoUrgency, signals: Omit<ParsedAuvoSignals, "derived">): string {
  const parts = [formatIntent(intent), urgency === "alta" ? "prioridade alta" : null, signals.departmentName ? `fila ${signals.departmentName}` : null].filter(Boolean);
  return parts.join(" - ") || "Atendimento aguardando triagem";
}

function mentionsAddress(signals: Omit<ParsedAuvoSignals, "derived">): boolean {
  return /endereco|rua|bairro|cidade|condominio|apartamento|apto/i.test(normalizeSearchText(`${signals.lastMessageText ?? ""} ${stringifyList(signals.customFields)}`));
}

function mentionsEquipment(signals: Omit<ParsedAuvoSignals, "derived">): boolean {
  return /split|cassete|cassette|janela|btu|evaporadora|condensadora|equipamento|ar\s*condicionado/i.test(normalizeSearchText(`${signals.lastMessageText ?? ""} ${stringifyList(signals.customFields)}`));
}

function stringifyList(values: unknown[]): string {
  return values
    .map((value) => (typeof value === "string" ? value : value && typeof value === "object" ? JSON.stringify(value) : ""))
    .join(" ");
}

function formatIntent(intent: AuvoIntent): string {
  const labels: Record<AuvoIntent, string> = {
    instalacao: "instalacao",
    manutencao: "manutencao",
    higienizacao: "higienizacao",
    garantia: "garantia",
    suporte: "suporte",
    pos_venda: "pos-venda",
    orcamento: "orcamento",
    outro: "intencao indefinida",
  };
  return labels[intent];
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
