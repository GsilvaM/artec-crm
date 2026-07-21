import { AlertCircle, Archive, Bell, CheckCircle2, Clock, Copy, Edit3, LogIn, LogOut, Plus, RefreshCw, Search, UserRound, XCircle } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { readSupabaseSession, signInWithPassword, signOut, type AuthState } from "./domain/auth";
import { formatDateTime, formatMoney } from "./domain/format";
import {
  approveOpportunity,
  archiveOpportunity,
  archiveCustomer,
  createCustomer,
  createActivity,
  createNextAction,
  createOpportunity,
  createQuote,
  completeNextAction,
  cancelNextAction,
  archiveNotification,
  loadCrmSnapshot,
  ignoreAuvoWebhookEvent,
  loadCustomerActivities,
  loadOpportunityQuotes,
  loadAuvoIntegrationStatus,
  loadAuvoWebhookEvent,
  loadAuvoWebhookEvents,
  loadNotifications,
  loadOpportunityActivities,
  loadUnreadNotificationsCount,
  loseOpportunity,
  markAllNotificationsRead,
  markNotificationRead,
  postponeNextAction,
  reprocessAuvoWebhookEvent,
  snoozeNotification,
  updateCustomer,
  updateOpportunity,
  type Activity,
  type AuvoIntegrationStatus,
  type AuvoWebhookEvent,
  type AuvoWebhookStatus,
  type CommercialCenterActionItem,
  type CommercialCenterFilters,
  type CommercialCenterOpportunityItem,
  type CrmSnapshot,
  type Customer,
  type NextAction,
  type Notification,
  type Opportunity,
  type Quote,
  type QuoteStatus,
  updateQuote,
} from "./domain/crm";
import { PipelineBoard } from "./components/PipelineBoard";
import { AdminPanel } from "./components/AdminPanel";
import { QuotesPanel } from "./components/QuotesPanel";
import { ReportsPanel } from "./components/ReportsPanel";

type ActionFilter = "overdue" | "today" | "upcoming" | "completed" | "cancelled";

type ActionOperation = {
  mode: "complete" | "postpone" | "cancel";
  action: NextAction;
  completionResult: string;
  dueAt: string;
  cancellationReason: string;
  nextTitle: string;
  nextDueAt: string;
  nextCategory: NextAction["category"];
  nextPriority: NextAction["priority"];
};

export function App() {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void readSupabaseSession().then(setAuthState);
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthState(await signInWithPassword(email, password));
    setIsSubmitting(false);
  }

  async function handleLogout() {
    await signOut();
    setAuthState({ status: "anonymous" });
  }

  if (authState.status === "loading") {
    return (
      <main className="auth-screen" aria-busy="true">
        <section className="auth-panel">
          <div className="brand-mark">A</div>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-button" />
        </section>
      </main>
    );
  }

  if (authState.status === "error") {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <AlertCircle aria-hidden="true" className="auth-icon danger" />
          <p className="eyebrow">Artec CRM</p>
          <h1>Erro ao entrar</h1>
          <p>{authState.message}</p>
          <LoginForm email={email} password={password} isSubmitting={isSubmitting} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />
        </section>
      </main>
    );
  }

  if (authState.status === "not_configured" || authState.status === "membership_missing" || authState.status === "membership_inactive" || authState.status === "access_denied" || authState.status === "api_error") {
    const copy = getAuthBlockedCopy(authState);
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <AlertCircle aria-hidden="true" className={authState.status === "not_configured" ? "auth-icon" : "auth-icon danger"} />
          <p className="eyebrow">Artec CRM</p>
          <h1>{copy.title}</h1>
          <p>{copy.message}</p>
          {authState.status !== "not_configured" ? (
            <button className="button secondary" type="button" onClick={handleLogout}>
              <LogOut aria-hidden="true" />
              Sair
            </button>
          ) : null}
        </section>
      </main>
    );
  }

  if (authState.status !== "authenticated") {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <div className="brand-mark">A</div>
          <p className="eyebrow">Artec CRM</p>
          <h1>Central comercial independente</h1>
          <p>Entre com a conta Supabase. O backend validara sua membership antes de liberar o CRM.</p>
          <LoginForm email={email} password={password} isSubmitting={isSubmitting} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />
        </section>
      </main>
    );
  }

  return <AuthenticatedApp authState={authState} onLogout={handleLogout} />;
}

function AuthenticatedApp({ authState, onLogout }: { authState: Extract<AuthState, { status: "authenticated" }>; onLogout: () => Promise<void> }) {
  const [snapshot, setSnapshot] = useState<CrmSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [customerForm, setCustomerForm] = useState({ nome: "", telefone: "", email: "", empresa: "", bairro: "", cidade: "" });
  const [opportunityForm, setOpportunityForm] = useState({ clienteId: "", titulo: "", tipoDemanda: "instalacao", situacao: "em andamento", proximaAcao: "", proximaAcaoEm: "" });
  const [activityForm, setActivityForm] = useState({ customerId: "", opportunityId: "", type: "note" as Activity["type"], description: "" });
  const [nextActionForm, setNextActionForm] = useState({ customerId: "", opportunityId: "", category: "commercial" as NextAction["category"], title: "", dueAt: "", priority: "normal" as NextAction["priority"] });
  const [actionFilter, setActionFilter] = useState<ActionFilter>("overdue");
  const [commercialFilters, setCommercialFilters] = useState<CommercialCenterFilters>({});
  const [actionOperation, setActionOperation] = useState<ActionOperation | null>(null);
  const [timeline, setTimeline] = useState<Activity[]>([]);
  const [timelineTitle, setTimelineTitle] = useState("Linha do tempo");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<"active" | "read" | "archived">("active");
  const [auvoStatus, setAuvoStatus] = useState<AuvoIntegrationStatus | null>(null);
  const [auvoEvents, setAuvoEvents] = useState<AuvoWebhookEvent[]>([]);
  const [selectedAuvoEvent, setSelectedAuvoEvent] = useState<AuvoWebhookEvent | null>(null);
  const [auvoFilter, setAuvoFilter] = useState<AuvoWebhookStatus | "">("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesOpportunity, setQuotesOpportunity] = useState<Opportunity | null>(null);

  const activeCustomers = snapshot?.customers.filter((customer) => !customer.archivedAt) ?? [];
  const activeOpportunities = snapshot?.opportunities.filter((opportunity) => opportunity.status === "ativa") ?? [];
  const opportunitiesWithoutNextAction = activeOpportunities.filter((opportunity) => !opportunity.proximaAcao || !opportunity.proximaAcaoEm);
  const defaultStageId = snapshot?.stages[0]?.id;
  const firstLossReasonId = snapshot?.lossReasons[0]?.id;
  const visibleNextActions = useMemo(
    () => filterNextActions(snapshot?.nextActions ?? [], actionFilter),
    [snapshot?.nextActions, actionFilter],
  );
  const responsibleOptions = useMemo(
    () => uniqueValues([
      authState.user.id,
      ...(snapshot?.opportunities.map((opportunity) => opportunity.responsavelId) ?? []),
      ...(snapshot?.nextActions.map((action) => action.responsibleUserId) ?? []),
    ]),
    [authState.user.id, snapshot?.nextActions, snapshot?.opportunities],
  );
  const situationOptions = useMemo(
    () => uniqueValues(snapshot?.opportunities.map((opportunity) => opportunity.situacao) ?? []),
    [snapshot?.opportunities],
  );
  const demandTypeOptions = useMemo(
    () => uniqueValues(snapshot?.opportunities.map((opportunity) => opportunity.tipoDemanda) ?? []),
    [snapshot?.opportunities],
  );
  const hasCommercialFilters = Object.values(commercialFilters).some((value) => Boolean(value));
  const canManageIntegrations = authState.user.permissions.includes("integrations:read");
  const canManageUsers = authState.user.permissions.includes("users:manage");
  const canViewReports = authState.user.permissions.includes("reports:read");

  const metrics = useMemo(
    () => [
      { label: "Clientes ativos", value: activeCustomers.length },
      { label: "Oportunidades ativas", value: activeOpportunities.length },
      { label: "Sem proxima acao", value: opportunitiesWithoutNextAction.length },
    ],
    [activeCustomers.length, activeOpportunities.length, opportunitiesWithoutNextAction.length],
  );

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadCrmSnapshot(search, commercialFilters);
      setSnapshot(data);
      await refreshNotifications(notificationStatus);
      if (canManageIntegrations) await refreshAuvo();
      setOpportunityForm((current) => ({ ...current, clienteId: current.clienteId || data.customers[0]?.id || "" }));
      setActivityForm((current) => ({ ...current, customerId: current.customerId || data.customers[0]?.id || "" }));
      setNextActionForm((current) => ({ ...current, customerId: current.customerId || data.customers[0]?.id || "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar o CRM.");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshNotifications(status = notificationStatus) {
    const [list, count] = await Promise.all([
      loadNotifications({ status, limit: "20" }),
      loadUnreadNotificationsCount(),
    ]);
    setNotifications(list.notifications);
    setNotificationCount(count);
  }

  async function refreshAuvo(status = auvoFilter) {
    const [integrationStatus, list] = await Promise.all([
      loadAuvoIntegrationStatus(),
      loadAuvoWebhookEvents({ status: status || undefined, limit: "10" }),
    ]);
    setAuvoStatus(integrationStatus);
    setAuvoEvents(list.events);
    if (selectedAuvoEvent) {
      setSelectedAuvoEvent(list.events.find((event) => event.id === selectedAuvoEvent.id) ?? selectedAuvoEvent);
    }
  }

  async function handleNotificationRead(id: string) {
    await markNotificationRead(id);
    await refreshNotifications();
  }

  async function handleAllNotificationsRead() {
    await markAllNotificationsRead();
    await refreshNotifications();
  }

  async function handleNotificationArchive(id: string) {
    await archiveNotification(id);
    await refreshNotifications();
  }

  async function handleNotificationSnooze(id: string) {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await snoozeNotification(id, until);
    await refreshNotifications();
  }

  async function handleNotificationStatusChange(status: "active" | "read" | "archived") {
    setNotificationStatus(status);
    await refreshNotifications(status);
  }

  async function handleAuvoFilterChange(status: AuvoWebhookStatus | "") {
    setAuvoFilter(status);
    await refreshAuvo(status);
  }

  async function handleOpenAuvoEvent(id: string) {
    setSelectedAuvoEvent(await loadAuvoWebhookEvent(id));
  }

  async function handleReprocessAuvoEvent(id: string) {
    setSelectedAuvoEvent(await reprocessAuvoWebhookEvent(id));
    await refreshAuvo();
  }

  async function handleIgnoreAuvoEvent(id: string) {
    setSelectedAuvoEvent(await ignoreAuvoWebhookEvent(id));
    await refreshAuvo();
  }

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createCustomer({ tipoPessoa: "fisica", ...customerForm });
      setCustomerForm({ nome: "", telefone: "", email: "", empresa: "", bairro: "", cidade: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar o cliente.");
    }
  }

  async function handleCreateOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createOpportunity({
        ...opportunityForm,
        etapaId: defaultStageId,
        responsavelId: authState.user.id,
      });
      setOpportunityForm((current) => ({ ...current, titulo: "", proximaAcao: "", proximaAcaoEm: "" }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar a oportunidade.");
    }
  }

  async function handleArchiveCustomer(customer: Customer) {
    if (!window.confirm(`Arquivar ${customer.nome}? O historico sera preservado.`)) return;
    await archiveCustomer(customer.id);
    await refresh();
  }

  async function handleCreateActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createActivity({
        customerId: activityForm.customerId,
        opportunityId: activityForm.opportunityId || null,
        type: activityForm.type,
        description: activityForm.description,
      });
      setActivityForm((current) => ({ ...current, description: "" }));
      await refresh();
      await openCustomerTimeline(activityForm.customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel registrar a atividade.");
    }
  }

  async function handleCreateNextAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createNextAction({
        customerId: nextActionForm.customerId,
        opportunityId: nextActionForm.opportunityId || null,
        responsibleUserId: authState.user.id,
        category: nextActionForm.category,
        title: nextActionForm.title,
        dueAt: nextActionForm.dueAt,
        priority: nextActionForm.priority,
      });
      setNextActionForm((current) => ({ ...current, title: "", dueAt: "" }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel criar a proxima acao.");
    }
  }

  async function handleEditCustomer(customer: Customer) {
    const telefone = window.prompt("Telefone do cliente", customer.telefone ?? "");
    if (telefone === null) return;
    await updateCustomer(customer.id, { telefone });
    await refresh();
  }

  async function handleEditOpportunity(opportunity: Opportunity) {
    const proximaAcao = window.prompt("Proxima acao", opportunity.proximaAcao ?? "");
    if (!proximaAcao) return;
    const proximaAcaoEm = window.prompt("Data da proxima acao em ISO ou AAAA-MM-DDTHH:mm", opportunity.proximaAcaoEm ?? "");
    if (!proximaAcaoEm) return;
    await updateOpportunity(opportunity.id, { proximaAcao, proximaAcaoEm });
    await refresh();
  }

  async function handleApproveOpportunity(opportunity: Opportunity) {
    const valorAprovado = window.prompt("Valor aprovado em centavos. Exemplo: 150000 para R$ 1.500,00");
    const previsaoExecucao = window.prompt("Previsao de execucao no formato AAAA-MM-DD");
    if (!valorAprovado || !previsaoExecucao) return;
    await approveOpportunity(opportunity.id, {
      valorAprovado: Number(valorAprovado),
      formaPagamento: "a vista",
      quantidadeParcelas: 1,
      previsaoExecucao,
    });
    await refresh();
  }

  async function handleLoseOpportunity(opportunity: Opportunity) {
    if (!firstLossReasonId) {
      setError("Cadastre ou aplique os motivos de perda antes de registrar uma perda.");
      return;
    }
    if (!window.confirm(`Marcar ${opportunity.titulo} como perdida?`)) return;
    await loseOpportunity(opportunity.id, firstLossReasonId);
    await refresh();
  }

  async function handleMoveOpportunityStage(opportunityId: string, etapaId: string) {
    setError(null);
    try {
      await updateOpportunity(opportunityId, { etapaId });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel mover a oportunidade de etapa.");
    }
  }

  async function handleArchiveOpportunity(opportunity: Opportunity) {
    if (!window.confirm(`Arquivar ${opportunity.titulo}? O historico sera preservado.`)) return;
    await archiveOpportunity(opportunity.id);
    await refresh();
  }

  function openActionOperation(action: NextAction, mode: ActionOperation["mode"]) {
    setError(null);
    setActionOperation({
      action,
      mode,
      completionResult: "",
      dueAt: toDateTimeLocalValue(action.dueAt),
      cancellationReason: "",
      nextTitle: "",
      nextDueAt: "",
      nextCategory: action.category,
      nextPriority: "normal",
    });
  }

  async function handleActionOperationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!actionOperation) return;
    setError(null);
    const { action, mode } = actionOperation;
    const replacementRequired = needsReplacementAction(action, snapshot?.opportunities ?? []);
    const nextAction = replacementRequired
      ? {
          customerId: action.customerId,
          opportunityId: action.opportunityId,
          responsibleUserId: authState.user.id,
          category: actionOperation.nextCategory,
          title: actionOperation.nextTitle,
          dueAt: actionOperation.nextDueAt,
          priority: actionOperation.nextPriority,
        }
      : null;

    try {
      if (replacementRequired && (!actionOperation.nextTitle.trim() || !actionOperation.nextDueAt)) {
        setError("Defina a proxima acao antes de concluir esta atividade.");
        return;
      }
      if (mode === "complete") {
        await completeNextAction(action.id, { completionResult: actionOperation.completionResult, nextAction });
      } else if (mode === "postpone") {
        await postponeNextAction(action.id, actionOperation.dueAt);
      } else {
        await cancelNextAction(action.id, actionOperation.cancellationReason, nextAction);
      }
      setActionOperation(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel atualizar a proxima acao.");
    }
  }

  async function openCustomerTimeline(id: string) {
    const customer = snapshot?.customers.find((item) => item.id === id);
    setTimeline(await loadCustomerActivities(id));
    setTimelineTitle(customer ? `Linha do tempo de ${customer.nome}` : "Linha do tempo do cliente");
  }

  async function openOpportunityTimeline(id: string) {
    const opportunity = snapshot?.opportunities.find((item) => item.id === id);
    setTimeline(await loadOpportunityActivities(id));
    setTimelineTitle(opportunity ? `Linha do tempo de ${opportunity.titulo}` : "Linha do tempo da oportunidade");
    if (opportunity) await openOpportunityQuotes(opportunity);
  }

  async function openOpportunityQuotes(opportunity: Opportunity) {
    setQuotesOpportunity(opportunity);
    setQuotes(await loadOpportunityQuotes(opportunity.id));
  }

  async function handleCreateQuote(valorReais: string, resumo: string) {
    if (!quotesOpportunity) return;
    const valor = Math.round(Number(valorReais.replace(",", ".")) * 100);
    if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe um valor valido para o orcamento.");
    await createQuote(quotesOpportunity.id, { valor, resumo: resumo.trim() || undefined });
    setQuotes(await loadOpportunityQuotes(quotesOpportunity.id));
    await refresh();
  }

  async function handleUpdateQuoteStatus(quote: Quote, status: QuoteStatus) {
    setError(null);
    try {
      await updateQuote(quote.id, { status });
      if (quotesOpportunity) setQuotes(await loadOpportunityQuotes(quotesOpportunity.id));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel atualizar o orcamento.");
    }
  }

  function openCenterAction(id: string, mode: ActionOperation["mode"]) {
    const action = snapshot?.nextActions.find((item) => item.id === id);
    if (action) openActionOperation(action, mode);
  }

  async function clearCommercialFilters() {
    setCommercialFilters({});
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadCrmSnapshot(search, {});
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar a Central Comercial.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <div className="brand-row">
          <div className="brand-mark">A</div>
          <div>
            <strong>Artec CRM</strong>
            <span>Comercial</span>
          </div>
        </div>
        <nav>
          <button className="nav-item active" type="button">Clientes e oportunidades</button>
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <label className="search-box">
            <Search aria-hidden="true" />
            <input type="search" placeholder="Buscar no CRM" aria-label="Buscar no CRM" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => {
              if (event.key === "Enter") void refresh();
            }} />
          </label>
          <div className="user-chip">
            <UserRound aria-hidden="true" />
            <span>{authState.user.email}</span>
          </div>
          <div className="notification-shell">
            <button className="icon-button" type="button" aria-label="Abrir notificacoes" onClick={() => setNotificationPanelOpen((open) => !open)}>
              <Bell aria-hidden="true" />
              {notificationCount > 0 ? <span>{notificationCount > 9 ? "9+" : notificationCount}</span> : null}
            </button>
            {notificationPanelOpen ? (
              <div className="notification-popover" role="dialog" aria-label="Notificacoes recentes">
                <header>
                  <strong>Notificacoes</strong>
                  <button className="button ghost" type="button" onClick={handleAllNotificationsRead}>Ler todas</button>
                </header>
                <NotificationList items={notifications.slice(0, 5)} onRead={handleNotificationRead} onArchive={handleNotificationArchive} onSnooze={handleNotificationSnooze} />
              </div>
            ) : null}
          </div>
          <button className="button ghost" type="button" onClick={onLogout}>
            <LogOut aria-hidden="true" />
            Sair
          </button>
        </header>

        <section className="page-heading">
          <div>
            <p className="eyebrow">Marco 4</p>
            <h1>Central Comercial</h1>
          </div>
          <button className="button secondary" type="button" onClick={refresh} disabled={isLoading}>Buscar/atualizar</button>
        </section>

        {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}
        {isLoading ? <LoadingPanels /> : null}

        {!isLoading && snapshot ? (
          <>
            <section className="grid metrics-row" aria-label="Resumo comercial">
              {metrics.map((metric) => (
                <article className="panel metric" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </article>
              ))}
            </section>

            <section className="panel commercial-filters" aria-label="Filtros da Central Comercial">
              <div>
                <p className="eyebrow">Filtros globais</p>
                <h2>Central Comercial</h2>
              </div>
              <div className="filter-grid">
                <label>De<input type="date" value={commercialFilters.from ?? ""} onChange={(event) => setCommercialFilters({ ...commercialFilters, from: event.target.value })} /></label>
                <label>Ate<input type="date" value={commercialFilters.to ?? ""} onChange={(event) => setCommercialFilters({ ...commercialFilters, to: event.target.value })} /></label>
                <label>Responsavel
                  <select value={commercialFilters.responsibleUserId ?? ""} onChange={(event) => setCommercialFilters({ ...commercialFilters, responsibleUserId: event.target.value || undefined })}>
                    <option value="">Todos permitidos</option>
                    {responsibleOptions.map((id) => <option key={id} value={id}>{id === authState.user.id ? "Meu usuario" : `Usuario ${id.slice(0, 8)}`}</option>)}
                  </select>
                </label>
                <label>Etapa
                  <select value={commercialFilters.stageId ?? ""} onChange={(event) => setCommercialFilters({ ...commercialFilters, stageId: event.target.value || undefined })}>
                    <option value="">Todas</option>
                    {snapshot.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.nome}</option>)}
                  </select>
                </label>
                <label>Situacao
                  <select value={commercialFilters.situation ?? ""} onChange={(event) => setCommercialFilters({ ...commercialFilters, situation: event.target.value || undefined })}>
                    <option value="">Todas</option>
                    {situationOptions.map((situation) => <option key={situation} value={situation}>{situation}</option>)}
                  </select>
                </label>
                <label>Tipo de demanda
                  <select value={commercialFilters.demandType ?? ""} onChange={(event) => setCommercialFilters({ ...commercialFilters, demandType: event.target.value || undefined })}>
                    <option value="">Todos</option>
                    {demandTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label>Categoria
                  <select value={commercialFilters.category ?? ""} onChange={(event) => setCommercialFilters({ ...commercialFilters, category: (event.target.value || undefined) as CommercialCenterFilters["category"] })}>
                    <option value="">Todas</option>
                    <option value="commercial">Comercial</option>
                    <option value="warranty">Garantia</option>
                    <option value="support">Suporte</option>
                    <option value="after_sales">Pos-venda</option>
                  </select>
                </label>
                <label>Prioridade
                  <select value={commercialFilters.priority ?? ""} onChange={(event) => setCommercialFilters({ ...commercialFilters, priority: (event.target.value || undefined) as CommercialCenterFilters["priority"] })}>
                    <option value="">Todas</option>
                    <option value="high">Alta</option>
                    <option value="normal">Normal</option>
                    <option value="low">Baixa</option>
                  </select>
                </label>
              </div>
              <div className="filter-actions">
                <button className="button secondary" type="button" onClick={refresh} disabled={isLoading}>Aplicar filtros</button>
                <button className="button ghost" type="button" onClick={clearCommercialFilters} disabled={isLoading || !hasCommercialFilters}>Limpar filtros</button>
              </div>
            </section>

            <section className="commercial-center" aria-label="Central Comercial">
              <CommercialActionBlock title="Acoes vencidas" emptyText="Nenhuma acao vencida." items={snapshot.commercialCenter.overdueActions} onAction={openCenterAction} />
              <CommercialActionBlock title="Acoes de hoje" emptyText="Nenhuma acao prevista para hoje." items={snapshot.commercialCenter.todayActions} onAction={openCenterAction} />
              <CommercialOpportunityBlock title="Oportunidades sem proxima acao" emptyText="Todas as oportunidades ativas possuem acompanhamento." items={snapshot.commercialCenter.opportunitiesWithoutNextAction} onOpen={openOpportunityTimeline} />
              <CommercialOpportunityBlock title="Orcamentos aguardando retorno" emptyText="Nenhum orcamento aguardando retorno." items={snapshot.commercialCenter.quotesAwaitingReturn} onOpen={openOpportunityTimeline} />
              <CommercialActionBlock title="Visitas proximas" emptyText="Nenhuma visita proxima." items={snapshot.commercialCenter.upcomingVisits} onAction={openCenterAction} />
              <CommercialOpportunityBlock title="Oportunidades paradas" emptyText="Nenhuma oportunidade parada." items={snapshot.commercialCenter.stalledOpportunities} onOpen={openOpportunityTimeline} />
              <article className="panel commercial-card">
                <h2>Caixa Auvo</h2>
                <p>{snapshot.commercialCenter.auvoInbox.message}</p>
              </article>
              <article className="panel commercial-card summary-card">
                <h2>Resumo comercial</h2>
                <dl>
                  <div><dt>Novas oportunidades</dt><dd>{snapshot.commercialCenter.summary.newOpportunities}</dd></div>
                  <div><dt>Aprovadas</dt><dd>{snapshot.commercialCenter.summary.approvedOpportunities}</dd></div>
                  <div><dt>Perdidas</dt><dd>{snapshot.commercialCenter.summary.lostOpportunities}</dd></div>
                  <div><dt>Valor aprovado</dt><dd>{formatMoney(snapshot.commercialCenter.summary.approvedValue)}</dd></div>
                  <div><dt>Ticket medio</dt><dd>{formatMoney(snapshot.commercialCenter.summary.averageApprovedTicket)}</dd></div>
                  <div><dt>Conversao simples</dt><dd>{formatPercent(snapshot.commercialCenter.summary.simpleConversionRate)}</dd></div>
                </dl>
              </article>
            </section>

            <section className="data-section pipeline-section" aria-label="Funil comercial">
              <header className="pipeline-section-header">
                <div>
                  <p className="eyebrow">Funil comercial</p>
                  <h2>Oportunidades por etapa</h2>
                </div>
              </header>
              {snapshot.stages.length ? (
                <PipelineBoard
                  stages={snapshot.stages}
                  opportunities={snapshot.opportunities}
                  onMoveStage={handleMoveOpportunityStage}
                  onApprove={handleApproveOpportunity}
                  onLose={handleLoseOpportunity}
                  onOpenTimeline={openOpportunityTimeline}
                />
              ) : (
                <EmptyState title="Nenhuma etapa configurada" text="Configure as etapas do funil para visualizar o quadro." />
              )}
            </section>

            <section className="panel notifications-page" aria-label="Notificacoes internas">
              <header>
                <div>
                  <p className="eyebrow">Marco 5</p>
                  <h2>Notificacoes internas</h2>
                </div>
                <div className="filter-actions">
                  {(["active", "read", "archived"] as const).map((status) => (
                    <button key={status} className={`button ${notificationStatus === status ? "secondary" : "ghost"}`} type="button" onClick={() => void handleNotificationStatusChange(status)}>
                      {formatNotificationStatus(status)}
                    </button>
                  ))}
                  <button className="button secondary" type="button" onClick={() => void refreshNotifications()}>Atualizar</button>
                </div>
              </header>
              <NotificationList items={notifications} onRead={handleNotificationRead} onArchive={handleNotificationArchive} onSnooze={handleNotificationSnooze} />
            </section>

            {canManageIntegrations ? (
              <section className="panel auvo-admin" aria-label="Integracao Auvo">
                <header>
                  <div>
                    <p className="eyebrow">Marco 6</p>
                    <h2>Homologacao Auvo</h2>
                  </div>
                  <div className="filter-actions">
                    <select value={auvoFilter} onChange={(event) => void handleAuvoFilterChange(event.target.value as AuvoWebhookStatus | "")}>
                      <option value="">Todos</option>
                      <option value="received">Recebidos</option>
                      <option value="processing">Processando</option>
                      <option value="processed">Processados</option>
                      <option value="ignored">Ignorados</option>
                      <option value="failed">Falhas</option>
                    </select>
                    <button className="button secondary" type="button" onClick={() => void refreshAuvo()}>
                      <RefreshCw aria-hidden="true" />
                      Atualizar
                    </button>
                  </div>
                </header>
                <div className="auvo-status-grid">
                  <Metric label="Webhook" value={auvoStatus?.configured ? "Configurado" : "Pendente"} />
                  <Metric label="Pendentes" value={auvoStatus?.pendingCount ?? 0} />
                  <Metric label="Falhas" value={auvoStatus?.failedCount ?? 0} />
                  <Metric label="Ultimo evento" value={formatShortDate(auvoStatus?.lastReceivedAt)} />
                </div>
                <div className="auvo-layout">
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Recebido</th><th>Tipo</th><th>Status</th><th>Tentativas</th><th>Acoes</th></tr></thead>
                      <tbody>
                        {auvoEvents.map((event) => (
                          <tr key={event.id}>
                            <td>{formatShortDate(event.receivedAt)}</td>
                            <td>{event.eventType ?? "Nao informado"}</td>
                            <td>{formatAuvoStatus(event.status)}</td>
                            <td>{event.attemptCount}</td>
                            <td>
                              <div className="row-actions">
                                <button className="button ghost" type="button" onClick={() => void handleOpenAuvoEvent(event.id)}>Detalhe</button>
                                <button className="button ghost" type="button" onClick={() => void navigator.clipboard?.writeText(event.id)} aria-label="Copiar ID do evento Auvo">
                                  <Copy aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!auvoEvents.length ? <tr><td colSpan={5}>Nenhum evento recebido nesta homologacao.</td></tr> : null}
                      </tbody>
                    </table>
                  </div>
                  <AuvoEventDetail event={selectedAuvoEvent} onReprocess={handleReprocessAuvoEvent} onIgnore={handleIgnoreAuvoEvent} />
                </div>
              </section>
            ) : null}

            {canViewReports ? <ReportsPanel stages={snapshot.stages} /> : null}

            {canManageUsers ? (
              <AdminPanel stages={snapshot.stages} onStagesChanged={refresh} currentUserId={authState.user.id} />
            ) : null}

            <section className="split-layout">
              <form className="panel compact-form" onSubmit={handleCreateCustomer}>
                <h2>Novo cliente</h2>
                <label>Nome<input required value={customerForm.nome} onChange={(event) => setCustomerForm({ ...customerForm, nome: event.target.value })} /></label>
                <label>Telefone<input value={customerForm.telefone} onChange={(event) => setCustomerForm({ ...customerForm, telefone: event.target.value })} /></label>
                <label>E-mail<input type="email" value={customerForm.email} onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} /></label>
                <label>Empresa<input value={customerForm.empresa} onChange={(event) => setCustomerForm({ ...customerForm, empresa: event.target.value })} /></label>
                <div className="form-row">
                  <label>Bairro<input value={customerForm.bairro} onChange={(event) => setCustomerForm({ ...customerForm, bairro: event.target.value })} /></label>
                  <label>Cidade<input value={customerForm.cidade} onChange={(event) => setCustomerForm({ ...customerForm, cidade: event.target.value })} /></label>
                </div>
                <button className="button primary" type="submit"><Plus aria-hidden="true" />Salvar cliente</button>
              </form>

              <form className="panel compact-form" onSubmit={handleCreateOpportunity}>
                <h2>Nova oportunidade</h2>
                <label>Cliente<select required value={opportunityForm.clienteId} onChange={(event) => setOpportunityForm({ ...opportunityForm, clienteId: event.target.value })}>
                  <option value="">Selecione</option>
                  {activeCustomers.map((customer) => <option value={customer.id} key={customer.id}>{customer.nome}</option>)}
                </select></label>
                <label>Titulo<input required value={opportunityForm.titulo} onChange={(event) => setOpportunityForm({ ...opportunityForm, titulo: event.target.value })} /></label>
                <label>Tipo de demanda<input required value={opportunityForm.tipoDemanda} onChange={(event) => setOpportunityForm({ ...opportunityForm, tipoDemanda: event.target.value })} /></label>
                <label>Situacao<input required value={opportunityForm.situacao} onChange={(event) => setOpportunityForm({ ...opportunityForm, situacao: event.target.value })} /></label>
                <label>Proxima acao<input required value={opportunityForm.proximaAcao} onChange={(event) => setOpportunityForm({ ...opportunityForm, proximaAcao: event.target.value })} /></label>
                <label>Data da proxima acao<input required type="datetime-local" value={opportunityForm.proximaAcaoEm} onChange={(event) => setOpportunityForm({ ...opportunityForm, proximaAcaoEm: event.target.value })} /></label>
                <button className="button primary" type="submit" disabled={!activeCustomers.length}><Plus aria-hidden="true" />Salvar oportunidade</button>
              </form>
            </section>

            <section className="split-layout">
              <form className="panel compact-form" onSubmit={handleCreateActivity}>
                <h2>Registrar atividade</h2>
                <label>Cliente<select required value={activityForm.customerId} onChange={(event) => setActivityForm({ ...activityForm, customerId: event.target.value })}>
                  <option value="">Selecione</option>
                  {activeCustomers.map((customer) => <option value={customer.id} key={customer.id}>{customer.nome}</option>)}
                </select></label>
                <label>Oportunidade<select value={activityForm.opportunityId} onChange={(event) => setActivityForm({ ...activityForm, opportunityId: event.target.value })}>
                  <option value="">Sem oportunidade</option>
                  {snapshot.opportunities.filter((opportunity) => opportunity.clienteId === activityForm.customerId).map((opportunity) => <option value={opportunity.id} key={opportunity.id}>{opportunity.titulo}</option>)}
                </select></label>
                <label>Tipo<select value={activityForm.type} onChange={(event) => setActivityForm({ ...activityForm, type: event.target.value as Activity["type"] })}>
                  <option value="note">Observacao</option><option value="message">Mensagem</option><option value="call">Ligacao</option><option value="visit">Visita</option><option value="follow_up">Follow-up</option><option value="warranty">Garantia</option><option value="support">Suporte</option><option value="after_sales">Pos-venda</option>
                </select></label>
                <label>Descricao<input required value={activityForm.description} onChange={(event) => setActivityForm({ ...activityForm, description: event.target.value })} /></label>
                <button className="button primary" type="submit"><Plus aria-hidden="true" />Registrar atividade</button>
              </form>

              <form className="panel compact-form" onSubmit={handleCreateNextAction}>
                <h2>Criar proxima acao</h2>
                <label>Cliente<select required value={nextActionForm.customerId} onChange={(event) => setNextActionForm({ ...nextActionForm, customerId: event.target.value })}>
                  <option value="">Selecione</option>
                  {activeCustomers.map((customer) => <option value={customer.id} key={customer.id}>{customer.nome}</option>)}
                </select></label>
                <label>Oportunidade<select value={nextActionForm.opportunityId} onChange={(event) => setNextActionForm({ ...nextActionForm, opportunityId: event.target.value })}>
                  <option value="">Atendimento sem oportunidade</option>
                  {snapshot.opportunities.filter((opportunity) => opportunity.clienteId === nextActionForm.customerId).map((opportunity) => <option value={opportunity.id} key={opportunity.id}>{opportunity.titulo}</option>)}
                </select></label>
                <label>Categoria<select value={nextActionForm.category} onChange={(event) => setNextActionForm({ ...nextActionForm, category: event.target.value as NextAction["category"] })}>
                  <option value="commercial">Comercial</option><option value="warranty">Garantia</option><option value="support">Suporte</option><option value="after_sales">Pos-venda</option>
                </select></label>
                <label>Acao<input required value={nextActionForm.title} onChange={(event) => setNextActionForm({ ...nextActionForm, title: event.target.value })} /></label>
                <label>Vencimento<input required type="datetime-local" value={nextActionForm.dueAt} onChange={(event) => setNextActionForm({ ...nextActionForm, dueAt: event.target.value })} /></label>
                <label>Prioridade<select value={nextActionForm.priority} onChange={(event) => setNextActionForm({ ...nextActionForm, priority: event.target.value as NextAction["priority"] })}>
                  <option value="normal">Normal</option><option value="high">Alta</option><option value="low">Baixa</option>
                </select></label>
                <button className="button primary" type="submit"><Clock aria-hidden="true" />Criar proxima acao</button>
              </form>
            </section>

            <section className="data-section">
              <h2>Proximas acoes</h2>
              <div className="segmented-control" aria-label="Filtros de proximas acoes">
                {(["overdue", "today", "upcoming", "completed", "cancelled"] as ActionFilter[]).map((filter) => (
                  <button className={actionFilter === filter ? "active" : ""} type="button" key={filter} onClick={() => setActionFilter(filter)}>
                    {formatActionFilter(filter)}
                  </button>
                ))}
              </div>
              {actionOperation ? (
                <form className="panel compact-form action-operation" onSubmit={handleActionOperationSubmit}>
                  <div>
                    <p className="eyebrow">{actionOperation.action.customerName}</p>
                    <h3>{formatOperationTitle(actionOperation.mode)}</h3>
                  </div>
                  {actionOperation.mode === "complete" ? (
                    <label>Resultado<input required value={actionOperation.completionResult} onChange={(event) => setActionOperation({ ...actionOperation, completionResult: event.target.value })} /></label>
                  ) : null}
                  {actionOperation.mode === "postpone" ? (
                    <label>Novo vencimento<input required type="datetime-local" value={actionOperation.dueAt} onChange={(event) => setActionOperation({ ...actionOperation, dueAt: event.target.value })} /></label>
                  ) : null}
                  {actionOperation.mode === "cancel" ? (
                    <label>Motivo do cancelamento<input required value={actionOperation.cancellationReason} onChange={(event) => setActionOperation({ ...actionOperation, cancellationReason: event.target.value })} /></label>
                  ) : null}
                  {needsReplacementAction(actionOperation.action, snapshot.opportunities) && actionOperation.mode !== "postpone" ? (
                    <fieldset className="replacement-fields">
                      <legend>Nova proxima acao obrigatoria</legend>
                      <label>Acao<input required value={actionOperation.nextTitle} onChange={(event) => setActionOperation({ ...actionOperation, nextTitle: event.target.value })} /></label>
                      <label>Vencimento<input required type="datetime-local" value={actionOperation.nextDueAt} onChange={(event) => setActionOperation({ ...actionOperation, nextDueAt: event.target.value })} /></label>
                      <label>Categoria<select value={actionOperation.nextCategory} onChange={(event) => setActionOperation({ ...actionOperation, nextCategory: event.target.value as NextAction["category"] })}>
                        <option value="commercial">Comercial</option><option value="warranty">Garantia</option><option value="support">Suporte</option><option value="after_sales">Pos-venda</option>
                      </select></label>
                      <label>Prioridade<select value={actionOperation.nextPriority} onChange={(event) => setActionOperation({ ...actionOperation, nextPriority: event.target.value as NextAction["priority"] })}>
                        <option value="normal">Normal</option><option value="high">Alta</option><option value="low">Baixa</option>
                      </select></label>
                    </fieldset>
                  ) : null}
                  <div className="form-actions">
                    <button className="button primary" type="submit">Salvar</button>
                    <button className="button secondary" type="button" onClick={() => setActionOperation(null)}>Cancelar</button>
                  </div>
                </form>
              ) : null}
              {visibleNextActions.length ? (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Acao</th><th>Cliente</th><th>Contexto</th><th>Categoria</th><th>Vencimento</th><th>Prioridade</th><th>Status</th><th>Acoes</th></tr></thead>
                    <tbody>{visibleNextActions.map((action) => (
                      <tr key={action.id}>
                        <td>{action.title}{isOverdue(action) ? <span className="badge danger-badge">vencida</span> : null}</td>
                        <td>{action.customerName}</td>
                        <td>{action.opportunityTitle ?? "Atendimento"}</td>
                        <td><span className="badge">{formatActionCategory(action.category)}</span></td>
                        <td>{formatDateTime(action.dueAt)}</td>
                        <td><span className="badge">{formatPriority(action.priority)}</span></td>
                        <td><span className="badge">{action.status}</span></td>
                        <td className="actions-cell">
                          <button className="button secondary" type="button" disabled={action.status !== "pending"} onClick={() => openActionOperation(action, "complete")}>Concluir</button>
                          <button className="button secondary" type="button" disabled={action.status !== "pending"} onClick={() => openActionOperation(action, "postpone")}>Reagendar</button>
                          <button className="button secondary" type="button" disabled={action.status !== "pending"} onClick={() => openActionOperation(action, "cancel")}>Cancelar</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <EmptyState title="Nenhuma proxima acao" text="Crie uma acao pendente para acompanhar cliente, garantia, suporte ou oportunidade." />}
            </section>

            <section className="data-section">
              <h2>Clientes</h2>
              {activeCustomers.length ? (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Nome</th><th>Telefone</th><th>Empresa</th><th>Oportunidades</th><th>Acoes</th></tr></thead>
                    <tbody>{activeCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.nome}{customer.duplicatePhoneCustomerIds.length ? <span className="badge warning">possivel duplicidade</span> : null}</td>
                        <td>{customer.telefone ?? "-"}</td>
                        <td>{customer.empresa ?? "-"}</td>
                        <td>{customer.opportunitiesCount}</td>
                        <td className="actions-cell">
                          <button className="button secondary" type="button" onClick={() => void openCustomerTimeline(customer.id)}>Historico</button>
                          <button className="icon-button" type="button" aria-label={`Editar ${customer.nome}`} onClick={() => void handleEditCustomer(customer)}><Edit3 aria-hidden="true" /></button>
                          <button className="icon-button" type="button" aria-label={`Arquivar ${customer.nome}`} onClick={() => void handleArchiveCustomer(customer)}><Archive aria-hidden="true" /></button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <EmptyState title="Nenhum cliente cadastrado" text="Cadastre o primeiro cliente para criar oportunidades comerciais." />}
            </section>

            <section className="data-section">
              <h2>Oportunidades</h2>
              {snapshot.opportunities.length ? (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Titulo</th><th>Cliente</th><th>Etapa</th><th>Situacao</th><th>Proxima acao</th><th>Status</th><th>Acoes</th></tr></thead>
                    <tbody>{snapshot.opportunities.map((opportunity) => (
                      <tr key={opportunity.id}>
                        <td>{opportunity.titulo}</td>
                        <td>{opportunity.clienteNome}</td>
                        <td>{opportunity.etapaNome}</td>
                        <td>{opportunity.situacao}</td>
                        <td>{opportunity.proximaAcao ? `${opportunity.proximaAcao} - ${formatDateTime(opportunity.proximaAcaoEm)}` : <span className="badge danger-badge">sem proxima acao</span>}</td>
                        <td><span className="badge">{opportunity.status}</span></td>
                        <td className="actions-cell">
                          <button className="button secondary" type="button" onClick={() => void openOpportunityTimeline(opportunity.id)}>Historico</button>
                          <button className="icon-button" type="button" aria-label={`Aprovar ${opportunity.titulo}`} onClick={() => void handleApproveOpportunity(opportunity)}><CheckCircle2 aria-hidden="true" /></button>
                          <button className="icon-button" type="button" aria-label={`Marcar ${opportunity.titulo} como perdida`} onClick={() => void handleLoseOpportunity(opportunity)}><XCircle aria-hidden="true" /></button>
                          <button className="icon-button" type="button" aria-label={`Editar proxima acao de ${opportunity.titulo}`} onClick={() => void handleEditOpportunity(opportunity)}><Edit3 aria-hidden="true" /></button>
                          <button className="icon-button" type="button" aria-label={`Arquivar ${opportunity.titulo}`} onClick={() => void handleArchiveOpportunity(opportunity)}><Archive aria-hidden="true" /></button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <EmptyState title="Nenhuma oportunidade cadastrada" text="Crie uma oportunidade com responsavel, proxima acao e data." />}
            </section>

            <section className="data-section timeline-section">
              <h2>{timelineTitle}</h2>
              {timeline.length ? (
                <ol className="timeline-list">
                  {timeline.map((activity) => (
                    <li key={activity.id}>
                      <strong>{formatActivityType(activity.type)}</strong>
                      <span>{formatDateTime(activity.occurredAt)}</span>
                      <p>{activity.description}</p>
                    </li>
                  ))}
                </ol>
              ) : <EmptyState title="Historico vazio" text="Abra um cliente ou oportunidade, ou registre uma atividade para preencher a linha do tempo." />}
            </section>

            <QuotesPanel opportunity={quotesOpportunity} quotes={quotes} onCreate={handleCreateQuote} onUpdateStatus={handleUpdateQuoteStatus} />
          </>
        ) : null}
      </main>
    </div>
  );
}

function getAuthBlockedCopy(state: Exclude<AuthState, { status: "loading" | "authenticated" | "anonymous" | "error" }>) {
  if (state.status === "not_configured") return { title: "Ambiente nao configurado", message: state.message };
  if (state.status === "membership_missing") return { title: "Acesso nao liberado", message: state.message };
  if (state.status === "membership_inactive") return { title: "Acesso inativo", message: state.message };
  if (state.status === "access_denied") return { title: "Acesso negado", message: state.message };
  return { title: "API temporariamente indisponivel", message: state.message };
}

function LoginForm({ email, password, isSubmitting, onEmailChange, onPasswordChange, onSubmit }: {
  email: string;
  password: string;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label><span>E-mail</span><input value={email} type="email" autoComplete="email" required onChange={(event) => onEmailChange(event.target.value)} /></label>
      <label><span>Senha</span><input value={password} type="password" autoComplete="current-password" required onChange={(event) => onPasswordChange(event.target.value)} /></label>
      <button className="button primary" type="submit" disabled={isSubmitting}>
        <LogIn aria-hidden="true" />
        {isSubmitting ? "Entrando" : "Entrar no CRM"}
      </button>
    </form>
  );
}

function LoadingPanels() {
  return (
    <section className="split-layout" aria-busy="true">
      <div className="panel"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-line" /></div>
      <div className="panel"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-line" /></div>
    </section>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function CommercialActionBlock({ title, emptyText, items, onAction }: {
  title: string;
  emptyText: string;
  items: CommercialCenterActionItem[];
  onAction: (id: string, mode: ActionOperation["mode"]) => void;
}) {
  return (
    <article className="panel commercial-card">
      <header>
        <h2>{title}</h2>
        <span className="badge">{items.length}</span>
      </header>
      {items.length ? (
        <ul className="work-list">
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.customerName}{item.opportunityTitle ? ` - ${item.opportunityTitle}` : ""}</span>
                <small>{formatActionCategory(item.category)} - {formatDateTime(item.dueAt)}{item.overdueHours ? ` - ${item.overdueHours}h em atraso` : ""}</small>
              </div>
              <div className="quick-actions">
                <button className="button secondary" type="button" onClick={() => onAction(item.id, "complete")}>Concluir</button>
                <button className="button secondary" type="button" onClick={() => onAction(item.id, "postpone")}>Reagendar</button>
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState title={emptyText} text="Nada exige acao imediata neste bloco." />}
    </article>
  );
}

function CommercialOpportunityBlock({ title, emptyText, items, onOpen }: {
  title: string;
  emptyText: string;
  items: CommercialCenterOpportunityItem[];
  onOpen: (id: string) => Promise<void>;
}) {
  return (
    <article className="panel commercial-card">
      <header>
        <h2>{title}</h2>
        <span className="badge">{items.length}</span>
      </header>
      {items.length ? (
        <ul className="work-list">
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.customerName} - {item.stageName}</span>
                <small>{item.situation} - {item.daysOpen} dias em aberto{item.nextActionDueAt ? ` - ${formatDateTime(item.nextActionDueAt)}` : ""}</small>
              </div>
              <button className="button secondary" type="button" onClick={() => void onOpen(item.id)}>Abrir</button>
            </li>
          ))}
        </ul>
      ) : <EmptyState title={emptyText} text="A Central nao encontrou pendencias neste bloco." />}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AuvoEventDetail({ event, onReprocess, onIgnore }: {
  event: AuvoWebhookEvent | null;
  onReprocess: (id: string) => void | Promise<void>;
  onIgnore: (id: string) => void | Promise<void>;
}) {
  if (!event) {
    return (
      <aside className="auvo-detail">
        <EmptyState title="Selecione um evento" text="O payload exibido aqui sempre passa por sanitizacao." />
      </aside>
    );
  }

  const canChange = event.status !== "processed";

  return (
    <aside className="auvo-detail">
      <header>
        <div>
          <p className="eyebrow">{event.eventType ?? "Evento sem tipo"}</p>
          <h3>{formatAuvoStatus(event.status)}</h3>
        </div>
        <span className="badge">{event.id.slice(0, 8)}</span>
      </header>
      <dl className="detail-list">
        <div><dt>Recebido</dt><dd>{formatDateTime(event.receivedAt)}</dd></div>
        <div><dt>Hash</dt><dd>{event.payloadHash.slice(0, 16)}</dd></div>
        <div><dt>Tamanho</dt><dd>{event.contentLength ?? "Nao informado"}</dd></div>
        <div><dt>Erro</dt><dd>{event.lastError ?? "Nenhum"}</dd></div>
      </dl>
      <div className="quick-actions">
        <button className="button secondary" type="button" disabled={!canChange} onClick={() => void onReprocess(event.id)}>Reprocessar</button>
        <button className="button ghost" type="button" disabled={!canChange} onClick={() => void onIgnore(event.id)}>Ignorar</button>
      </div>
      <pre className="payload-preview">{JSON.stringify(event.sanitizedPayload, null, 2)}</pre>
    </aside>
  );
}

function NotificationList({ items, onRead, onArchive, onSnooze }: {
  items: Notification[];
  onRead: (id: string) => void | Promise<void>;
  onArchive: (id: string) => void | Promise<void>;
  onSnooze: (id: string) => void | Promise<void>;
}) {
  if (items.length === 0) {
    return <EmptyState title="Nenhuma notificacao pendente" text="Voce esta em dia." />;
  }

  return (
    <ul className="notification-list">
      {items.map((item) => (
        <li key={item.id} className={item.status === "unread" ? "is-unread" : ""}>
          <div>
            <span className={`severity ${item.severity}`}>{formatNotificationSeverity(item.severity)}</span>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            <small>{formatDateTime(item.createdAt)} - {formatNotificationStatus(item.status)}</small>
          </div>
          <div className="quick-actions">
            {item.status === "unread" ? <button className="button ghost" type="button" onClick={() => void onRead(item.id)}>Lida</button> : null}
            <button className="button ghost" type="button" onClick={() => void onSnooze(item.id)}>Adiar</button>
            <button className="button ghost" type="button" onClick={() => void onArchive(item.id)}>Arquivar</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatAuvoStatus(status: AuvoWebhookStatus): string {
  if (status === "received") return "Recebido";
  if (status === "processing") return "Processando";
  if (status === "processed") return "Processado";
  if (status === "ignored") return "Ignorado";
  return "Falha";
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

function formatNotificationSeverity(severity: Notification["severity"]): string {
  if (severity === "urgent") return "Urgente";
  if (severity === "attention") return "Atencao";
  return "Informativa";
}

function formatNotificationStatus(status: Notification["status"] | "active"): string {
  if (status === "active") return "Pendentes";
  if (status === "unread") return "Nao lida";
  if (status === "read") return "Lida";
  if (status === "archived") return "Arquivada";
  return "Resolvida";
}

function toDateTimeLocalValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function isOverdue(action: NextAction): boolean {
  return action.status === "pending" && new Date(action.dueAt).getTime() < Date.now();
}

function isTodayAction(action: NextAction): boolean {
  if (action.status !== "pending") return false;
  const now = new Date();
  const due = new Date(action.dueAt);
  return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
}

function filterNextActions(actions: NextAction[], filter: ActionFilter): NextAction[] {
  return actions.filter((action) => {
    if (filter === "overdue") return isOverdue(action);
    if (filter === "today") return isTodayAction(action);
    if (filter === "upcoming") return action.status === "pending" && !isOverdue(action) && !isTodayAction(action);
    return action.status === filter;
  });
}

function formatActionFilter(filter: ActionFilter): string {
  const labels: Record<ActionFilter, string> = {
    overdue: "Vencidas",
    today: "Hoje",
    upcoming: "Proximas",
    completed: "Concluidas",
    cancelled: "Canceladas",
  };
  return labels[filter];
}

function uniqueValues(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))));
}

function formatOperationTitle(mode: ActionOperation["mode"]): string {
  if (mode === "complete") return "Concluir proxima acao";
  if (mode === "postpone") return "Reagendar proxima acao";
  return "Cancelar proxima acao";
}

function needsReplacementAction(action: NextAction, opportunities: Opportunity[]): boolean {
  return opportunities.some((opportunity) =>
    opportunity.status === "ativa" &&
    opportunity.currentNextActionId === action.id &&
    opportunity.id === action.opportunityId,
  );
}

function formatPriority(priority: NextAction["priority"]): string {
  if (priority === "high") return "Alta";
  if (priority === "low") return "Baixa";
  return "Normal";
}

function formatActionCategory(category: NextAction["category"]): string {
  const labels: Record<NextAction["category"], string> = {
    commercial: "Comercial",
    warranty: "Garantia",
    support: "Suporte",
    after_sales: "Pos-venda",
  };
  return labels[category];
}

function formatActivityType(type: Activity["type"]): string {
  const labels: Record<Activity["type"], string> = {
    note: "Observacao",
    message: "Mensagem",
    call: "Ligacao",
    visit: "Visita",
    meeting: "Reuniao",
    follow_up: "Follow-up",
    quote_sent: "Orcamento enviado",
    stage_change: "Mudanca de etapa",
    owner_change: "Mudanca de responsavel",
    approval: "Aprovacao",
    loss: "Perda",
    warranty: "Garantia",
    support: "Suporte",
    after_sales: "Pos-venda",
    system: "Sistema",
  };
  return labels[type];
}
