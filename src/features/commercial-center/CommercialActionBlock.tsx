import { CalendarClock, FileText, Headphones, Phone, ShieldCheck } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { formatDateTime, formatOverdueLabel } from "../../domain/format";
import type { CommercialCenterActionItem } from "../../domain/crm";
import type { ActionOperationMode } from "../next-actions/useActionOperation";

const CATEGORY_LABELS: Record<string, string> = {
  commercial: "Comercial",
  warranty: "Garantia",
  support: "Suporte",
  after_sales: "Pos-venda",
};

const CATEGORY_ICON = {
  commercial: Phone,
  warranty: ShieldCheck,
  support: Headphones,
  after_sales: CalendarClock,
} as const;

export function CommercialActionBlock({
  items,
  emptyText,
  emptyHint = "Nada exige acao imediata neste bloco.",
  onAction,
}: {
  items: CommercialCenterActionItem[];
  emptyText: string;
  emptyHint?: string;
  onAction: (item: CommercialCenterActionItem, mode: ActionOperationMode) => void;
}) {
  if (!items.length) {
    return <EmptyState title={emptyText} text={emptyHint} />;
  }

  return (
    <ul className="work-list">
      {items.map((item) => {
        const Icon = CATEGORY_ICON[item.category] ?? FileText;
        const isOverdue = Boolean(item.overdueHours);

        return (
          <li key={item.id}>
            <span className={`work-list-icon ${isOverdue ? "is-danger" : "is-brand"}`}>
              <Icon aria-hidden="true" size={16} />
            </span>
            <div>
              <strong title={item.title}>
                <span className={`priority-dot priority-${item.priority}`} />
                {item.title}
              </strong>
              <span title={`${item.customerName}${item.opportunityTitle ? ` - ${item.opportunityTitle}` : ""}`}>
                {item.customerName}
                {item.opportunityTitle ? ` - ${item.opportunityTitle}` : ""}
              </span>
              <small>
                <span className="work-list-meta-text">{CATEGORY_LABELS[item.category] ?? item.category}</span>
                {isOverdue ? <Badge tone="alert-danger">{formatOverdueLabel(item.overdueHours ?? 0)}</Badge> : null}
                {item.priority === "high" ? <Badge tone="alert-warning">prioridade alta</Badge> : null}
              </small>
            </div>
            <div className={`work-list-due ${isOverdue ? "is-danger" : "is-warning"}`}>
              <strong>{isOverdue ? formatOverdueLabel(item.overdueHours ?? 0) : formatDateTime(item.dueAt)}</strong>
              <span>{isOverdue ? "pendente" : "prazo"}</span>
            </div>
            <Avatar name={item.customerName} size="sm" />
            <div className="quick-actions">
              <button className="button primary" type="button" onClick={() => onAction(item, "complete")}>Concluir</button>
              <button className="button ghost" type="button" onClick={() => onAction(item, "postpone")}>Reagendar</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
