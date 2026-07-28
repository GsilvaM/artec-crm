import { FileText } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { formatDateTime, formatMoney } from "../../domain/format";
import type { CommercialCenterOpportunityItem } from "../../domain/crm";

export function CommercialOpportunityBlock({
  items,
  emptyText,
  emptyHint = "A Central não encontrou pendências neste bloco.",
  onOpen,
  showBudget = false,
}: {
  items: CommercialCenterOpportunityItem[];
  emptyText: string;
  emptyHint?: string;
  onOpen: (id: string) => void;
  showBudget?: boolean;
}) {
  if (!items.length) {
    return <EmptyState title={emptyText} text={emptyHint} />;
  }

  return (
    <ul className="work-list work-list-opportunities">
      {items.map((item) => (
        <li key={item.id}>
          <span className="work-list-icon is-warning">
            <FileText aria-hidden="true" size={16} />
          </span>
          <div>
            <strong title={item.title}>{item.title}</strong>
            <span title={`${item.customerName} - ${item.stageName}`}>{item.customerName} - {item.stageName}</span>
            <small>
              <span className="work-list-meta-text">
                {item.situation} - {item.daysOpen} {item.daysOpen === 1 ? "dia" : "dias"}
                {item.nextActionDueAt ? ` - próxima ação ${formatDateTime(item.nextActionDueAt)}` : ""}
              </span>
            </small>
          </div>
          <div className="work-list-due">
            <strong>{showBudget && item.budgetValue !== null ? formatMoney(item.budgetValue) : `${item.daysOpen}d`}</strong>
            <span>{showBudget ? "valor orçado" : "no funil"}</span>
          </div>
          <Avatar name={item.customerName} size="sm" />
          <div className="quick-actions">
            <button className="button secondary" type="button" onClick={() => onOpen(item.id)}>
              {showBudget ? "Follow-up" : "Abrir"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
