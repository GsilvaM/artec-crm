import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";
import { formatDateTime, formatOverdueLabel } from "../../domain/format";
import type { CommercialCenterActionItem } from "../../domain/crm";
import type { ActionOperationMode } from "../next-actions/useActionOperation";

const CATEGORY_LABELS: Record<string, string> = {
  commercial: "Comercial",
  warranty: "Garantia",
  support: "Suporte",
  after_sales: "Pós-venda",
};

// Lista de itens de trabalho — usada tanto dentro das abas de "Prioridade agora"
// (Vencidas/Hoje) quanto no painel de Agenda (Visitas). Anatomia por item:
// avatar, titulo + badge de urgencia, cliente/oportunidade, categoria + prazo +
// responsavel, uma acao primaria (Concluir) e uma secundaria discreta (Reagendar).
export function CommercialActionBlock({ items, emptyText, emptyHint = "Nada exige ação imediata neste bloco.", onAction, limit = 5 }: {
  items: CommercialCenterActionItem[];
  emptyText: string;
  emptyHint?: string;
  onAction: (item: CommercialCenterActionItem, mode: ActionOperationMode) => void;
  limit?: number;
}) {
  if (!items.length) {
    return <EmptyState title={emptyText} text={emptyHint} />;
  }

  return (
    <ul className="work-list">
      {items.slice(0, limit).map((item) => (
        <li key={item.id}>
          <Avatar name={item.customerName} size="sm" />
          <div>
            <strong title={item.title}>{item.title}</strong>
            <span title={`${item.customerName}${item.opportunityTitle ? ` • ${item.opportunityTitle}` : ""}`}>
              {item.customerName}
              {item.opportunityTitle ? ` • ${item.opportunityTitle}` : ""}
            </span>
            <small>
              <span className="work-list-meta-text">{CATEGORY_LABELS[item.category] ?? item.category} • {formatDateTime(item.dueAt)}</span>
              {item.overdueHours ? <Badge tone="alert-danger">{formatOverdueLabel(item.overdueHours)}</Badge> : null}
              {item.priority === "high" ? <Badge tone="alert-warning">prioridade alta</Badge> : null}
            </small>
          </div>
          <div className="quick-actions">
            <button className="button primary" type="button" onClick={() => onAction(item, "complete")}>Concluir</button>
            <button className="button ghost" type="button" onClick={() => onAction(item, "postpone")}>Reagendar</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
