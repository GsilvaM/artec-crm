import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDateTime, formatNextActionStatus } from "../../domain/format";
import { loadNextActions, type NextAction } from "../../domain/crm";
import { useActionOperation } from "./useActionOperation";
import { ActionOperationForm } from "./ActionOperationForm";

type ActionLane = "overdue" | "today" | "upcoming" | "completed" | "cancelled";
type CategoryFilter = "all" | NextAction["category"];
type PriorityFilter = "all" | NextAction["priority"];
type ResponsibleFilter = "all" | "mine";

const LANE_LABELS: Record<ActionLane, string> = {
  overdue: "Vencidas",
  today: "Hoje",
  upcoming: "Proximas",
  completed: "Concluidas",
  cancelled: "Canceladas",
};

const LANE_HINTS: Record<ActionLane, string> = {
  overdue: "Acoes que ja travam atendimento ou venda.",
  today: "Compromissos que precisam resposta no dia.",
  upcoming: "Follow-ups futuros e agenda comercial.",
  completed: "Historico recente de conclusao.",
  cancelled: "Acoes encerradas sem execucao.",
};

const LANE_ICONS: Record<ActionLane, typeof AlertTriangle> = {
  overdue: AlertTriangle,
  today: Clock3,
  upcoming: CalendarClock,
  completed: CheckCircle2,
  cancelled: XCircle,
};

const CATEGORY_LABELS: Record<NextAction["category"], string> = {
  commercial: "Comercial",
  warranty: "Garantia",
  support: "Suporte",
  after_sales: "Pos-venda",
};

const PRIORITY_LABELS: Record<NextAction["priority"], string> = {
  high: "Alta",
  normal: "Normal",
  low: "Baixa",
};

const CATEGORY_FILTER_LABELS: Record<CategoryFilter, string> = {
  all: "Todas as categorias",
  ...CATEGORY_LABELS,
};

const PRIORITY_FILTER_LABELS: Record<PriorityFilter, string> = {
  all: "Todas as prioridades",
  ...PRIORITY_LABELS,
};

function isOverdue(action: NextAction): boolean {
  return action.status === "pending" && new Date(action.dueAt).getTime() < Date.now();
}

function isTodayAction(action: NextAction): boolean {
  if (action.status !== "pending") return false;
  const now = new Date();
  const due = new Date(action.dueAt);
  return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
}

function laneForAction(action: NextAction): ActionLane {
  if (action.status === "completed") return "completed";
  if (action.status === "cancelled") return "cancelled";
  if (isOverdue(action)) return "overdue";
  if (isTodayAction(action)) return "today";
  return "upcoming";
}

function groupActionsByLane(actions: NextAction[]): Record<ActionLane, NextAction[]> {
  const lanes: Record<ActionLane, NextAction[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    completed: [],
    cancelled: [],
  };

  for (const action of actions) {
    lanes[laneForAction(action)].push(action);
  }

  return lanes;
}

export function ProximasAcoesPage({ currentUserId }: { currentUserId: string }) {
  const [actions, setActions] = useState<NextAction[]>([]);
  const [focusedLane, setFocusedLane] = useState<ActionLane>("overdue");
  const [responsibleFilter, setResponsibleFilter] = useState<ResponsibleFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const requestFilters = useMemo(
    () => ({
      responsibleUserId: responsibleFilter === "mine" ? currentUserId : undefined,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      priority: priorityFilter === "all" ? undefined : priorityFilter,
    }),
    [categoryFilter, currentUserId, priorityFilter, responsibleFilter],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setActions(await loadNextActions(requestFilters));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar as proximas acoes.");
    } finally {
      setIsLoading(false);
    }
  }, [requestFilters]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const actionOperation = useActionOperation(currentUserId, refresh);
  const lanes = useMemo(() => groupActionsByLane(actions), [actions]);

  return (
    <>
      <section id="proximas-acoes" className="page-heading next-actions-heading">
        <div>
          <p className="eyebrow">Follow-up e agenda comercial</p>
          <h1>Proximas acoes</h1>
        </div>
      </section>

      <section className="data-section next-actions-page next-actions-board-page" aria-label="Board de proximas acoes">
        <div className="next-actions-metrics" aria-label="Resumo das proximas acoes">
          {(Object.keys(LANE_LABELS) as ActionLane[]).map((key) => {
            const Icon = LANE_ICONS[key];
            return (
              <button
                key={key}
                className={`next-action-metric ${focusedLane === key ? "is-active" : ""}`}
                type="button"
                aria-pressed={focusedLane === key}
                onClick={() => setFocusedLane(key)}
              >
                <Icon aria-hidden="true" size={18} />
                <span>{LANE_LABELS[key]}</span>
                <strong>{lanes[key].length}</strong>
              </button>
            );
          })}
        </div>

        <div className="next-actions-controls" aria-label="Filtros das proximas acoes">
          <label>
            <span>Responsavel</span>
            <select value={responsibleFilter} onChange={(event) => setResponsibleFilter(event.target.value as ResponsibleFilter)}>
              <option value="all">Todos permitidos</option>
              <option value="mine">Minhas acoes</option>
            </select>
          </label>

          <label>
            <span>Categoria</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}>
              {(Object.keys(CATEGORY_FILTER_LABELS) as CategoryFilter[]).map((key) => (
                <option key={key} value={key}>{CATEGORY_FILTER_LABELS[key]}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Prioridade</span>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}>
              {(Object.keys(PRIORITY_FILTER_LABELS) as PriorityFilter[]).map((key) => (
                <option key={key} value={key}>{PRIORITY_FILTER_LABELS[key]}</option>
              ))}
            </select>
          </label>
        </div>

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

        <section className="next-actions-board" aria-label="Board operacional de proximas acoes" aria-busy={isLoading}>
          {isLoading ? (
            <p className="quotes-empty">Carregando proximas acoes...</p>
          ) : (
            (Object.keys(LANE_LABELS) as ActionLane[]).map((lane) => (
              <article key={lane} className={`next-action-lane ${focusedLane === lane ? "is-focused" : ""}`}>
                <header>
                  <div>
                    <h2>{LANE_LABELS[lane]}</h2>
                    <p>{LANE_HINTS[lane]}</p>
                  </div>
                  <strong>{lanes[lane].length}</strong>
                </header>
                <div className="next-action-lane-scroll">
                  {lanes[lane].length ? (
                    <ul className="next-action-list">
                      {lanes[lane].map((action) => (
                        <li key={action.id} className={`next-action-card ${isOverdue(action) ? "next-action-card-overdue" : ""}`}>
                          <div className="next-action-card-main">
                            <div>
                              <span className="next-action-card-kicker">{CATEGORY_LABELS[action.category]}</span>
                              <strong>{action.title}</strong>
                            </div>
                            <span className={`badge ${statusBadgeClass(action)}`}>{formatNextActionStatus(action.status)}</span>
                          </div>

                          <div className="next-action-card-meta">
                            <button className="link-button" type="button" onClick={() => navigate(`/clientes/${action.customerId}`)}>
                              {action.customerName}
                            </button>
                            <span>{formatDateTime(action.dueAt)}</span>
                            <span className={`badge ${priorityBadgeClass(action.priority)}`}>{PRIORITY_LABELS[action.priority]}</span>
                          </div>

                          {action.opportunityId ? (
                            <button className="next-action-context" type="button" onClick={() => navigate(`/oportunidades/${action.opportunityId}`)}>
                              {action.opportunityTitle}
                            </button>
                          ) : (
                            <span className="next-action-context-static">Atendimento sem oportunidade</span>
                          )}

                          {action.description || action.completionResult || action.cancellationReason ? (
                            <p className="next-action-card-note">{action.completionResult ?? action.cancellationReason ?? action.description}</p>
                          ) : null}

                          {action.status === "pending" ? (
                            <div className="next-action-card-actions">
                              <button className="button secondary" type="button" onClick={() => void actionOperation.open(action, "complete")}>Concluir</button>
                              <button className="button secondary" type="button" onClick={() => void actionOperation.open(action, "postpone")}>Reagendar</button>
                              <button className="button ghost" type="button" onClick={() => void actionOperation.open(action, "cancel")}>Cancelar</button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="quotes-empty">Nenhuma acao nesta raia.</p>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </>
  );
}

function priorityBadgeClass(priority: NextAction["priority"]): string {
  if (priority === "high") return "badge-alert-warning";
  if (priority === "low") return "badge-positive";
  return "";
}

function statusBadgeClass(action: NextAction): string {
  if (action.status === "completed") return "badge-positive";
  if (action.status === "cancelled") return "";
  if (isOverdue(action)) return "badge-alert-danger";
  return "badge-informative";
}
