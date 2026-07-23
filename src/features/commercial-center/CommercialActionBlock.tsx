import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { formatDateTime } from "../../domain/format";
import type { CommercialCenterActionItem } from "../../domain/crm";
import type { ActionOperationMode } from "../next-actions/useActionOperation";

const CATEGORY_LABELS: Record<string, string> = {
  commercial: "Comercial",
  warranty: "Garantia",
  support: "Suporte",
  after_sales: "Pós-venda",
};

export function CommercialActionBlock({ title, emptyText, items, onAction }: {
  title: string;
  emptyText: string;
  items: CommercialCenterActionItem[];
  onAction: (item: CommercialCenterActionItem, mode: ActionOperationMode) => void;
}) {
  return (
    <article className="panel commercial-card">
      <header>
        <h2>{title}</h2>
        <span className="badge badge-informative">{items.length}</span>
      </header>
      {items.length ? (
        <ul className="work-list">
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              <Avatar name={item.customerName} size="sm" />
              <div>
                <strong>{item.title}</strong>
                <span>{item.customerName}{item.opportunityTitle ? ` - ${item.opportunityTitle}` : ""}</span>
                <small>
                  {CATEGORY_LABELS[item.category] ?? item.category} - {formatDateTime(item.dueAt)}
                  {item.overdueHours ? <span className="badge badge-alert-danger">{item.overdueHours}h em atraso</span> : null}
                  {item.priority === "high" ? <span className="badge badge-alert-warning">prioridade alta</span> : null}
                </small>
              </div>
              <div className="quick-actions">
                <button className="button secondary" type="button" onClick={() => onAction(item, "complete")}>Concluir</button>
                <button className="button secondary" type="button" onClick={() => onAction(item, "postpone")}>Reagendar</button>
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState title={emptyText} text="Nada exige ação imediata neste bloco." />}
    </article>
  );
}
