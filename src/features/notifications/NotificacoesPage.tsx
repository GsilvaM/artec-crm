import { useEffect, useState } from "react";
import { NotificationList, formatNotificationStatus } from "../../components/ui/NotificationList";
import { LoadingPanels } from "../../components/ui/Skeleton";
import type { Notification } from "../../domain/crm";
import { useNotifications } from "./useNotifications";

type StatusFilter = Notification["status"] | "active";

export function NotificacoesPage() {
  const [status, setStatus] = useState<StatusFilter>("active");
  const notifications = useNotifications({ status: "active", limit: "50" });

  useEffect(() => {
    void notifications.refresh({ status, limit: "50" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <>
      <section id="notificacoes" className="page-heading">
        <div>
          <p className="eyebrow">Acompanhamento</p>
          <h1>Notificacoes</h1>
        </div>
      </section>

      <section className="panel notifications-page" aria-label="Notificacoes internas">
        <header>
          <div>
            <h2>Todas as notificacoes</h2>
          </div>
          <div className="filter-actions">
            {(["active", "read", "archived"] as const).map((option) => (
              <button key={option} className={`button ${status === option ? "secondary" : "ghost"}`} type="button" onClick={() => setStatus(option)}>
                {formatNotificationStatus(option)}
              </button>
            ))}
            <button className="button secondary" type="button" onClick={() => void notifications.refresh({ status, limit: "50" })}>Atualizar</button>
            {status === "active" && notifications.notifications.length ? (
              <button className="button ghost" type="button" onClick={() => void notifications.readAll()}>Ler todas</button>
            ) : null}
          </div>
        </header>
        {notifications.isLoading ? <LoadingPanels /> : (
          <NotificationList items={notifications.notifications} onRead={notifications.read} onArchive={notifications.archive} onSnooze={notifications.snooze} />
        )}
      </section>
    </>
  );
}
