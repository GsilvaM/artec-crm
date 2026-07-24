import { type FormEvent, useEffect, useRef, useState } from "react";
import { ChevronDown, Inbox } from "lucide-react";
import { AuvoSignalSummary } from "./AuvoSignalSummary";
import { Avatar } from "./ui/Avatar";
import { formatDateTime } from "../domain/format";
import {
  loadAuvoInboxItems,
  resolveAuvoInboxItem,
  SITUACAO_SUGGESTIONS,
  TIPO_DEMANDA_OPTIONS,
  type AuvoInboxItem,
  type AuvoInboxStatus,
  type Customer,
  type ResolveAuvoInboxItemPayload,
} from "../domain/crm";

type ActionMode = "create_opportunity" | "link_opportunity" | "warranty" | "support" | "after_sales" | "customer_only" | "not_commercial" | "duplicate";
type CustomerMatchPreview = {
  score: number;
  label: string;
  description: string;
  evidence: string[];
  tone: "strong" | "medium" | "weak";
};

const STATUS_LABELS: Record<AuvoInboxStatus, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  aguardando_dados: "Aguardando dados",
  processado: "Processado",
  descartado: "Descartado",
  erro_integracao: "Erro de integração",
};

const STATUS_BADGE_CLASS: Record<AuvoInboxStatus, string> = {
  novo: "badge-informative",
  em_analise: "badge-warning-soft",
  aguardando_dados: "badge-warning-soft",
  processado: "badge-positive",
  descartado: "",
  erro_integracao: "badge-alert-danger",
};

const ACTION_LABELS: Record<ActionMode, string> = {
  create_opportunity: "Criar oportunidade",
  link_opportunity: "Vincular a oportunidade existente",
  warranty: "Registrar garantia",
  support: "Registrar suporte",
  after_sales: "Registrar pós-venda",
  customer_only: "Cadastrar somente cliente",
  not_commercial: "Marcar não comercial",
  duplicate: "Marcar duplicado",
};

// Hierarquia de acoes por frequencia/consequencia real de uso (achado de
// diagnostico visual: 8 botoes identicos lado a lado nao diferenciam criar
// um registro de negocio de descartar como duplicado).
const SECONDARY_MENU_ACTIONS: ActionMode[] = ["warranty", "support", "after_sales", "customer_only"];
const DISMISS_ACTIONS: ActionMode[] = ["not_commercial", "duplicate"];

type AuvoInboxForm = {
  clienteId: string;
  opportunityId: string;
  titulo: string;
  tipoDemanda: string;
  origem: string;
  situacao: string;
  proximaAcao: string;
  proximaAcaoEm: string;
  description: string;
  reason: string;
};

export function AuvoInboxPanel({ customers, currentUserId }: { customers: Customer[]; currentUserId: string }) {
  const [items, setItems] = useState<AuvoInboxItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<AuvoInboxStatus | "">("novo");
  const [error, setError] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [mode, setMode] = useState<ActionMode | "">("");
  const [openMoreMenuItemId, setOpenMoreMenuItemId] = useState<string | null>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<AuvoInboxForm>({
    clienteId: "",
    opportunityId: "",
    titulo: "",
    tipoDemanda: "instalacao",
    origem: "Auvo",
    situacao: "em andamento",
    proximaAcao: "",
    proximaAcaoEm: "",
    description: "",
    reason: "",
  });

  useEffect(() => {
    void refresh();
  }, [statusFilter]);

  useEffect(() => {
    if (!openMoreMenuItemId) return;
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) setOpenMoreMenuItemId(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMoreMenuItemId(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMoreMenuItemId]);

  async function refresh() {
    setError(null);
    try {
      setItems(await loadAuvoInboxItems(statusFilter || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a Caixa de Entrada.");
    }
  }

  function openAction(item: AuvoInboxItem, actionMode: ActionMode) {
    setActiveItemId(item.id);
    setMode(actionMode);
    setOpenMoreMenuItemId(null);
    setForm({
      clienteId: item.suggestedCustomerId ?? "",
      opportunityId: "",
      titulo: buildOpportunityTitle(item),
      tipoDemanda: inferDemandType(item),
      origem: item.auvoSignals.origin ?? "Auvo",
      situacao: inferSituation(item),
      proximaAcao: inferNextAction(item),
      proximaAcaoEm: defaultNextActionDateTime(),
      description: item.auvoSignals.derived.summary,
      reason: "",
    });
  }

  function closeAction() {
    setActiveItemId(null);
    setMode("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeItemId || !mode) return;
    setError(null);

    let payload: ResolveAuvoInboxItemPayload;
    if (mode === "create_opportunity") {
      payload = {
        action: "create_opportunity",
        clienteId: form.clienteId,
        titulo: form.titulo,
        tipoDemanda: form.tipoDemanda,
        origem: form.origem,
        situacao: form.situacao,
        proximaAcao: form.proximaAcao,
        proximaAcaoEm: form.proximaAcaoEm,
        responsavelId: currentUserId,
      };
    } else if (mode === "link_opportunity") {
      payload = { action: "link_opportunity", opportunityId: form.opportunityId };
    } else if (mode === "warranty" || mode === "support" || mode === "after_sales") {
      payload = { action: mode, clienteId: form.clienteId, description: form.description };
    } else if (mode === "customer_only") {
      payload = { action: "customer_only", clienteId: form.clienteId };
    } else {
      payload = { action: mode, reason: form.reason || undefined };
    }

    try {
      await resolveAuvoInboxItem(activeItemId, payload);
      closeAction();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível resolver este item.");
    }
  }

  return (
    <section className="panel auvo-inbox-panel" aria-label="Caixa de Entrada Auvo">
      <header>
        <div>
          <p className="eyebrow">Caixa de Entrada Auvo</p>
          <h2>Triagem de atendimentos</h2>
        </div>
        <div className="filter-actions">
          {(["novo", "em_analise", "processado", "descartado"] as const).map((status) => (
            <button key={status} className={`button ${statusFilter === status ? "secondary" : "ghost"}`} type="button" aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>
              {STATUS_LABELS[status]}
            </button>
          ))}
          <button className={`button ${statusFilter === "" ? "secondary" : "ghost"}`} type="button" aria-pressed={statusFilter === ""} onClick={() => setStatusFilter("")}>Todos</button>
        </div>
      </header>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {items.length ? (
        <ul className="auvo-inbox-list">
          {items.map((item) => {
            const isOpen = activeItemId === item.id;
            const isResolved = item.status === "processado" || item.status === "descartado";
            const suggestedCustomer = customers.find((customer) => customer.id === item.suggestedCustomerId);
            const matchPreview = buildCustomerMatchPreview(item, suggestedCustomer);
            const isMoreMenuOpen = openMoreMenuItemId === item.id;
            return (
              <li key={item.id} className="auvo-inbox-item">
                <div className="auvo-inbox-item-header">
                  <Avatar name={suggestedCustomer?.nome ?? item.title} size="sm" />
                  <div>
                    <strong>{item.title}</strong>
                    <span className="auvo-inbox-item-meta">{item.channelType ?? "canal desconhecido"} - {formatDateTime(item.createdAt)}</span>
                  </div>
                  <span className={`badge ${STATUS_BADGE_CLASS[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                </div>
                <dl className="auvo-inbox-facts">
                  {item.phoneNormalized ? <div><dt>Telefone</dt><dd>{item.phoneNormalized}</dd></div> : null}
                  {item.resolution ? <div><dt>Resolução</dt><dd>{item.resolution}</dd></div> : null}
                  {item.discardReason ? <div><dt>Motivo</dt><dd>{item.discardReason}</dd></div> : null}
                </dl>
                <section className={`auvo-customer-match auvo-customer-match-${matchPreview.tone}`} aria-label="Match Cliente-Auvo">
                  <div>
                    <span className="auvo-customer-match-kicker">Match Cliente-Auvo</span>
                    <strong>{matchPreview.label}</strong>
                    <p>{matchPreview.description}</p>
                  </div>
                  <div className="auvo-customer-match-score" aria-label={`Confianca estimada de ${matchPreview.score}%`}>
                    <span>{matchPreview.score}%</span>
                    <small>estimado</small>
                  </div>
                  <ul className="auvo-customer-match-evidence">
                    {matchPreview.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}
                  </ul>
                </section>
                <div className="auvo-inbox-summary">
                  <AuvoSignalSummary signals={item.auvoSignals} />
                </div>

                {!isResolved ? (
                  <div className="auvo-inbox-action-bar">
                    <div className="auvo-inbox-primary-actions">
                      <button className="button primary" type="button" onClick={() => openAction(item, "create_opportunity")}>
                        {ACTION_LABELS.create_opportunity}
                      </button>
                      <button className="button secondary" type="button" onClick={() => openAction(item, "link_opportunity")}>
                        {ACTION_LABELS.link_opportunity}
                      </button>
                      <div className="dropdown-menu-wrapper" ref={isMoreMenuOpen ? moreMenuRef : undefined}>
                        <button
                          className="button ghost"
                          type="button"
                          aria-expanded={isMoreMenuOpen}
                          onClick={() => setOpenMoreMenuItemId(isMoreMenuOpen ? null : item.id)}
                        >
                          Mais ações
                          <ChevronDown aria-hidden="true" size={14} />
                        </button>
                        {isMoreMenuOpen ? (
                          <ul className="dropdown-menu">
                            {SECONDARY_MENU_ACTIONS.map((actionMode) => (
                              <li key={actionMode}>
                                <button type="button" onClick={() => openAction(item, actionMode)}>
                                  {ACTION_LABELS[actionMode]}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                    <div className="auvo-inbox-dismiss-actions">
                      {DISMISS_ACTIONS.map((actionMode) => (
                        <button key={actionMode} className="button ghost muted-action" type="button" onClick={() => openAction(item, actionMode)}>
                          {ACTION_LABELS[actionMode]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isOpen && mode ? (
                  <form className="auvo-inbox-form" onSubmit={handleSubmit}>
                    <h4>{ACTION_LABELS[mode]}</h4>
                    {mode === "create_opportunity" || mode === "warranty" || mode === "support" || mode === "after_sales" || mode === "customer_only" ? (
                      <label>Cliente
                        <select required value={form.clienteId} onChange={(event) => setForm({ ...form, clienteId: event.target.value })}>
                          <option value="">Selecione</option>
                          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.nome}</option>)}
                        </select>
                      </label>
                    ) : null}
                    {mode === "create_opportunity" ? (
                      <>
                        <label>Título<input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /></label>
                        <label>Origem<input required value={form.origem} onChange={(event) => setForm({ ...form, origem: event.target.value })} /></label>
                        <label>
                          Tipo de demanda
                          <select required value={form.tipoDemanda} onChange={(event) => setForm({ ...form, tipoDemanda: event.target.value })}>
                            {TIPO_DEMANDA_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                          </select>
                        </label>
                        <label>
                          Situação
                          <input required list="auvo-situacao-suggestions" value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} />
                        </label>
                        <datalist id="auvo-situacao-suggestions">
                          {SITUACAO_SUGGESTIONS.map((suggestion) => <option value={suggestion} key={suggestion} />)}
                        </datalist>
                        <label>Próxima ação<input required value={form.proximaAcao} onChange={(event) => setForm({ ...form, proximaAcao: event.target.value })} /></label>
                        <label>Data da próxima ação<input required type="datetime-local" value={form.proximaAcaoEm} onChange={(event) => setForm({ ...form, proximaAcaoEm: event.target.value })} /></label>
                      </>
                    ) : null}
                    {mode === "link_opportunity" ? (
                      <label>ID da oportunidade<input required value={form.opportunityId} onChange={(event) => setForm({ ...form, opportunityId: event.target.value })} /></label>
                    ) : null}
                    {mode === "warranty" || mode === "support" || mode === "after_sales" ? (
                      <label>Descrição<input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
                    ) : null}
                    {mode === "not_commercial" || mode === "duplicate" ? (
                      <label>Motivo (opcional)<input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label>
                    ) : null}
                    <div className="form-actions">
                      <button className="button primary" type="submit">Confirmar</button>
                      <button className="button secondary" type="button" onClick={closeAction}>Cancelar</button>
                    </div>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="quotes-empty">
          <Inbox aria-hidden="true" size={16} /> Nenhum item nesta visualização.
        </p>
      )}
    </section>
  );
}

function buildOpportunityTitle(item: AuvoInboxItem): string {
  const intent = item.auvoSignals.derived.intent;
  const label = TIPO_DEMANDA_OPTIONS.find((option) => option.value === inferDemandType(item))?.label ?? item.auvoSignals.derived.summary;
  if (intent === "outro") return item.title;
  return `${label} - ${item.contactName ?? item.title}`.slice(0, 120);
}

function inferDemandType(item: AuvoInboxItem): string {
  const intent = item.auvoSignals.derived.intent;
  if (intent === "manutencao" || intent === "suporte" || intent === "garantia") return "manutencao_corretiva";
  if (intent === "higienizacao") return "higienizacao";
  return "instalacao";
}

function inferSituation(item: AuvoInboxItem): string {
  const derived = item.auvoSignals.derived;
  if (derived.missingData.length) return "Aguardando dados";
  if (derived.slaState === "aguardando_cliente") return "Aguardando cliente";
  if (derived.urgency === "alta") return "Prioridade alta";
  return "Em andamento";
}

function inferNextAction(item: AuvoInboxItem): string {
  const derived = item.auvoSignals.derived;
  if (derived.missingData.length) return `Solicitar: ${formatMissingDataForAction(derived.missingData)}`;
  if (derived.intent === "instalacao" || derived.intent === "orcamento") return "Agendar visita tecnica";
  if (derived.intent === "higienizacao") return "Confirmar escopo da higienizacao";
  return "Revisar atendimento Auvo";
}

function defaultNextActionDateTime(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatMissingDataForAction(values: AuvoInboxItem["auvoSignals"]["derived"]["missingData"]): string {
  const labels: Record<AuvoInboxItem["auvoSignals"]["derived"]["missingData"][number], string> = {
    nome: "nome",
    telefone: "telefone",
    tipo_demanda: "tipo de demanda",
    endereco: "endereco",
    equipamento: "equipamento",
  };
  return values.map((value) => labels[value]).join(", ");
}

function buildCustomerMatchPreview(item: AuvoInboxItem, suggestedCustomer: Customer | undefined): CustomerMatchPreview {
  const evidence: string[] = [];
  const inboxPhone = normalizeDigits(item.phoneNormalized);
  const customerPhone = normalizeDigits(suggestedCustomer?.telefoneNormalizado ?? suggestedCustomer?.telefone);

  if (suggestedCustomer) {
    let score = 78;
    evidence.push("Cliente sugerido pelo CRM");
    if (inboxPhone && customerPhone && inboxPhone === customerPhone) {
      score += 14;
      evidence.push("Telefone confere");
    } else if (inboxPhone) {
      evidence.push("Telefone disponivel para conferencia");
    }
    if (item.auvoContactId) {
      score += 4;
      evidence.push("Contato Auvo identificado");
    }
    if (item.contactName && namesLookRelated(item.contactName, suggestedCustomer.nome)) {
      score += 4;
      evidence.push("Nome parecido");
    }

    const boundedScore = Math.min(score, 98);
    return {
      score: boundedScore,
      label: suggestedCustomer.nome,
      description: boundedScore >= 90 ? "Vinculo forte para seguir a triagem." : "Vinculo provavel; confira antes de resolver.",
      evidence,
      tone: boundedScore >= 86 ? "strong" : "medium",
    };
  }

  if (inboxPhone) {
    return {
      score: 42,
      label: "Sem cliente sugerido",
      description: "Ha telefone no atendimento, mas nenhum cliente foi vinculado ainda.",
      evidence: ["Telefone capturado", item.auvoContactId ? "Contato Auvo identificado" : "Sem contato Auvo vinculado"],
      tone: "weak",
    };
  }

  return {
    score: 18,
    label: "Match pendente",
    description: "Faltam dados para comparar este atendimento com a base de clientes.",
    evidence: ["Solicitar telefone ou identificar cliente", "Revisao manual recomendada"],
    tone: "weak",
  };
}

function normalizeDigits(value: string | null | undefined): string {
  return value?.replace(/\D/g, "") ?? "";
}

function namesLookRelated(left: string, right: string): boolean {
  const leftTokens = normalizeSearchText(left).split(" ").filter((token) => token.length >= 3);
  const rightText = normalizeSearchText(right);
  return leftTokens.some((token) => rightText.includes(token));
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
