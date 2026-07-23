import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { formatDateTime, formatNextActionStatus } from "../../domain/format";
import { loadNextActions, type NextAction } from "../../domain/crm";
import { useActionOperation } from "./useActionOperation";
import { ActionOperationForm } from "./ActionOperationForm";

type ActionFilter = "overdue" | "today" | "upcoming" | "completed" | "cancelled";

const FILTER_LABELS: Record<ActionFilter, string> = {
  overdue: "Vencidas",
  today: "Hoje",
  upcoming: "Próximas",
  completed: "Concluídas",
  cancelled: "Canceladas",
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
  const navigate = useNavigate();

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      setActions(await loadNextActions());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as próximas ações.");
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
          <h1>Próximas ações</h1>
        </div>
      </section>

      <section className="data-section">
        <div className="segmented-control" aria-label="Filtros de próximas ações">
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

        <DataTable
          columns={[
            {
              key: "acao",
              header: "Ação",
              render: (action) => <>{action.title}{isOverdue(action) ? <span className="badge badge-alert-danger">vencida</span> : null}</>,
            },
            {
              key: "cliente",
              header: "Cliente",
              render: (action) => (
                <button className="search-dropdown-item" type="button" onClick={() => navigate(`/clientes/${action.customerId}`)}>
                  {action.customerName}
                </button>
              ),
            },
            {
              key: "contexto",
              header: "Contexto",
              render: (action) => action.opportunityId ? (
                <button className="search-dropdown-item" type="button" onClick={() => navigate(`/oportunidades/${action.opportunityId}`)}>
                  {action.opportunityTitle}
                </button>
              ) : "Atendimento",
            },
            { key: "categoria", header: "Categoria", render: (action) => <span className="badge">{CATEGORY_LABELS[action.category]}</span> },
            { key: "vencimento", header: "Vencimento", render: (action) => formatDateTime(action.dueAt) },
            {
              key: "prioridade",
              header: "Prioridade",
              render: (action) => <span className={`badge${action.priority === "high" ? " badge-alert-warning" : ""}`}>{PRIORITY_LABELS[action.priority]}</span>,
            },
            { key: "status", header: "Status", render: (action) => <span className="badge">{formatNextActionStatus(action.status)}</span> },
            {
              key: "acoes",
              header: "Ações",
              className: "actions-cell",
              render: (action) => action.status === "pending" ? (
                <>
                  <button className="button secondary" type="button" onClick={() => void actionOperation.open(action, "complete")}>Concluir</button>
                  <button className="button secondary" type="button" onClick={() => void actionOperation.open(action, "postpone")}>Reagendar</button>
                  <button className="button secondary" type="button" onClick={() => void actionOperation.open(action, "cancel")}>Cancelar</button>
                </>
              ) : null,
            },
          ] satisfies DataTableColumn<NextAction>[]}
          rows={visibleActions}
          rowKey={(action) => action.id}
          isLoading={isLoading}
          emptyTitle="Nenhuma próxima ação neste filtro"
          emptyText="Crie uma ação pendente para acompanhar cliente, garantia, suporte ou oportunidade."
        />
      </section>

    </>
  );
}
