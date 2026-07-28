import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Clock, FileText, Inbox, ListChecks, Plus, RefreshCw, SlidersHorizontal, Target, Undo2, Users, Wallet, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Drawer } from "../../components/ui/Drawer";
import { Tabs } from "../../components/ui/Tabs";
import { NotificationList } from "../../components/ui/NotificationList";
import { Card, CardContent } from "../../components/ui/card";
import { QuickOpportunityModal } from "../../components/QuickOpportunityModal";
import { formatDateTime, formatMoney } from "../../domain/format";
import {
  loadCommercialCenter,
  loadPipelineStages,
  TIPO_DEMANDA_OPTIONS,
  type CommercialCenter,
  type CommercialCenterFilters,
  type PipelineStage,
} from "../../domain/crm";
import { useNotifications } from "../notifications/useNotifications";
import { useActionOperation, type ActionOperationTarget } from "../next-actions/useActionOperation";
import { ActionOperationForm } from "../next-actions/ActionOperationForm";
import { CommercialActionBlock } from "./CommercialActionBlock";
import { CommercialOpportunityBlock } from "./CommercialOpportunityBlock";
import { CommercialMetricCard } from "./CommercialMetricCard";
import { CommercialVisitBlock } from "./CommercialVisitBlock";

const CATEGORY_FILTER_LABELS: Record<string, string> = {
  commercial: "Comercial",
  warranty: "Garantia",
  support: "Suporte",
  after_sales: "Pós-venda",
};

const PRIORITY_FILTER_LABELS: Record<string, string> = {
  high: "Alta",
  normal: "Normal",
  low: "Baixa",
};

const LESS_COMMON_FILTER_KEYS: Array<keyof CommercialCenterFilters> = ["situation", "demandType", "category", "priority"];

export function CentralComercialPage({ currentUserId }: { currentUserId: string }) {
  const [filters, setFilters] = useState<CommercialCenterFilters>({});
  const [center, setCenter] = useState<CommercialCenter | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isQuickOpportunityOpen, setIsQuickOpportunityOpen] = useState(false);
  const [queueTab, setQueueTab] = useState<"overdue" | "today">("overdue");
  const [hygieneTab, setHygieneTab] = useState<"without-action" | "stalled">("without-action");
  const navigate = useNavigate();
  const notifications = useNotifications({ status: "active", limit: "5" });

  const priorityRef = useRef<HTMLElement>(null);
  const agendaRef = useRef<HTMLElement>(null);
  const quotesRef = useRef<HTMLElement>(null);
  const hygieneRef = useRef<HTMLElement>(null);

  async function refresh(nextFilters: CommercialCenterFilters = filters) {
    setIsLoading(true);
    setError(null);
    try {
      const [centerData, stageData] = await Promise.all([loadCommercialCenter(nextFilters), loadPipelineStages()]);
      setCenter(centerData);
      setStages(stageData);
      await notifications.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a Central Comercial.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionOperation = useActionOperation(currentUserId, refresh);
  const hasFilters = Object.values(filters).some((value) => Boolean(value));
  const drawerFilterCount = LESS_COMMON_FILTER_KEYS.filter((key) => Boolean(filters[key])).length;

  function openOpportunity(id: string) {
    navigate(`/oportunidades/${id}`);
  }

  // Os 6 paineis operacionais ficam sempre visiveis (grid de altura fixa,
  // ADR-0004) — nao ha mais "rolar ate o bloco". O clique no metric card move
  // o foco de teclado/leitor de tela para o painel correspondente (e troca a
  // aba, quando existe) em vez de scrollIntoView.
  function focusPanel(ref: typeof priorityRef) {
    ref.current?.focus({ preventScroll: true });
  }

  function toActionTarget(item: { id: string; customerId: string; customerName: string; opportunityId: string | null; category: ActionOperationTarget["category"]; dueAt: string }): ActionOperationTarget {
    return { id: item.id, customerId: item.customerId, customerName: item.customerName, opportunityId: item.opportunityId, category: item.category, dueAt: item.dueAt };
  }

  async function clearFilter(key: keyof CommercialCenterFilters) {
    const next = { ...filters, [key]: undefined };
    setFilters(next);
    await refresh(next);
  }

  async function applyAndCloseDrawer() {
    setIsFilterDrawerOpen(false);
    await refresh();
  }

  const stageName = stages.find((stage) => stage.id === filters.stageId)?.nome;
  const filterChipCandidates: Array<{ key: keyof CommercialCenterFilters; label: string } | null> = [
    filters.from ? { key: "from", label: `De ${formatShortDate(filters.from)}` } : null,
    filters.to ? { key: "to", label: `Até ${formatShortDate(filters.to)}` } : null,
    filters.stageId ? { key: "stageId", label: `Etapa: ${stageName ?? filters.stageId}` } : null,
    filters.situation ? { key: "situation", label: `Situação: ${filters.situation}` } : null,
    filters.demandType
      ? { key: "demandType", label: `Demanda: ${TIPO_DEMANDA_OPTIONS.find((option) => option.value === filters.demandType)?.label ?? filters.demandType}` }
      : null,
    filters.category ? { key: "category", label: `Categoria: ${CATEGORY_FILTER_LABELS[filters.category] ?? filters.category}` } : null,
    filters.priority ? { key: "priority", label: `Prioridade: ${PRIORITY_FILTER_LABELS[filters.priority] ?? filters.priority}` } : null,
  ];
  const activeFilterChips = filterChipCandidates.filter(
    (chip): chip is { key: keyof CommercialCenterFilters; label: string } => chip !== null,
  );

  const auvoPending = center?.auvoInbox.pending ?? 0;

  return (
    <>
      <section id="central-comercial" className="commercial-page-header">
        <div className="commercial-page-header-text">
          <p className="eyebrow">Operação do dia</p>
          <h1>Central Comercial</h1>
          <p className="description">Priorize ações, visitas e retornos que exigem atenção agora.</p>
        </div>
        <div className="commercial-page-header-actions">
          {center ? <span className="commercial-page-header-updated">Atualizado {formatDateTime(center.generatedAt)}</span> : null}
          <button className="button secondary" type="button" onClick={() => void refresh()} disabled={isLoading}>
            <RefreshCw aria-hidden="true" />
            Atualizar
          </button>
          <button className="button primary" type="button" onClick={() => setIsQuickOpportunityOpen(true)}>
            <Plus aria-hidden="true" />
            Nova oportunidade
          </button>
        </div>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {actionOperation.operation ? (
        <ActionOperationForm
          operation={actionOperation.operation}
          error={actionOperation.error}
          onChange={actionOperation.update}
          onSubmit={() => void actionOperation.submit()}
          onCancel={actionOperation.close}
        />
      ) : null}

      {isQuickOpportunityOpen ? (
        <QuickOpportunityModal
          currentUserId={currentUserId}
          onClose={() => setIsQuickOpportunityOpen(false)}
          onCreated={() => refresh()}
        />
      ) : null}

      {isLoading || !center ? (
        <CommercialCenterSkeleton />
      ) : (
        <>
          <div className="commercial-metrics-strip" aria-label="Indicadores comerciais do dia">
            <CommercialMetricCard label="Ações vencidas" value={center.overdueActions.length} tone="danger" icon={<AlertTriangle aria-hidden="true" />} onClick={() => { setQueueTab("overdue"); focusPanel(priorityRef); }} />
            <CommercialMetricCard label="Ações para hoje" value={center.todayActions.length} tone="warning" icon={<Clock aria-hidden="true" />} onClick={() => { setQueueTab("today"); focusPanel(priorityRef); }} />
            <CommercialMetricCard label="Visitas agendadas" value={center.upcomingVisits.length} tone="informative" icon={<CalendarClock aria-hidden="true" />} onClick={() => focusPanel(agendaRef)} />
            <CommercialMetricCard label="Orçamentos aguardando" value={center.quotesAwaitingReturn.length} tone="informative" icon={<Undo2 aria-hidden="true" />} onClick={() => focusPanel(quotesRef)} />
            <CommercialMetricCard label="Sem próxima ação" value={center.opportunitiesWithoutNextAction.length} tone="warning" icon={<ListChecks aria-hidden="true" />} onClick={() => { setHygieneTab("without-action"); focusPanel(hygieneRef); }} />
            <CommercialMetricCard label="Caixa Auvo" value={auvoPending} tone={auvoPending > 0 ? "informative" : "neutral"} icon={<Inbox aria-hidden="true" />} onClick={() => navigate("/caixa-auvo")} />
          </div>

          <section className="commercial-filter-toolbar" aria-label="Filas da Central Comercial">
            <div className="commercial-filter-tabs" role="tablist" aria-label="Filas comerciais">
              <button type="button" onClick={() => { setQueueTab("overdue"); focusPanel(priorityRef); }} className={queueTab === "overdue" ? "is-active" : undefined}>
                Vencidas <span>{center.overdueActions.length}</span>
              </button>
              <button type="button" onClick={() => { setQueueTab("today"); focusPanel(priorityRef); }} className={queueTab === "today" ? "is-active" : undefined}>
                Hoje <span>{center.todayActions.length}</span>
              </button>
              <button type="button" onClick={() => focusPanel(agendaRef)}>
                Visitas <span>{center.upcomingVisits.length}</span>
              </button>
              <button type="button" onClick={() => focusPanel(quotesRef)}>
                Retornos <span>{center.quotesAwaitingReturn.length}</span>
              </button>
              <button type="button" onClick={() => { setHygieneTab("without-action"); focusPanel(hygieneRef); }}>
                Sem ação <span>{center.opportunitiesWithoutNextAction.length}</span>
              </button>
              <button type="button" onClick={() => navigate("/caixa-auvo")}>
                Caixa Auvo <span>{auvoPending}</span>
              </button>
            </div>
            <button className="button secondary commercial-filter-button" type="button" onClick={() => setIsFilterDrawerOpen(true)}>
              <SlidersHorizontal aria-hidden="true" />
              Filtros{activeFilterChips.length ? ` (${activeFilterChips.length})` : ""}
            </button>
          </section>

          {activeFilterChips.length ? (
            <ul className="active-filter-chips" aria-label="Filtros ativos">
              {activeFilterChips.map((chip) => (
                <li key={chip.key}>
                  <button type="button" onClick={() => void clearFilter(chip.key)} aria-label={`Remover filtro ${chip.label}`}>
                    {chip.label}
                    <X aria-hidden="true" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {isFilterDrawerOpen ? (
            <Drawer title="Mais filtros" subtitle="Central Comercial" onClose={() => setIsFilterDrawerOpen(false)}>
              <div className="commercial-filter-drawer-grid">
                <label>De<input type="date" value={filters.from ?? ""} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
                <label>Até<input type="date" value={filters.to ?? ""} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
                <label>Etapa
                  <select value={filters.stageId ?? ""} onChange={(event) => setFilters({ ...filters, stageId: event.target.value || undefined })}>
                    <option value="">Todas</option>
                    {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.nome}</option>)}
                  </select>
                </label>
                <label>Situação
                  <input value={filters.situation ?? ""} onChange={(event) => setFilters({ ...filters, situation: event.target.value || undefined })} placeholder="ex: aguardando cliente" />
                </label>
                <label>Tipo de demanda
                  <select value={filters.demandType ?? ""} onChange={(event) => setFilters({ ...filters, demandType: event.target.value || undefined })}>
                    <option value="">Todos</option>
                    {TIPO_DEMANDA_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label>Categoria
                  <select value={filters.category ?? ""} onChange={(event) => setFilters({ ...filters, category: (event.target.value || undefined) as CommercialCenterFilters["category"] })}>
                    <option value="">Todas</option>
                    <option value="commercial">Comercial</option>
                    <option value="warranty">Garantia</option>
                    <option value="support">Suporte</option>
                    <option value="after_sales">Pós-venda</option>
                  </select>
                </label>
                <label>Prioridade
                  <select value={filters.priority ?? ""} onChange={(event) => setFilters({ ...filters, priority: (event.target.value || undefined) as CommercialCenterFilters["priority"] })}>
                    <option value="">Todas</option>
                    <option value="high">Alta</option>
                    <option value="normal">Normal</option>
                    <option value="low">Baixa</option>
                  </select>
                </label>
                <button className="button primary" type="button" onClick={() => void applyAndCloseDrawer()}>Aplicar filtros</button>
                <button className="button ghost" type="button" onClick={() => { setFilters({}); void refresh({}); }} disabled={!hasFilters}>Limpar filtros</button>
              </div>
            </Drawer>
          ) : null}

          <section className="commercial-center commercial-boards" aria-label="Central Comercial">
          <div className="commercial-main-grid">
            <article className="panel commercial-panel" ref={priorityRef} tabIndex={-1} aria-label="Prioridade agora">
              <header>
                <div>
                  <h2>Prioridade agora</h2>
                  <p>Ações que exigem sua atenção nas próximas horas.</p>
                </div>
                <Link to="/proximas-acoes">
                  Ver todas <ArrowRight aria-hidden="true" size={12} />
                </Link>
              </header>
              <Tabs
                ariaLabel="Fila de ações prioritárias"
                activeId={queueTab}
                onChange={(id) => setQueueTab(id as "overdue" | "today")}
                items={[
                  {
                    id: "overdue",
                    label: `Vencidas (${center.overdueActions.length})`,
                    content: (
                      <CommercialActionBlock
                        items={center.overdueActions}
                        emptyText="Nenhuma ação vencida"
                        emptyHint="Nada exige ação imediata neste bloco."
                        onAction={(item, mode) => void actionOperation.open(toActionTarget(item), mode)}
                      />
                    ),
                  },
                  {
                    id: "today",
                    label: `Hoje (${center.todayActions.length})`,
                    content: (
                      <CommercialActionBlock
                        items={center.todayActions}
                        emptyText="Nenhuma ação prevista para hoje"
                        emptyHint="Nada exige ação imediata neste bloco."
                        onAction={(item, mode) => void actionOperation.open(toActionTarget(item), mode)}
                      />
                    ),
                  },
                ]}
              />
            </article>

            <article className="panel commercial-panel" ref={agendaRef} tabIndex={-1} aria-label="Agenda e visitas">
              <header>
                <div>
                  <h2>Agenda e visitas</h2>
                  <p>Compromissos de hoje.</p>
                </div>
                <Link to="/proximas-acoes">Ver agenda</Link>
              </header>
              <div className="commercial-panel-body">
                <CommercialVisitBlock items={center.upcomingVisits} />
              </div>
            </article>
          </div>

          <div className="commercial-secondary-grid">
            <article className="panel commercial-panel" ref={quotesRef} tabIndex={-1} aria-label="Orçamentos aguardando retorno">
              <header>
                <div>
                  <h2>Orçamentos aguardando retorno</h2>
                  <p>Follow-up pendente após envio do orçamento.</p>
                </div>
                <Link to="/oportunidades">Ver todos</Link>
              </header>
              <div className="commercial-panel-body">
                <CommercialOpportunityBlock
                  items={center.quotesAwaitingReturn}
                  emptyText="Nenhum orçamento aguardando retorno"
                  onOpen={openOpportunity}
                  showBudget
                />
              </div>
            </article>

            <article className="panel commercial-panel" ref={hygieneRef} tabIndex={-1} aria-label="Higiene do funil">
              <header>
                <div>
                  <h2>Higiene do funil</h2>
                  <p>Oportunidades que precisam de ajuste.</p>
                </div>
              </header>
              <Tabs
                ariaLabel="Higiene do funil"
                activeId={hygieneTab}
                onChange={(id) => setHygieneTab(id as "without-action" | "stalled")}
                items={[
                  {
                    id: "without-action",
                    label: `Sem próxima ação (${center.opportunitiesWithoutNextAction.length})`,
                    content: (
                      <CommercialOpportunityBlock
                        items={center.opportunitiesWithoutNextAction}
                        emptyText="Todas as oportunidades estão acompanhadas"
                        emptyHint="Nenhuma oportunidade ativa está sem próxima ação."
                        onOpen={openOpportunity}
                      />
                    ),
                  },
                  {
                    id: "stalled",
                    label: `Paradas (${center.stalledOpportunities.length})`,
                    content: (
                      <CommercialOpportunityBlock
                        items={center.stalledOpportunities}
                        emptyText="Nenhuma oportunidade parada"
                        emptyHint="Todas as oportunidades ativas tiveram movimentação recente."
                        onOpen={openOpportunity}
                      />
                    ),
                  },
                ]}
              />
            </article>
          </div>

          <div className="commercial-footer-grid">
            <article className="panel commercial-footer-panel" aria-label="Alertas e notificações">
              <header>
                <div>
                  <h2>Alertas relevantes</h2>
                  <p>Notificações operacionais que merecem uma ação humana.</p>
                </div>
                <Link to="/notificacoes">Ver todas</Link>
              </header>
              <div className="commercial-footer-notifications">
                <NotificationList items={notifications.notifications} onRead={notifications.read} onArchive={notifications.archive} onSnooze={notifications.snooze} />
              </div>
              <div className="commercial-footer-panel-actions">
                <p className="commercial-panel-hint">{center.auvoInbox.message}</p>
                <Link className="button secondary" to="/caixa-auvo">Abrir Caixa Auvo</Link>
              </div>
            </article>

            <Card className="panel commercial-footer-panel" role="region" aria-label="Resumo comercial">
              <header>
                <div>
                  <h2>Resumo comercial</h2>
                  <p>Últimos 7 dias.</p>
                </div>
              </header>
              <CardContent className="commercial-footer-card-content">
                <dl className="commercial-summary-strip">
                  <div className="commercial-summary-stat informative"><dt><Users aria-hidden="true" size={14} /> Novas</dt><dd>{center.summary.newOpportunities}</dd></div>
                  <div className="commercial-summary-stat warning"><dt><FileText aria-hidden="true" size={14} /> Orçados</dt><dd>{center.summary.approvedOpportunities + center.summary.lostOpportunities}</dd></div>
                  <div className="commercial-summary-stat positive"><dt><CheckCircle2 aria-hidden="true" size={14} /> Aprovadas</dt><dd>{center.summary.approvedOpportunities}</dd></div>
                  <div className="commercial-summary-stat brand"><dt><Target aria-hidden="true" size={14} /> Conversão</dt><dd>{center.summary.newOpportunities ? Math.round((center.summary.approvedOpportunities / center.summary.newOpportunities) * 100) : 0}%</dd></div>
                  <div className="commercial-summary-stat commercial-summary-wide"><dt><Wallet aria-hidden="true" size={14} /> Ticket médio aprovado</dt><dd>{formatMoney(center.summary.averageApprovedTicket)}</dd></div>
                </dl>
              </CardContent>
            </Card>
          </div>
          </section>
        </>
      )}
    </>
  );
}

function CommercialCenterSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="commercial-metrics-strip">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="commercial-metric-card" key={index}>
            <span className="skeleton skeleton-title" style={{ width: 32, height: 32 }} />
            <span className="commercial-metric-card-body">
              <span className="skeleton skeleton-line short" />
            </span>
          </div>
        ))}
      </div>
      <div className="commercial-boards">
        <div className="commercial-main-grid">
          <div className="panel commercial-panel">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
          <div className="panel commercial-panel">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
        <div className="commercial-secondary-grid">
          <div className="panel commercial-panel">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line short" />
          </div>
          <div className="panel commercial-panel">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
        <div className="commercial-footer-grid">
          <div className="panel commercial-footer-panel">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line short" />
          </div>
          <div className="panel commercial-footer-panel">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatShortDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}
