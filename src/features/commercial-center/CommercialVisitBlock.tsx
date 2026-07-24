import { Link } from "react-router-dom";
import { CalendarClock, ExternalLink } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";
import { formatDateTime, formatVisitStatus } from "../../domain/format";
import type { CommercialCenterVisitItem } from "../../domain/crm";

export function CommercialVisitBlock({ items, limit = 8 }: { items: CommercialCenterVisitItem[]; limit?: number }) {
  const visibleItems = items.slice(0, limit);

  if (!visibleItems.length) {
    return <EmptyState title="Nenhuma visita proxima" text="As visitas agendadas aparecerao aqui." />;
  }

  return (
    <ul className="commercial-visit-list">
      {visibleItems.map((visit) => (
        <li key={visit.id}>
          <div className="commercial-visit-list-icon"><CalendarClock aria-hidden="true" size={18} /></div>
          <div className="commercial-visit-list-body">
            <strong>{visit.objective}</strong>
            <span>{visit.customerName}</span>
            <small>
              {formatDateTime(visit.scheduledStartAt)} · {formatVisitStatus(visit.status)}
              {visit.addressLabel ? ` · ${visit.addressLabel}` : ""}
            </small>
            {visit.opportunityTitle ? <small>{visit.opportunityTitle}</small> : null}
          </div>
          <div className="commercial-visit-list-actions">
            <Link className="button secondary" to={`/clientes/${visit.customerId}?aba=estrutura`}>
              <ExternalLink aria-hidden="true" size={16} />
              Cliente
            </Link>
            {visit.opportunityId ? (
              <Link className="button ghost" to={`/oportunidades/${visit.opportunityId}`}>
                Oportunidade
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
