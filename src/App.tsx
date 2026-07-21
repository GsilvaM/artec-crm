import { AlertCircle, Archive, CheckCircle2, Clock, Copy, Edit3, LogIn, LogOut, Plus, RefreshCw, Search, XCircle } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { readSupabaseSession, signInWithPassword, signOut, type AuthState } from "./domain/auth";
import { formatActivityType, formatDateTime, formatMoney } from "./domain/format";
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
  loadMoreCustomers,
  loadMoreOpportunities,
  ignoreAuvoWebhookEvent,
  loadCustomerActivities,
  loadOpportunityQuotes,
  loadAuvoIntegrationStatus,
  loadAuvoWebhookEvent,
  loadAuvoWebhookEvents,
  loadNotifications,
  loadOpportunityActivities,
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
import { AuvoInboxPanel } from "./components/AuvoInboxPanel";
import { AppLayout } from "./components/layout/AppLayout";
import { EmptyState } from "./components/ui/EmptyState";
import { LoadingPanels } from "./components/ui/Skeleton";
import { NotificationList, formatNotificationStatus } from "./components/ui/NotificationList";
import { CentralComercialPage } from "./features/commercial-center/CentralComercialPage";
import { ProximasAcoesPage } from "./features/next-actions/ProximasAcoesPage";
import { OportunidadePage } from "./features/opportunities/OportunidadePage";
import { ClientePage } from "./features/customers/ClientePage";

const SECTION_ID_BY_PATH: Record<string, string> = {
  "/pipeline": "pipeline-section",
  "/clientes": "clientes-section",
  "/oportunidades": "oportunidades-section",
  "/notificacoes": "notificacoes-section",
  "/configuracoes/integracoes/auvo": "auvo-admin-section",
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

  const canManageIntegrations = authState.user.permissions.includes("integrations:read");

  return (
    <Routes>
      <Route element={<AppLayout userEmail={authState.user.email} onLogout={handleLogout} canManageIntegrations={canManageIntegrations} />}>
        <Route path="central-comercial" element={<CentralComercialPage currentUserId={authState.user.id} />} />
        <Route path="proximas-acoes" element={<ProximasAcoesPage currentUserId={authState.user.id} />} />
        <Route path="oportunidades/:id" element={<OportunidadePage currentUserId={authState.user.id} canManageUsers={authState.user.permissions.includes("users:manage")} />} />
        <Route path="clientes/:id" element={<ClientePage currentUserId={authState.user.id} />} />
        <Route index element={<Navigate to="/central-comercial" replace />} />
        <Route path="*" element={<AuthenticatedApp authState={authState} onLogout={handleLogout} />} />
      </Route>
    </Routes>
  );
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
  const [timeline, setTimeline] = useState<Activity[]>([]);
  const [timelineTitle, setTimelineTitle] = useState("Linha do tempo");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationStatus, setNotificationStatus] = useState<"active" | "read" | "archived">("active");
  const [auvoStatus, setAuvoStatus] = useState<AuvoIntegrationStatus | null>(null);
  const [auvoEvents, setAuvoEvents] = useState<AuvoWebhookEvent[]>([]);
  const [selectedAuvoEvent, setSelectedAuvoEvent] = useState<AuvoWebhookEvent | null>(null);
  const [auvoFilter, setAuvoFilter] = useState<AuvoWebhookStatus | "">("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesOpportunity, setQuotesOpportunity] = useState<Opportunity | null>(null);
  const [isLoadingMoreCustomers, setIsLoadingMoreCustomers] = useState(false);
  const [isLoadingMoreOpportunities, setIsLoadingMoreOpportunities] = useState(false);

  const activeCustomers = snapshot?.customers.filter((customer) => !customer.archivedAt) ?? [];
  const activeOpportunities = snapshot?.opportunities.filter((opportunity) => opportunity.status === "ativa") ?? [];
  const opportunitiesWithoutNextAction = activeOpportunities.filter((opportunity) => !opportunity.proximaAcao || !opportunity.proximaAcaoEm);
  const defaultStageId = snapshot?.stages[0]?.id;
  const firstLossReasonId = snapshot?.lossReasons[0]?.id;
  const canManageIntegrations = authState.user.permissions.includes("integrations:read");
  const canManageUsers = authState.user.permissions.includes("users:manage");
  const canViewReports = authState.user.permissions.includes("reports:read");
  const canManageAuvoInbox = authState.user.permissions.includes("auvo_inbox:read");

  const location = useLocation();

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const sectionId = SECTION_ID_BY_PATH[location.pathname];
    if (!sectionId) return;
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.pathname]);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadCrmSnapshot(search);
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
    setNotifications((await loadNotifications({ status, limit: "20" })).notifications);
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

  async function handleLoadMoreCustomers() {
    if (!snapshot?.customersNextCursor) return;
    setIsLoadingMoreCustomers(true);
    try {
      const page = await loadMoreCustomers(snapshot.customersNextCursor, search);
      setSnapshot((current) =>
        current ? { ...current, customers: [...current.customers, ...page.customers], customersNextCursor: page.nextCursor } : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar mais clientes.");
    } finally {
      setIsLoadingMoreCustomers(false);
    }
  }

  async function handleLoadMoreOpportunities() {
    if (!snapshot?.opportunitiesNextCursor) return;
    setIsLoadingMoreOpportunities(true);
    try {
      const page = await loadMoreOpportunities(snapshot.opportunitiesNextCursor, search);
      setSnapshot((current) =>
        current ? { ...current, opportunities: [...current.opportunities, ...page.opportunities], opportunitiesNextCursor: page.nextCursor } : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar mais oportunidades.");
    } finally {
      setIsLoadingMoreOpportunities(false);
    }
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

  return (
    <>
        {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}
        {isLoading ? <LoadingPanels /> : null}

        {!isLoading && snapshot ? (
          <>
            <section id="pipeline-section" className="data-section pipeline-section" aria-label="Funil comercial">
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

            <section id="notificacoes-section" className="panel notifications-page" aria-label="Notificacoes internas">
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
              <section id="auvo-admin-section" className="panel auvo-admin" aria-label="Integracao Auvo">
                <header>
                  <div>
                    <p className="eyebrow">Marco 6</p>
                    <h2>Homologacao Auvo</h2>
                  </div>
                  <div className="filter-actions">
                    <select aria-label="Filtrar eventos Auvo por status" value={auvoFilter} onChange={(event) => void handleAuvoFilterChange(event.target.value as AuvoWebhookStatus | "")}>
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

            {canManageAuvoInbox ? <AuvoInboxPanel customers={activeCustomers} currentUserId={authState.user.id} /> : null}

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

            <section id="clientes-section" className="data-section">
              <div className="pipeline-section-header">
                <h2>Clientes e oportunidades</h2>
                <label className="search-box">
                  <Search aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Filtrar por nome, telefone ou empresa"
                    aria-label="Filtrar clientes e oportunidades"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void refresh();
                    }}
                  />
                </label>
              </div>
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
                          <Link className="button secondary" to={`/clientes/${customer.id}`}>Abrir</Link>
                          <button className="icon-button" type="button" aria-label={`Editar ${customer.nome}`} onClick={() => void handleEditCustomer(customer)}><Edit3 aria-hidden="true" /></button>
                          <button className="icon-button" type="button" aria-label={`Arquivar ${customer.nome}`} onClick={() => void handleArchiveCustomer(customer)}><Archive aria-hidden="true" /></button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <EmptyState title="Nenhum cliente cadastrado" text="Cadastre o primeiro cliente para criar oportunidades comerciais." />}
              {snapshot.customersNextCursor ? (
                <button className="button secondary" type="button" disabled={isLoadingMoreCustomers} onClick={() => void handleLoadMoreCustomers()}>
                  {isLoadingMoreCustomers ? "Carregando..." : "Carregar mais clientes"}
                </button>
              ) : null}
            </section>

            <section id="oportunidades-section" className="data-section">
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
                          <Link className="button secondary" to={`/oportunidades/${opportunity.id}`}>Abrir</Link>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <EmptyState title="Nenhuma oportunidade cadastrada" text="Crie uma oportunidade com responsavel, proxima acao e data." />}
              {snapshot.opportunitiesNextCursor ? (
                <button className="button secondary" type="button" disabled={isLoadingMoreOpportunities} onClick={() => void handleLoadMoreOpportunities()}>
                  {isLoadingMoreOpportunities ? "Carregando..." : "Carregar mais oportunidades"}
                </button>
              ) : null}
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
    </>
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

