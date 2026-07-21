import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { TimelineDrawer, type TimelineTarget } from "../../components/ui/TimelineDrawer";
import { formatDateTime } from "../../domain/format";
import { loadNextActions, type NextAction } from "../../domain/crm";
import { useActionOperation } from "./useActionOperation";
import { ActionOperationForm } from "./ActionOperationForm";

type ActionFilter = "overdue" | "today" | "upcoming" | "completed" | "cancelled";

const FILTER_LABELS: Record<ActionFilter, string> = {
  overdue: "Vencidas",
  today: "Hoje",
  upcoming: "Proximas",
  completed: "Concluidas",
  cancelled: "Canceladas",
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

function isOverdue(action: NextAction): boolean {
  return action.status === "pending" && new Date(action.dueAt).getTime() < Date.now();
}

function isTodayAction(action: NextAction): boolean {
  if (action.status !== "pending") return false;
  const now = new Date();
  const due = new Date(action.dueAt);
  return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
}

function filterActions(actions: NextAction[], filter: ActionFilter): NextAction[] {
  return actions.filter((action) => {
    if (filter === "overdue") return isOverdue(action);
    if (filter === "today") return isTodayAction(action);
    if (filter === "upcoming") return action.status === "pending" && !isOverdue(action) && !isTodayAction(action);
    return action.status === filter;
  });
}

export function ProximasAcoesPage({ currentUserId }: { currentUserId: string }) {
  const [actions, setActions] = useState<NextAction[]>([]);
  const [filter, setFilter] = useState<ActionFilter>("overdue");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timelineTarget, setTimelineTarget] = useState<TimelineTarget | null>(null);
  const navigate = useNavigate();

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      setActions(await loadNextActions());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar as proximas acoes.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionOperation = useActionOperation(currentUserId, refresh);
  const visibleActions = filterActions(actions, filter);

  return (
    <>
      <section id="proximas-acoes" className="page-heading">
        <div>
          <p className="eyebrow">Follow-up e agenda comercial</p>
          <h1>Proximas acoes</h1>
        </div>
      </section>

      <section className="data-section">
        <div className="segmented-control" aria-label="Filtros de proximas acoes">
          {(Object.keys(FILTER_LABELS) as ActionFilter[]).map((key) => (
            <button className={filter === key ? "active" : ""} type="button" key={key} onClick={() => setFilter(key)}>
              {FILTER_LABELS[key]}
            </button>
          ))}
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

        {isLoading ? (
          <LoadingPanels />
        ) : visibleActions.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Acao</th><th>Cliente</th><th>Contexto</th><th>Categoria</th><th>Vencimento</th><th>Prioridade</th><th>Status</th><th>Acoes</th></tr></thead>
              <tbody>
                {visibleActions.map((action) => (
                  <tr key={action.id}>
                    <td>{action.title}{isOverdue(action) ? <span className="badge danger-badge">vencida</span> : null}</td>
                    <td>
                      <button className="search-dropdown-item" type="button" onClick={() => setTimelineTarget({ type: "customer", id: action.customerId, name: action.customerName })}>
                        {action.customerName}
                      </button>
                    </td>
                    <td>
                      {action.opportunityId ? (
                        <button className="search-dropdown-item" type="button" onClick={() => navigate(`/oportunidades/${action.opportunityId}`)}>
                          {action.opportunityTitle}
                        </button>
                      ) : "Atendimento"}
                    </td>
                    <td><span className="badge">{CATEGORY_LABELS[action.category]}</span></td>
                    <td>{formatDateTime(action.dueAt)}</td>
                    <td><span className="badge">{PRIORITY_LABELS[action.priority]}</span></td>
                    <td><span className="badge">{action.status}</span></td>
                    <td className="actions-cell">
                      <button className="button secondary" type="button" disabled={action.status !== "pending"} onClick={() => void actionOperation.open(action, "complete")}>Concluir</button>
                      <button className="button secondary" type="button" disabled={action.status !== "pending"} onClick={() => void actionOperation.open(action, "postpone")}>Reagendar</button>
                      <button className="button secondary" type="button" disabled={action.status !== "pending"} onClick={() => void actionOperation.open(action, "cancel")}>Cancelar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Nenhuma proxima acao neste filtro" text="Crie uma acao pendente para acompanhar cliente, garantia, suporte ou oportunidade." />
        )}
      </section>

      {timelineTarget ? <TimelineDrawer target={timelineTarget} onClose={() => setTimelineTarget(null)} /> : null}
    </>
  );
}
