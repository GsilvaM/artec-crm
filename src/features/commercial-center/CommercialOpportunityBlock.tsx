import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { formatDateTime, formatMoney } from "../../domain/format";
import type { CommercialCenterOpportunityItem } from "../../domain/crm";

// Lista de oportunidades — usada em Orcamentos aguardando retorno e Higiene do
// funil (sem proxima acao / paradas). Nao inclui nome do responsavel: o backend
// so retorna responsibleUserId (UUID), e exibir o ID cru violaria a regra de
// nao mostrar dados tecnicos ao atendente; mostrar um nome exigiria carregar a
// lista de usuarios, fora do escopo desta execucao (somente Central Comercial).
export function CommercialOpportunityBlock({ items, emptyText, emptyHint = "A Central não encontrou pendências neste bloco.", onOpen, limit = 5, showBudget = false }: {
  items: CommercialCenterOpportunityItem[];
  emptyText: string;
  emptyHint?: string;
  onOpen: (id: string) => void;
  limit?: number;
  showBudget?: boolean;
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
            <span title={`${item.customerName} • ${item.stageName}`}>{item.customerName} • {item.stageName}</span>
            <small>
              <span className="work-list-meta-text">
                {item.situation} • {item.daysOpen} {item.daysOpen === 1 ? "dia" : "dias"}
                {showBudget && item.budgetValue !== null ? ` • ${formatMoney(item.budgetValue)}` : ""}
                {item.nextActionDueAt ? ` • próxima ação ${formatDateTime(item.nextActionDueAt)}` : ""}
              </span>
            </small>
          </div>
          <div className="quick-actions">
            <button className="button secondary" type="button" onClick={() => onOpen(item.id)}>Abrir</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
