import { EmptyState } from "../../components/ui/EmptyState";
import { formatDateTime } from "../../domain/format";
import type { CommercialCenterOpportunityItem } from "../../domain/crm";

export function CommercialOpportunityBlock({ title, emptyText, items, onOpen }: {
  title: string;
  emptyText: string;
  items: CommercialCenterOpportunityItem[];
  onOpen: (id: string, name: string) => void;
}) {
  return (
    <article className="panel commercial-card">
      <header>
        <h2>{title}</h2>
        <span className="badge">{items.length}</span>
      </header>
      {items.length ? (
        <ul className="work-list">
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.customerName} - {item.stageName}</span>
                <small>{item.situation} - {item.daysOpen} dias em aberto{item.nextActionDueAt ? ` - ${formatDateTime(item.nextActionDueAt)}` : ""}</small>
              </div>
              <button className="button secondary" type="button" onClick={() => onOpen(item.id, item.title)}>Abrir</button>
            </li>
          ))}
        </ul>
      ) : <EmptyState title={emptyText} text="A Central nao encontrou pendencias neste bloco." />}
    </article>
  );
}
