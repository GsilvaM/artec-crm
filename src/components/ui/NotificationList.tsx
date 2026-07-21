import { EmptyState } from "./EmptyState";
import { formatDateTime } from "../../domain/format";
import type { Notification } from "../../domain/crm";

function formatNotificationSeverity(severity: Notification["severity"]): string {
  if (severity === "urgent") return "Urgente";
  if (severity === "attention") return "Atencao";
  return "Informativa";
}

export function formatNotificationStatus(status: Notification["status"] | "active"): string {
  if (status === "active") return "Pendentes";
  if (status === "unread") return "Nao lida";
  if (status === "read") return "Lida";
  if (status === "archived") return "Arquivada";
  return "Resolvida";
}

export function NotificationList({ items, onRead, onArchive, onSnooze }: {
  items: Notification[];
  onRead: (id: string) => void | Promise<void>;
  onArchive: (id: string) => void | Promise<void>;
  onSnooze: (id: string) => void | Promise<void>;
}) {
  if (items.length === 0) {
    return <EmptyState title="Nenhuma notificacao pendente" text="Voce esta em dia." />;
  }

  return (
    <ul className="notification-list">
      {items.map((item) => (
        <li key={item.id} className={item.status === "unread" ? "is-unread" : ""}>
          <div>
            <span className={`severity ${item.severity}`}>{formatNotificationSeverity(item.severity)}</span>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            <small>{formatDateTime(item.createdAt)} - {formatNotificationStatus(item.status)}</small>
          </div>
          <div className="quick-actions">
            {item.status === "unread" ? <button className="button ghost" type="button" onClick={() => void onRead(item.id)}>Lida</button> : null}
            <button className="button ghost" type="button" onClick={() => void onSnooze(item.id)}>Adiar</button>
            <button className="button ghost" type="button" onClick={() => void onArchive(item.id)}>Arquivar</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
