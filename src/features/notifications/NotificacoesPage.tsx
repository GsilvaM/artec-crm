import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, CheckCircle2 } from "lucide-react";
import { NotificationList, formatNotificationStatus } from "../../components/ui/NotificationList";
import { LoadingPanels } from "../../components/ui/Skeleton";
import type { Notification } from "../../domain/crm";
import { useNotifications } from "./useNotifications";

type StatusFilter = Notification["status"] | "active";

type NotificationLane = {
  id: "now" | "watch" | "history";
  title: string;
  hint: string;
  items: Notification[];
};

function buildNotificationLanes(items: Notification[]): NotificationLane[] {
  const now = items.filter((item) => item.status === "unread" || item.severity === "urgent");
  const watch = items.filter((item) => !now.includes(item) && item.status !== "read" && item.status !== "archived" && item.status !== "resolved");
  const history = items.filter((item) => item.status === "read" || item.status === "archived" || item.status === "resolved");

  return [
    { id: "now", title: "Resolver agora", hint: "Urgentes, nao lidas e bloqueios comerciais.", items: now },
    { id: "watch", title: "Acompanhar", hint: "Itens ativos que ainda precisam de cuidado.", items: watch },
    { id: "history", title: "Historico", hint: "Lidas, arquivadas ou resolvidas.", items: history },
  ];
}

export function NotificacoesPage() {
  const [status, setStatus] = useState<StatusFilter>("active");
  const notifications = useNotifications({ status: "active", limit: "30" });

  useEffect(() => {
    void notifications.refresh({ status, limit: "30" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const urgentCount = notifications.notifications.filter((item) => item.severity === "urgent").length;
  const attentionCount = notifications.notifications.filter((item) => item.severity === "attention").length;
  const unreadCount = notifications.notifications.filter((item) => item.status === "unread").length;
  const lanes = useMemo(() => buildNotificationLanes(notifications.notifications), [notifications.notifications]);

  return (
    <>
      <section id="notificacoes" className="page-heading notifications-heading">
        <div>
          <p className="eyebrow">Acompanhamento</p>
          <h1>Notificacoes</h1>
        </div>
      </section>

      <section className="notifications-page notifications-board-page" aria-label="Notificacoes internas">
        <section className="notifications-summary" aria-label="Resumo das notificacoes">
          <article className={urgentCount ? "notifications-summary-danger" : ""}>
            <AlertTriangle aria-hidden="true" size={18} />
            <span>Urgentes</span>
            <strong>{urgentCount}</strong>
          </article>
          <article className={attentionCount ? "notifications-summary-warning" : ""}>
            <BellRing aria-hidden="true" size={18} />
            <span>Atencao</span>
            <strong>{attentionCount}</strong>
          </article>
          <article>
            <CheckCircle2 aria-hidden="true" size={18} />
            <span>Nao lidas</span>
            <strong>{unreadCount}</strong>
          </article>
        </section>

        <header className="notifications-toolbar">
          <div>
            <h2>Board de notificacoes</h2>
          </div>
          <div className="filter-actions">
            {(["active", "read", "archived"] as const).map((option) => (
              <button key={option} className={`button ${status === option ? "secondary" : "ghost"}`} type="button" aria-pressed={status === option} onClick={() => setStatus(option)}>
                {formatNotificationStatus(option)}
              </button>
            ))}
            <button className="button secondary" type="button" onClick={() => void notifications.refresh({ status, limit: "30" })}>Atualizar</button>
            {status === "active" && notifications.notifications.length ? (
              <button className="button ghost" type="button" onClick={() => void notifications.readAll()}>Ler todas</button>
            ) : null}
          </div>
        </header>

        {notifications.isLoading ? <LoadingPanels /> : (
          <>
            <section className="notifications-board" aria-label="Board operacional de notificacoes">
              {lanes.map((lane) => (
                <article key={lane.id} className="notifications-lane">
                  <header>
                    <div>
                      <h3>{lane.title}</h3>
                      <p>{lane.hint}</p>
                    </div>
                    <strong>{lane.items.length}</strong>
                  </header>
                  <div className="notifications-lane-scroll">
                    <NotificationList
                      items={lane.items}
                      compact
                      emptyTitle="Coluna limpa"
                      emptyText="Nenhum card neste estado."
                      onRead={notifications.read}
                      onArchive={notifications.archive}
                      onSnooze={notifications.snooze}
                    />
                  </div>
                </article>
              ))}
            </section>
            {notifications.hasMore ? (
              <button className="button secondary" type="button" disabled={notifications.isLoadingMore} onClick={() => void notifications.loadMore()}>
                {notifications.isLoadingMore ? "Carregando..." : "Carregar mais notificacoes"}
              </button>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
