import { Archive, Check, Clock3 } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { formatDateTime } from "../../domain/format";
import type { Notification } from "../../domain/crm";

function formatNotificationSeverity(severity: Notification["severity"]): string {
  if (severity === "urgent") return "Urgente";
  if (severity === "attention") return "Atencao";
  return "Informativa";
}

function formatNotificationType(type: Notification["type"]): string {
  const labels: Record<Notification["type"], string> = {
    overdue_next_action: "Acao vencida",
    due_soon_next_action: "Acao vencendo",
    opportunity_assigned: "Nova oportunidade",
    next_action_reassigned: "Acao redistribuida",
    missing_next_action: "Sem proxima acao",
    stalled_opportunity: "Oportunidade parada",
    internal_error: "Erro interno",
  };

  return labels[type] ?? "Sistema";
}

export function formatNotificationStatus(status: Notification["status"] | "active"): string {
  if (status === "active") return "Pendentes";
  if (status === "unread") return "Nao lida";
  if (status === "read") return "Lida";
  if (status === "archived") return "Arquivada";
  return "Resolvida";
}

export function NotificationList({ items, onRead, onArchive, onSnooze, emptyTitle = "Nenhuma notificacao pendente", emptyText = "A fila esta em dia.", compact = false }: {
  items: Notification[];
  onRead: (id: string) => void | Promise<void>;
  onArchive: (id: string) => void | Promise<void>;
  onSnooze: (id: string) => void | Promise<void>;
  emptyTitle?: string;
  emptyText?: string;
  compact?: boolean;
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} text={emptyText} />;
  }

  return (
    <ul className={`notification-list ${compact ? "notification-list-compact" : ""}`}>
      {items.map((item) => (
        <li key={item.id} className={item.status === "unread" ? "is-unread" : ""}>
          <div className="notification-list-main">
            <div className="notification-list-title">
              <span className={`severity ${item.severity}`}>{formatNotificationSeverity(item.severity)}</span>
              <strong>{item.title}</strong>
            </div>
            <p>{item.body}</p>
            <div className="notification-list-meta">
              <span>{formatNotificationType(item.type)}</span>
              <span>{formatDateTime(item.createdAt)}</span>
              <span>{formatNotificationStatus(item.status)}</span>
            </div>
          </div>
          <div className="quick-actions" aria-label={`Acoes para ${item.title}`}>
            {item.status === "unread" ? (
              <button className="icon-button" type="button" title="Marcar como lida" aria-label="Marcar como lida" onClick={() => void onRead(item.id)}>
                <Check aria-hidden="true" size={16} />
              </button>
            ) : null}
            <button className="icon-button" type="button" title="Adiar" aria-label="Adiar" onClick={() => void onSnooze(item.id)}>
              <Clock3 aria-hidden="true" size={16} />
            </button>
            <button className="icon-button" type="button" title="Arquivar" aria-label="Arquivar" onClick={() => void onArchive(item.id)}>
              <Archive aria-hidden="true" size={16} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
