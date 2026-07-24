import { AlertTriangle, CheckCircle2, Gauge, Lightbulb } from "lucide-react";
import { formatDateTime } from "../domain/format";
import type { AuvoParsedSignals } from "../domain/crm";

type AuvoSignalSummaryProps = {
  signals: AuvoParsedSignals;
  compact?: boolean;
  title?: string;
  description?: string;
  showDetails?: boolean;
};

export function AuvoSignalSummary({ signals, compact = false, title = "Leitura do atendimento", description, showDetails }: AuvoSignalSummaryProps) {
  const derived = signals.derived;
  const details = [
    signals.origin ? ["Origem", signals.origin] : null,
    signals.classification ? ["Classificacao", signals.classification] : null,
    signals.departmentName ? ["Departamento", signals.departmentName] : null,
    signals.agentName ? ["Atendente", signals.agentName] : null,
    signals.lastInteractionAt ? ["Ultima interacao", formatDateTime(signals.lastInteractionAt)] : null,
  ].filter(Boolean) as Array<[string, string]>;
  const shouldShowDetails = showDetails ?? !compact;
  const compactContext = compact ? details.slice(0, 3) : [];

  return (
    <section
      className={[
        "auvo-signal-summary",
        compact ? "auvo-signal-summary-compact" : "",
        derived.needsHumanReview ? "auvo-signal-summary-review" : "",
      ].filter(Boolean).join(" ")}
      aria-label="Resumo dos sinais Auvo"
    >
      <header className="auvo-signal-summary-header">
        <div className="auvo-signal-summary-icon" aria-hidden="true">
          {derived.needsHumanReview ? <AlertTriangle size={18} /> : <Lightbulb size={18} />}
        </div>
        <div>
          <span className="auvo-signal-summary-kicker">{title}</span>
          <strong>{derived.summary}</strong>
          {description ? <p>{description}</p> : null}
        </div>
        <span className={`badge ${urgencyBadgeClass(derived.urgency)}`}>{formatDerivedUrgency(derived.urgency)}</span>
      </header>

      <div className="auvo-signal-summary-strip">
        <span><Lightbulb aria-hidden="true" size={14} /> {formatDerivedIntent(derived.intent)}</span>
        <span><CheckCircle2 aria-hidden="true" size={14} /> {formatSuggestedAction(derived.suggestedAction)}</span>
        <span><Gauge aria-hidden="true" size={14} /> {derived.confidence}% confianca</span>
        <span>{formatSlaState(derived.slaState)}</span>
      </div>

      {derived.missingData.length ? (
        <p className="auvo-signal-summary-warning">Dados faltantes: {formatMissingData(derived.missingData)}</p>
      ) : null}

      {compactContext.length ? (
        <p className="auvo-signal-summary-context">
          {compactContext.map(([label, value]) => `${label}: ${value}`).join(" | ")}
        </p>
      ) : null}

      {shouldShowDetails && (details.length || signals.lastMessageText || signals.tags.length) ? (
        <dl className="auvo-signal-summary-details">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          {signals.lastMessageText ? (
            <div className="auvo-signal-summary-wide">
              <dt>Ultima mensagem</dt>
              <dd>{signals.lastMessageText}</dd>
            </div>
          ) : null}
          {signals.tags.length ? (
            <div className="auvo-signal-summary-wide">
              <dt>Tags</dt>
              <dd>{formatSignalList(signals.tags)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}

function formatDerivedIntent(intent: AuvoParsedSignals["derived"]["intent"]): string {
  const labels: Record<AuvoParsedSignals["derived"]["intent"], string> = {
    instalacao: "Instalacao",
    manutencao: "Manutencao",
    higienizacao: "Higienizacao",
    garantia: "Garantia",
    suporte: "Suporte",
    pos_venda: "Pos-venda",
    orcamento: "Orcamento",
    outro: "Indefinida",
  };
  return labels[intent];
}

function formatDerivedUrgency(urgency: AuvoParsedSignals["derived"]["urgency"]): string {
  return urgency === "alta" ? "Alta prioridade" : urgency === "baixa" ? "Baixa prioridade" : "Prioridade normal";
}

function urgencyBadgeClass(urgency: AuvoParsedSignals["derived"]["urgency"]): string {
  if (urgency === "alta") return "badge-alert-warning";
  if (urgency === "baixa") return "badge-positive";
  return "badge-informative";
}

function formatSuggestedAction(action: AuvoParsedSignals["derived"]["suggestedAction"]): string {
  const labels: Record<AuvoParsedSignals["derived"]["suggestedAction"], string> = {
    create_opportunity: "Criar oportunidade",
    link_customer: "Vincular cliente",
    request_missing_data: "Pedir dados",
    register_support: "Registrar suporte",
    register_warranty: "Registrar garantia",
    human_review: "Revisar manualmente",
  };
  return labels[action];
}

function formatSlaState(state: AuvoParsedSignals["derived"]["slaState"]): string {
  const labels: Record<AuvoParsedSignals["derived"]["slaState"], string> = {
    novo: "Novo atendimento",
    aguardando_atendente: "Aguardando atendente",
    aguardando_cliente: "Aguardando cliente",
    parado: "Atendimento parado",
    vencido: "SLA vencido",
  };
  return labels[state];
}

function formatMissingData(values: AuvoParsedSignals["derived"]["missingData"]): string {
  const labels: Record<AuvoParsedSignals["derived"]["missingData"][number], string> = {
    nome: "nome",
    telefone: "telefone",
    tipo_demanda: "tipo de demanda",
    endereco: "endereco",
    equipamento: "equipamento",
  };
  return values.map((value) => labels[value]).join(", ");
}

function formatSignalList(values: unknown[]): string {
  return values
    .map((value) => {
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      if (value && typeof value === "object" && "name" in value && typeof (value as { name?: unknown }).name === "string") {
        return (value as { name: string }).name;
      }
      return JSON.stringify(value);
    })
    .filter(Boolean)
    .join(", ");
}
