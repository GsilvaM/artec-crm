import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Briefcase, Clock, FileText, Link2, MessageCircle, Phone, UserPlus, X } from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { Input } from "./ui/input";
import { formatDateTime } from "../domain/format";
import {
  loadAuvoInboxItems,
  resolveAuvoInboxItem,
  SITUACAO_SUGGESTIONS,
  TIPO_DEMANDA_OPTIONS,
  type AuvoInboxItem,
  type Customer,
  type ResolveAuvoCustomerPayload,
  type ResolveAuvoInboxItemPayload,
} from "../domain/crm";

type ActionMode = "create_opportunity" | "link_opportunity" | "warranty" | "support" | "after_sales" | "customer_only" | "not_commercial" | "duplicate";
type InboxTab = "pending" | "sla" | "triaged";

type AuvoInboxForm = {
  customerMode: "existing" | "new";
  clienteId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCity: string;
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

const ACTION_LABELS: Record<ActionMode, string> = {
  create_opportunity: "Abrir oportunidade",
  link_opportunity: "Vincular a cliente",
  warranty: "Registrar garantia",
  support: "Registrar suporte",
  after_sales: "Registrar pós-venda",
  customer_only: "Criar novo cliente",
  not_commercial: "Descartar",
  duplicate: "Descartar (spam)",
};

const TAB_LABELS: Record<InboxTab, string> = {
  pending: "Pendentes",
  sla: "SLA",
  triaged: "Triadas",
};

export function AuvoInboxPanel({ customers, currentUserId }: { customers: Customer[]; currentUserId: string }) {
  const [items, setItems] = useState<AuvoInboxItem[]>([]);
  const [activeTab, setActiveTab] = useState<InboxTab>("pending");
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [mode, setMode] = useState<ActionMode | "">("");
  const [form, setForm] = useState<AuvoInboxForm>(emptyForm());
  const [submittingMode, setSubmittingMode] = useState<ActionMode | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  const tabCounts = useMemo(() => buildTabCounts(items), [items]);
  const visibleItems = useMemo(() => filterItemsByTab(items, activeTab), [items, activeTab]);
  const selectedItem = useMemo(() => items.find((item) => item.id === selectedItemId) ?? null, [items, selectedItemId]);

  async function refresh() {
    setError(null);
    try {
      const loaded = await loadAuvoInboxItems();
      setItems(loaded);
      setSelectedItemId((current) => {
        if (current && loaded.some((item) => item.id === current)) return current;
        if (typeof window !== "undefined" && window.innerWidth > 820) {
          return filterItemsByTab(loaded, activeTab)[0]?.id ?? loaded[0]?.id ?? null;
        }
        return null;
      });
    } catch (err) {
      setSubmittingMode(null);
      setError(err instanceof Error ? err.message : "Não foi possível carregar a Caixa Auvo.");
    }
  }

  function selectItem(item: AuvoInboxItem) {
    setSelectedItemId(item.id);
    setMode("");
    setSubmittingMode(null);
  }

  function backToQueue() {
    setSelectedItemId(null);
    setMode("");
    setSubmittingMode(null);
  }

  function changeTab(tab: InboxTab) {
    setActiveTab(tab);
    setMode("");
    setSelectedItemId((current) => {
      if (current && filterItemsByTab(items, tab).some((item) => item.id === current)) return current;
      if (typeof window !== "undefined" && window.innerWidth > 820) return filterItemsByTab(items, tab)[0]?.id ?? null;
      return null;
    });
  }

  function openAction(item: AuvoInboxItem, actionMode: ActionMode) {
    const suggestedCustomer = customers.find((customer) => customer.id === item.suggestedCustomerId);
    setMode(actionMode);
    setForm({
      customerMode: suggestedCustomer ? "existing" : "new",
      clienteId: item.suggestedCustomerId ?? "",
      customerName: item.contactName ?? item.title,
      customerPhone: item.phoneNormalized ?? "",
      customerEmail: item.email ?? "",
      customerCity: "",
      opportunityId: "",
      titulo: buildOpportunityTitle(item),
      tipoDemanda: inferDemandType(item),
      origem: item.auvoSignals.origin ?? "Auvo",
      situacao: inferSituation(item),
      proximaAcao: inferNextAction(item),
      proximaAcaoEm: defaultNextActionDateTime(),
      description: item.auvoSignals.derived.summary,
      reason: actionMode === "duplicate" ? "Spam ou atendimento duplicado" : "",
    });
  }

  function closeAction() {
    if (submittingMode) return;
    setMode("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedItemId || !mode || submittingMode) return;
    setError(null);
    setSubmittingMode(mode);

    const customerPayload = buildCustomerPayload(form);
    let payload: ResolveAuvoInboxItemPayload;

    if (mode === "create_opportunity") {
      payload = {
        action: "create_opportunity",
        ...customerPayload,
        titulo: form.titulo,
        tipoDemanda: form.tipoDemanda,
        origem: form.origem,
        situacao: form.situacao,
        proximaAcao: form.proximaAcao,
        proximaAcaoEm: form.proximaAcaoEm,
        responsavelId: currentUserId,
      };
    } else if (mode === "link_opportunity") {
      payload = { action: "customer_only", ...customerPayload };
    } else if (mode === "warranty" || mode === "support" || mode === "after_sales") {
      payload = { action: mode, ...customerPayload, description: form.description };
    } else if (mode === "customer_only") {
      payload = { action: "customer_only", ...customerPayload };
    } else {
      payload = { action: mode, reason: form.reason || undefined };
    }

    try {
      await resolveAuvoInboxItem(selectedItemId, payload);
      setSubmittingMode(null);
      setMode("");
      await refresh();
    } catch (err) {
      setSubmittingMode(null);
      setError(err instanceof Error ? err.message : "Não foi possível resolver este atendimento.");
    }
  }

  return (
    <section className="auvo-inbox-panel auvo-design-shell" aria-label="Caixa de Entrada Auvo" data-mobile-view={selectedItem ? "detail" : "queue"}>
      <aside className="auvo-design-queue" aria-label="Fila de triagem Auvo">
        <div className="auvo-design-tabs" role="tablist" aria-label="Status da triagem Auvo">
          {(Object.keys(TAB_LABELS) as InboxTab[]).map((tab) => (
            <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => changeTab(tab)}>
              {TAB_LABELS[tab]} <span>{tabCounts[tab]}</span>
            </button>
          ))}
        </div>

        {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

        {visibleItems.length ? (
          <ul className="auvo-design-list">
            {visibleItems.map((item) => (
              <li key={item.id}>
                <QueueItem item={item} selected={selectedItemId === item.id} onSelect={() => selectItem(item)} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nenhum atendimento" text="Não há itens nesta visualização." />
        )}
      </aside>

      <main className="auvo-design-detail">
        {selectedItem ? (
          <DecisionPanel
            item={selectedItem}
            customers={customers}
            mode={mode}
            form={form}
            setForm={setForm}
            submittingMode={submittingMode}
            onBack={backToQueue}
            onOpenAction={openAction}
            onCloseAction={closeAction}
            onSubmit={handleSubmit}
          />
        ) : (
          <EmptyState title="Selecione um atendimento" text="Escolha um item da fila para revisar a sessão consolidada." />
        )}
      </main>
    </section>
  );
}

function QueueItem({ item, selected, onSelect }: { item: AuvoInboxItem; selected: boolean; onSelect: () => void }) {
  const derived = item.auvoSignals.derived;
  return (
    <button type="button" className="auvo-design-queue-item" aria-current={selected} onClick={onSelect}>
      <span className="auvo-design-item-icon" data-tone={queueIconTone(item)}>
        {item.phoneNormalized ? <Phone size={17} aria-hidden="true" /> : derived.intent === "outro" ? <FileText size={17} aria-hidden="true" /> : <MessageCircle size={17} aria-hidden="true" />}
      </span>
      <span className="auvo-design-item-copy">
        <strong>{item.contactName ?? item.title}</strong>
        <span>{buildQueuePreview(item)}</span>
        <span className="auvo-design-item-badges">
          {derived.needsHumanReview || isSlaRisk(item) ? <Badge tone={isSlaRisk(item) ? "alert-danger" : "alert-warning"}>{isSlaRisk(item) ? "SLA" : "Revisar"}</Badge> : null}
          {item.suggestedCustomerId ? <Badge tone="positive">Match alta</Badge> : null}
          {!item.suggestedCustomerId && item.phoneNormalized ? <Badge tone="warning">Match média</Badge> : null}
        </span>
      </span>
      <small>{formatRelativeShort(item.createdAt)}</small>
    </button>
  );
}

function DecisionPanel({
  item,
  customers,
  mode,
  form,
  setForm,
  submittingMode,
  onBack,
  onOpenAction,
  onCloseAction,
  onSubmit,
}: {
  item: AuvoInboxItem;
  customers: Customer[];
  mode: ActionMode | "";
  form: AuvoInboxForm;
  setForm: (form: AuvoInboxForm) => void;
  submittingMode: ActionMode | null;
  onBack: () => void;
  onOpenAction: (item: AuvoInboxItem, mode: ActionMode) => void;
  onCloseAction: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const suggestedCustomer = customers.find((customer) => customer.id === item.suggestedCustomerId);
  const isResolved = item.status === "processado" || item.status === "descartado";

  return (
    <article className="auvo-design-card">
      <header className="auvo-design-detail-header">
        <Button type="button" variant="ghost" className="auvo-design-back" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" /> Voltar
        </Button>
        <span className="auvo-design-item-icon" data-tone={queueIconTone(item)}>
          <MessageCircle size={18} aria-hidden="true" />
        </span>
        <div>
          <h2>{item.contactName ?? item.title}</h2>
          <p><Clock size={13} aria-hidden="true" /> Recebido {formatRelativeShort(item.createdAt)}</p>
        </div>
      </header>

      <div className="auvo-design-content">
        <section className="auvo-session-card" aria-label="Sessão consolidada">
          <header>
            <strong>Sessão consolidada</strong>
            <p>Todo o contexto agrupado antes da triagem.</p>
          </header>
          <div className="auvo-session-block">
            <span>Mensagem recebida</span>
            <p>{item.auvoSignals.lastMessageText ?? item.auvoSignals.derived.summary}</p>
          </div>
          <div className="auvo-session-block">
            <span>Contexto adicional</span>
            <p>{buildAdditionalContext(item)}</p>
          </div>
        </section>

        <section className="auvo-customer-suggestion-card" aria-label="Cliente sugerido">
          <header>
            <strong>Cliente sugerido</strong>
            <p>Correlação automática - confirme antes de vincular.</p>
          </header>
          <div>
            <Avatar name={suggestedCustomer?.nome ?? item.contactName ?? item.title} size="sm" />
            <span>
              <strong>{suggestedCustomer?.nome ?? `${item.contactName ?? item.title} - novo cliente`}</strong>
              <small>Confiança: {suggestedCustomer ? "alta" : item.phoneNormalized ? "média" : "baixa"}</small>
            </span>
            <Badge tone={suggestedCustomer ? "positive" : "warning"}>{suggestedCustomer ? "alta" : "média"}</Badge>
          </div>
        </section>

        {mode ? (
          <ActionForm
            mode={mode}
            customers={customers}
            form={form}
            setForm={setForm}
            submittingMode={submittingMode}
            onCloseAction={onCloseAction}
            onSubmit={onSubmit}
          />
        ) : null}
      </div>

      {!isResolved ? (
        <footer className="auvo-design-actions">
          <Button variant="secondary" type="button" disabled={Boolean(submittingMode)} onClick={() => onOpenAction(item, "duplicate")}>
            <X size={16} aria-hidden="true" /> {ACTION_LABELS.duplicate}
          </Button>
          <Button variant="secondary" type="button" disabled={Boolean(submittingMode)} onClick={() => onOpenAction(item, "customer_only")}>
            <UserPlus size={16} aria-hidden="true" /> {ACTION_LABELS.customer_only}
          </Button>
          <Button variant="secondary" type="button" disabled={Boolean(submittingMode)} onClick={() => onOpenAction(item, "link_opportunity")}>
            <Link2 size={16} aria-hidden="true" /> {ACTION_LABELS.link_opportunity}
          </Button>
          <Button variant="primary" type="button" disabled={Boolean(submittingMode)} onClick={() => onOpenAction(item, "create_opportunity")}>
            <Briefcase size={16} aria-hidden="true" /> {ACTION_LABELS.create_opportunity}
          </Button>
        </footer>
      ) : null}
    </article>
  );
}

function ActionForm({
  mode,
  customers,
  form,
  setForm,
  submittingMode,
  onCloseAction,
  onSubmit,
}: {
  mode: ActionMode;
  customers: Customer[];
  form: AuvoInboxForm;
  setForm: (form: AuvoInboxForm) => void;
  submittingMode: ActionMode | null;
  onCloseAction: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const needsCustomer = mode === "create_opportunity" || mode === "warranty" || mode === "support" || mode === "after_sales" || mode === "customer_only" || mode === "link_opportunity";

  return (
    <form className="auvo-inbox-form auvo-design-form" onSubmit={onSubmit} aria-busy={submittingMode === mode}>
      <header className="auvo-inbox-form-header">
        <div>
          <span>Resolução do atendimento</span>
          <h4>{ACTION_LABELS[mode]}</h4>
        </div>
        <p>{buildActionFormHint(mode)}</p>
      </header>

      {needsCustomer ? (
        <fieldset className="auvo-customer-choice">
          <legend>Cliente</legend>
          <div className="radio-row">
            <label><input type="radio" name="auvo-customer-mode" value="existing" checked={form.customerMode === "existing"} onChange={() => setForm({ ...form, customerMode: "existing" })} /> Usar cliente existente</label>
            <label><input type="radio" name="auvo-customer-mode" value="new" checked={form.customerMode === "new"} onChange={() => setForm({ ...form, customerMode: "new" })} /> Cadastrar novo cliente</label>
          </div>
          {form.customerMode === "existing" ? (
            <label>Cliente existente
              <select required value={form.clienteId} onChange={(event) => setForm({ ...form, clienteId: event.target.value })}>
                <option value="">Selecione</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.nome}</option>)}
              </select>
            </label>
          ) : (
            <div className="auvo-new-customer-grid">
              <label>Nome do cliente<Input required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></label>
              <label>Telefone<Input value={form.customerPhone} onChange={(event) => setForm({ ...form, customerPhone: event.target.value })} /></label>
              <label>E-mail<Input type="email" value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} /></label>
              <label>Cidade<Input value={form.customerCity} onChange={(event) => setForm({ ...form, customerCity: event.target.value })} /></label>
            </div>
          )}
        </fieldset>
      ) : null}

      {mode === "create_opportunity" ? (
        <>
          <label>Título<Input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /></label>
          <label>Origem<Input required value={form.origem} onChange={(event) => setForm({ ...form, origem: event.target.value })} /></label>
          <label>Tipo de demanda
            <select required value={form.tipoDemanda} onChange={(event) => setForm({ ...form, tipoDemanda: event.target.value })}>
              {TIPO_DEMANDA_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>Situação<Input required list="auvo-situacao-suggestions" value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} /></label>
          <datalist id="auvo-situacao-suggestions">
            {SITUACAO_SUGGESTIONS.map((suggestion) => <option value={suggestion} key={suggestion} />)}
          </datalist>
          <label>Próxima ação<Input required value={form.proximaAcao} onChange={(event) => setForm({ ...form, proximaAcao: event.target.value })} /></label>
          <label>Data da próxima ação<Input required type="datetime-local" value={form.proximaAcaoEm} onChange={(event) => setForm({ ...form, proximaAcaoEm: event.target.value })} /></label>
        </>
      ) : null}

      {mode === "warranty" || mode === "support" || mode === "after_sales" ? (
        <label>Descrição<Input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      ) : null}
      {mode === "not_commercial" || mode === "duplicate" ? (
        <label>Motivo<Input required={mode === "duplicate"} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label>
      ) : null}

      <div className="form-actions">
        <Button variant="primary" type="submit" disabled={submittingMode === mode}>{submittingMode === mode ? "Salvando..." : "Confirmar"}</Button>
        <Button variant="secondary" type="button" disabled={submittingMode === mode} onClick={onCloseAction}>Cancelar</Button>
      </div>
    </form>
  );
}

function emptyForm(): AuvoInboxForm {
  return {
    customerMode: "new",
    clienteId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerCity: "",
    opportunityId: "",
    titulo: "",
    tipoDemanda: "instalacao",
    origem: "Auvo",
    situacao: "em andamento",
    proximaAcao: "",
    proximaAcaoEm: "",
    description: "",
    reason: "",
  };
}

function buildTabCounts(items: AuvoInboxItem[]): Record<InboxTab, number> {
  return {
    pending: filterItemsByTab(items, "pending").length,
    sla: filterItemsByTab(items, "sla").length,
    triaged: filterItemsByTab(items, "triaged").length,
  };
}

function filterItemsByTab(items: AuvoInboxItem[], tab: InboxTab): AuvoInboxItem[] {
  return items.filter((item) => {
    if (tab === "triaged") return item.status === "processado" || item.status === "descartado";
    if (tab === "sla") return item.status !== "processado" && item.status !== "descartado" && isSlaRisk(item);
    return item.status !== "processado" && item.status !== "descartado" && !isSlaRisk(item);
  });
}

function isSlaRisk(item: AuvoInboxItem): boolean {
  return item.auvoSignals.derived.slaState === "vencido" || item.auvoSignals.derived.slaState === "parado" || item.auvoSignals.derived.urgency === "alta";
}

function queueIconTone(item: AuvoInboxItem): "message" | "phone" | "file" {
  if (item.phoneNormalized) return "phone";
  if (item.auvoSignals.derived.intent === "outro") return "file";
  return "message";
}

function buildQueuePreview(item: AuvoInboxItem): string {
  if (item.auvoSignals.lastMessageText) return item.auvoSignals.lastMessageText.slice(0, 74);
  if (item.phoneNormalized) return "Chamada perdida - retornar";
  return item.auvoSignals.derived.summary;
}

function buildAdditionalContext(item: AuvoInboxItem): string {
  const unread = item.auvoSignals.unreadCount;
  if (unread && unread > 1) return `Contato já enviou ${unread} mensagens sobre o mesmo assunto nas últimas 24 horas.`;
  if (item.auvoSignals.tags.length) return `Tags recebidas: ${item.auvoSignals.tags.map(String).slice(0, 3).join(", ")}.`;
  if (item.channelType) return `Canal ${item.channelType}; revise o histórico antes de criar registros.`;
  return "Sem contexto adicional relevante no payload recebido.";
}

function buildActionFormHint(mode: ActionMode): string {
  const hints: Record<ActionMode, string> = {
    create_opportunity: "Cria ou reutiliza o cliente e abre a oportunidade com próxima ação obrigatória.",
    link_opportunity: "Use quando o atendimento deve ser preservado na ficha de um cliente existente.",
    warranty: "Registra o contato como garantia, sem contaminar o funil comercial.",
    support: "Registra suporte técnico na ficha do cliente.",
    after_sales: "Registra pós-venda na ficha do cliente.",
    customer_only: "Cria ou confirma o cliente sem abrir oportunidade comercial.",
    not_commercial: "Encerra a triagem como atendimento fora do escopo comercial.",
    duplicate: "Encerra como spam ou duplicado; informe o motivo para preservar auditoria.",
  };
  return hints[mode];
}

function buildCustomerPayload(form: AuvoInboxForm): ResolveAuvoCustomerPayload {
  if (form.customerMode === "existing") return { clienteId: form.clienteId };
  return {
    customer: {
      tipoPessoa: "fisica",
      nome: form.customerName,
      telefone: form.customerPhone || null,
      email: form.customerEmail || null,
      cidade: form.customerCity || null,
      observacoes: "Cliente cadastrado pela triagem da Caixa Auvo.",
    },
  };
}

function buildOpportunityTitle(item: AuvoInboxItem): string {
  const label = TIPO_DEMANDA_OPTIONS.find((option) => option.value === inferDemandType(item))?.label ?? item.auvoSignals.derived.summary;
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
  if (derived.missingData.length) return `Solicitar dados pendentes: ${derived.missingData.join(", ")}`;
  if (derived.intent === "instalacao" || derived.intent === "orcamento") return "Agendar visita técnica";
  if (derived.intent === "higienizacao") return "Confirmar escopo da higienização";
  return "Revisar atendimento Auvo";
}

function defaultNextActionDateTime(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatRelativeShort(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60_000));
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return formatDateTime(value);
}
