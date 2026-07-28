import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, Clock3, Filter, MapPin, Phone, Plus, RotateCcw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/input";
import { useToast } from "../../components/ui/Toast";
import { formatDateTime } from "../../domain/format";
import { createNextAction, loadCustomersPage, loadNextActions, type Customer, type NextAction } from "../../domain/crm";
import { useActionOperation } from "./useActionOperation";
import { ActionOperationForm } from "./ActionOperationForm";

type QueueTab = "mine" | "team" | "agenda" | "completed";
type CategoryFilter = "all" | NextAction["category"];
type PriorityFilter = "all" | NextAction["priority"];
type GroupKey = "overdue" | "today" | "week" | "unscheduled" | "completed";

const TAB_LABELS: Record<QueueTab, string> = {
  mine: "Minha fila",
  team: "Equipe",
  agenda: "Agenda",
  completed: "Concluídas",
};

const GROUP_META: Record<GroupKey, { label: string; tone: string }> = {
  overdue: { label: "Atrasadas", tone: "danger" },
  today: { label: "Hoje", tone: "warning" },
  week: { label: "Amanhã e esta semana", tone: "informative" },
  unscheduled: { label: "Sem data definida", tone: "neutral" },
  completed: { label: "Concluídas", tone: "positive" },
};

const CATEGORY_LABELS: Record<NextAction["category"], string> = {
  commercial: "Comercial",
  warranty: "Garantia",
  support: "Suporte",
  after_sales: "Pós-venda",
};

const PRIORITY_LABELS: Record<NextAction["priority"], string> = {
  high: "Alta",
  normal: "Normal",
  low: "Baixa",
};

const EMPTY_CREATE_FORM = {
  customerId: "",
  title: "",
  dueAt: "",
  category: "commercial" as NextAction["category"],
  priority: "normal" as NextAction["priority"],
};

export function ProximasAcoesPage({ currentUserId }: { currentUserId: string }) {
  const [actions, setActions] = useState<NextAction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<QueueTab>("mine");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextActions, customerPage] = await Promise.all([loadNextActions(), loadCustomersPage()]);
      setActions(nextActions);
      setCustomers(customerPage.customers.filter((customer) => !customer.archivedAt));
      setCreateForm((current) => ({ ...current, customerId: current.customerId || customerPage.customers[0]?.id || "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as próximas ações.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const actionOperation = useActionOperation(currentUserId, refresh);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createForm.customerId || !createForm.title.trim() || !createForm.dueAt) return;
    setError(null);
    try {
      await createNextAction({
        customerId: createForm.customerId,
        responsibleUserId: currentUserId,
        category: createForm.category,
        title: createForm.title.trim(),
        dueAt: createForm.dueAt,
        priority: createForm.priority,
      });
      setCreateForm((current) => ({ ...EMPTY_CREATE_FORM, customerId: current.customerId || customers[0]?.id || "" }));
      setShowCreateForm(false);
      showToast("Próxima ação criada.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a próxima ação.");
    }
  }

  const pendingActions = actions.filter((action) => action.status === "pending");
  const completedActions = actions.filter((action) => action.status === "completed");
  const filteredActions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return actions.filter((action) => {
      if (activeTab === "completed" && action.status !== "completed") return false;
      if (activeTab !== "completed" && action.status !== "pending") return false;
      if (activeTab === "mine" && action.responsibleUserId !== currentUserId) return false;
      if (activeTab === "agenda" && !isTodayOrFuture(action)) return false;
      if (categoryFilter !== "all" && action.category !== categoryFilter) return false;
      if (priorityFilter !== "all" && action.priority !== priorityFilter) return false;
      if (!normalizedSearch) return true;
      return [action.title, action.customerName, action.opportunityTitle, action.description].filter(Boolean).some((value) => value!.toLowerCase().includes(normalizedSearch));
    });
  }, [actions, activeTab, categoryFilter, currentUserId, priorityFilter, search]);

  const groupedActions = useMemo(() => groupActions(filteredActions), [filteredActions]);
  const visibleGroups: GroupKey[] = activeTab === "completed" ? ["completed"] : ["overdue", "today", "week", "unscheduled"];

  return (
    <>
      <section id="proximas-acoes" className="page-heading design-page-heading">
        <div>
          <h1>Próximas Ações</h1>
          <p>Sua fila comercial organizada por prazo.</p>
        </div>
        <Button variant="primary" type="button" onClick={() => setShowCreateForm((open) => !open)}>
          <Plus aria-hidden="true" /> {showCreateForm ? "Fechar" : "Nova ação"}
        </Button>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {showCreateForm ? (
        <form className="panel compact-form design-create-form" onSubmit={handleCreate}>
          <h2>Nova ação</h2>
          <label>Cliente
            <select required value={createForm.customerId} onChange={(event) => setCreateForm({ ...createForm, customerId: event.target.value })}>
              <option value="">Selecione</option>
              {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.nome}</option>)}
            </select>
          </label>
          <label>Ação<Input required value={createForm.title} onChange={(event) => setCreateForm({ ...createForm, title: event.target.value })} /></label>
          <label>Data<Input required type="datetime-local" value={createForm.dueAt} onChange={(event) => setCreateForm({ ...createForm, dueAt: event.target.value })} /></label>
          <label>Categoria
            <select value={createForm.category} onChange={(event) => setCreateForm({ ...createForm, category: event.target.value as NextAction["category"] })}>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Prioridade
            <select value={createForm.priority} onChange={(event) => setCreateForm({ ...createForm, priority: event.target.value as NextAction["priority"] })}>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <Button variant="primary" type="submit" disabled={!customers.length}><Plus aria-hidden="true" /> Salvar ação</Button>
        </form>
      ) : null}

      {actionOperation.operation ? (
        <ActionOperationForm
          operation={actionOperation.operation}
          error={actionOperation.error}
          onChange={actionOperation.update}
          onSubmit={() => void actionOperation.submit()}
          onCancel={actionOperation.close}
        />
      ) : null}

      <section className="data-section next-actions-list-page" aria-label="Fila de próximas ações" aria-busy={isLoading}>
        <div className="next-actions-list-toolbar">
          <div className="design-tabs next-actions-tabs" role="group" aria-label="Filtrar próximas ações">
            {(Object.keys(TAB_LABELS) as QueueTab[]).map((tab) => (
              <button key={tab} type="button" className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
                {TAB_LABELS[tab]} <span>{tabCount(tab, pendingActions, completedActions, currentUserId)}</span>
              </button>
            ))}
          </div>
          <label className="design-search-field next-actions-search">
            <Search size={17} aria-hidden="true" />
            <Input type="search" placeholder="Buscar por cliente ou ação" aria-label="Buscar próxima ação" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <Button variant="secondary" type="button" onClick={() => setShowFilters((open) => !open)}>
            <Filter size={16} aria-hidden="true" /> Filtros
          </Button>
        </div>

        {showFilters ? (
          <div className="next-actions-filter-row">
            <label>Categoria
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}>
                <option value="all">Todas</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>Prioridade
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}>
                <option value="all">Todas</option>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
        ) : null}

        {isLoading ? <p className="quotes-empty">Carregando próximas ações...</p> : null}
        {!isLoading && !filteredActions.length ? <EmptyState title="Nenhuma ação nesta fila" text="Ajuste os filtros ou crie uma nova ação para acompanhar o cliente." /> : null}

        {!isLoading && filteredActions.length ? (
          <div className="next-action-groups">
            {visibleGroups.map((group) => (
              <ActionGroup
                key={group}
                groupKey={group}
                actions={groupedActions[group]}
                onOpenCustomer={(id) => navigate(`/clientes/${id}`)}
                onOpenOpportunity={(id) => navigate(`/oportunidades/${id}`)}
                onComplete={(action) => void actionOperation.open(actionToTarget(action), "complete")}
                onPostpone={(action) => void actionOperation.open(actionToTarget(action), "postpone")}
              />
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}

function ActionGroup({ groupKey, actions, onOpenCustomer, onOpenOpportunity, onComplete, onPostpone }: {
  groupKey: GroupKey;
  actions: NextAction[];
  onOpenCustomer: (id: string) => void;
  onOpenOpportunity: (id: string) => void;
  onComplete: (action: NextAction) => void;
  onPostpone: (action: NextAction) => void;
}) {
  const meta = GROUP_META[groupKey];
  return (
    <section className="next-action-group" aria-label={meta.label}>
      <header>
        <span className={`next-action-group-dot is-${meta.tone}`} />
        <h2>{meta.label}</h2>
        <small>({actions.length})</small>
      </header>
      {actions.length ? (
        <ul>
          {actions.map((action) => (
            <li key={action.id} className="next-action-row">
              <span className={`next-action-row-icon is-${action.category}`}>
                {action.category === "commercial" ? <Phone size={17} aria-hidden="true" /> : action.category === "support" ? <MapPin size={17} aria-hidden="true" /> : <CalendarClock size={17} aria-hidden="true" />}
              </span>
              <div className="next-action-row-main">
                <strong>{action.title}</strong>
                <span>
                  <button type="button" onClick={() => onOpenCustomer(action.customerId)}>{action.customerName}</button>
                  {action.opportunityId && action.opportunityTitle ? (
                    <>
                      {" · "}
                      <button type="button" onClick={() => onOpenOpportunity(action.opportunityId!)}>{action.opportunityTitle}</button>
                    </>
                  ) : null}
                </span>
              </div>
              <div className="next-action-row-due">
                <Clock3 size={13} aria-hidden="true" />
                <strong>{formatActionDue(action, groupKey)}</strong>
                <small>{relativeDueLabel(action)}</small>
              </div>
              <Avatar name={action.customerName} size="sm" />
              <button className="icon-button" type="button" aria-label={`Reagendar ${action.title}`} onClick={() => onPostpone(action)}>
                <RotateCcw size={16} aria-hidden="true" />
              </button>
              {action.status === "pending" ? (
                <Button variant="primary" type="button" onClick={() => onComplete(action)}>
                  <Check size={16} aria-hidden="true" /> Concluir
                </Button>
              ) : (
                <Badge tone="positive">Concluída</Badge>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="next-action-group-empty">Nenhuma ação nesta seção.</p>
      )}
    </section>
  );
}

function actionToTarget(action: NextAction) {
  return {
    id: action.id,
    customerId: action.customerId,
    customerName: action.customerName,
    opportunityId: action.opportunityId,
    category: action.category,
    dueAt: action.dueAt,
  };
}

function groupActions(actions: NextAction[]): Record<GroupKey, NextAction[]> {
  const groups: Record<GroupKey, NextAction[]> = { overdue: [], today: [], week: [], unscheduled: [], completed: [] };
  for (const action of [...actions].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())) {
    if (action.status === "completed") groups.completed.push(action);
    else if (!action.dueAt || Number.isNaN(new Date(action.dueAt).getTime())) groups.unscheduled.push(action);
    else if (isOverdue(action)) groups.overdue.push(action);
    else if (isToday(action)) groups.today.push(action);
    else groups.week.push(action);
  }
  return groups;
}

function tabCount(tab: QueueTab, pending: NextAction[], completed: NextAction[], currentUserId: string): number {
  if (tab === "mine") return pending.filter((action) => action.responsibleUserId === currentUserId).length;
  if (tab === "team") return pending.length;
  if (tab === "agenda") return pending.filter(isTodayOrFuture).length;
  return completed.length;
}

function isOverdue(action: NextAction): boolean {
  return action.status === "pending" && new Date(action.dueAt).getTime() < Date.now() && !isToday(action);
}

function isToday(action: NextAction): boolean {
  const due = new Date(action.dueAt);
  const now = new Date();
  return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
}

function isTodayOrFuture(action: NextAction): boolean {
  return action.status === "pending" && new Date(action.dueAt).getTime() >= startOfToday().getTime();
}

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function formatActionDue(action: NextAction, groupKey: GroupKey): string {
  if (groupKey === "completed") return action.completedAt ? formatDateTime(action.completedAt) : "Concluída";
  if (!action.dueAt) return "Sem data";
  return formatDateTime(action.dueAt);
}

function relativeDueLabel(action: NextAction): string {
  if (action.status === "completed") return "feito";
  const due = new Date(action.dueAt).getTime();
  if (Number.isNaN(due)) return "definir";
  const diffHours = Math.round((due - Date.now()) / 3_600_000);
  if (diffHours < 0) return diffHours <= -24 ? `há ${Math.abs(Math.round(diffHours / 24))}d` : `há ${Math.abs(diffHours)}h`;
  if (diffHours < 24) return `em ${Math.max(1, diffHours)}h`;
  return diffHours < 48 ? "amanhã" : "esta semana";
}
