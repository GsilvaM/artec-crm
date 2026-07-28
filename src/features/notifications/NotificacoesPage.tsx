import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellOff, BellRing, CheckCheck, Clock3, Inbox, UserPlus, Zap } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { formatDateTime } from "../../domain/format";
import { loadNotificationPreferences, updateNotificationPreferences, type Notification, type NotificationPreferences } from "../../domain/crm";
import { useNotifications } from "./useNotifications";

type NotificationTab = "all" | "unread" | "urgent" | "integration";

const TAB_LABELS: Record<NotificationTab, string> = {
  all: "Todas",
  unread: "Não lidas",
  urgent: "Urgentes",
  integration: "Integração",
};

export function NotificacoesPage() {
  const [tab, setTab] = useState<NotificationTab>("all");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const notifications = useNotifications({ status: "active", limit: "30" });

  useEffect(() => {
    void notifications.refresh({ status: "active", limit: "30" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeNotifications = notifications.notifications.filter((item) => item.status !== "archived" && item.status !== "resolved");
  const urgentCount = activeNotifications.filter((item) => item.severity === "urgent").length;
  const unreadCount = activeNotifications.filter((item) => item.status === "unread").length;
  const filteredNotifications = useMemo(
    () => activeNotifications.filter((item) => {
      if (tab === "unread") return item.status === "unread";
      if (tab === "urgent") return item.severity === "urgent";
      if (tab === "integration") return item.type === "internal_error" || item.title.toLowerCase().includes("auvo") || item.body.toLowerCase().includes("auvo");
      return true;
    }),
    [activeNotifications, tab],
  );
  const groups = useMemo(() => groupNotifications(filteredNotifications), [filteredNotifications]);

  return (
    <>
      <section id="notificacoes" className="page-heading design-page-heading">
        <div>
          <h1>Notificações</h1>
          <p>{activeNotifications.length} alertas · {urgentCount} urgentes</p>
        </div>
        <div className="notifications-heading-actions">
          <Button variant="secondary" type="button" onClick={() => void notifications.readAll()} disabled={!unreadCount}>
            <CheckCheck size={16} aria-hidden="true" /> Marcar todas como lidas
          </Button>
          <Button variant="secondary" type="button" onClick={() => setPreferencesOpen(true)}>
            <BellOff size={16} aria-hidden="true" /> Preferências
          </Button>
        </div>
      </section>

      <section className="notifications-list-page" aria-label="Notificações internas">
        <div className="design-tabs notifications-tabs" role="group" aria-label="Filtrar notificações">
          {(Object.keys(TAB_LABELS) as NotificationTab[]).map((option) => (
            <button key={option} type="button" className={tab === option ? "active" : ""} onClick={() => setTab(option)}>
              {TAB_LABELS[option]}
            </button>
          ))}
        </div>

        {notifications.isLoading ? <LoadingPanels /> : null}
        {!notifications.isLoading && !filteredNotifications.length ? (
          <section className="notifications-period-card">
            <header><h2>Esta semana</h2></header>
            <EmptyState title="Nada por aqui" text="A fila está em dia." icon={<Inbox size={22} aria-hidden="true" />} />
          </section>
        ) : null}

        {!notifications.isLoading && filteredNotifications.length ? (
          <div className="notifications-periods">
            <NotificationPeriod title="Hoje" items={groups.today} onRead={notifications.read} onArchive={notifications.archive} onSnooze={notifications.snooze} />
            <NotificationPeriod title="Esta semana" items={groups.week} onRead={notifications.read} onArchive={notifications.archive} onSnooze={notifications.snooze} />
          </div>
        ) : null}

        {notifications.hasMore ? (
          <Button variant="secondary" type="button" disabled={notifications.isLoadingMore} onClick={() => void notifications.loadMore()}>
            {notifications.isLoadingMore ? "Carregando..." : "Carregar mais notificações"}
          </Button>
        ) : null}
      </section>

      {preferencesOpen ? <NotificationPreferencesModal onClose={() => setPreferencesOpen(false)} /> : null}
    </>
  );
}

function NotificationPreferencesModal({ onClose }: { onClose: () => void }) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    loadNotificationPreferences()
      .then((loaded) => {
        if (active) setPreferences(loaded);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Não foi possível carregar as preferências.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function savePreferences() {
    if (!preferences) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateNotificationPreferences({
        urgentEnabled: preferences.urgentEnabled,
        attentionEnabled: preferences.attentionEnabled,
        integrationEnabled: preferences.integrationEnabled,
        dailyDigestEnabled: preferences.dailyDigestEnabled,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar as preferências.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggle(key: keyof Omit<NotificationPreferences, "userId" | "updatedAt">) {
    setPreferences((current) => current ? { ...current, [key]: !current[key] } : current);
  }

  return (
    <Modal
      title="Preferências de notificação"
      subtitle="Controle quais alertas entram na sua fila operacional."
      icon={<BellOff size={20} />}
      onClose={onClose}
      footer={(
        <>
          <Button variant="primary" type="button" onClick={() => void savePreferences()} disabled={!preferences || isSaving}>
            {isSaving ? "Salvando..." : "Salvar preferências"}
          </Button>
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
        </>
      )}
    >
      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}
      {!preferences ? <LoadingPanels /> : (
        <div className="notification-preferences-list">
          <PreferenceToggle title="Urgentes" description="Ações vencidas, SLA em risco e oportunidades paradas." checked={preferences.urgentEnabled} onChange={() => toggle("urgentEnabled")} />
          <PreferenceToggle title="Atenção" description="Alertas importantes que não travam a rotina imediata." checked={preferences.attentionEnabled} onChange={() => toggle("attentionEnabled")} />
          <PreferenceToggle title="Integração Auvo" description="Erros de webhook, triagem e eventos que exigem revisão." checked={preferences.integrationEnabled} onChange={() => toggle("integrationEnabled")} />
          <PreferenceToggle title="Resumo diário" description="Receber um consolidado diário da fila comercial." checked={preferences.dailyDigestEnabled} onChange={() => toggle("dailyDigestEnabled")} />
        </div>
      )}
    </Modal>
  );
}

function PreferenceToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="notification-preference-toggle">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  );
}

function NotificationPeriod({ title, items, onRead, onArchive, onSnooze }: {
  title: string;
  items: Notification[];
  onRead: (id: string) => void | Promise<void>;
  onArchive: (id: string) => void | Promise<void>;
  onSnooze: (id: string) => void | Promise<void>;
}) {
  return (
    <section className="notifications-period-card" aria-label={title}>
      <header><h2>{title}</h2></header>
      {items.length ? (
        <ul className="notifications-design-list">
          {items.map((item) => (
            <li key={item.id} className={item.status === "unread" ? "is-unread" : ""}>
              <span className={`notifications-design-icon is-${item.severity}`}>{notificationIcon(item)}</span>
              <div className="notifications-design-main">
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </div>
              <time>{relativeTime(item.createdAt)}</time>
              <Button variant="primary" type="button" onClick={() => handlePrimaryAction(item, onRead, onArchive, onSnooze)}>
                {primaryActionLabel(item)}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Nada por aqui" text="Nenhuma notificação neste período." icon={<Inbox size={22} aria-hidden="true" />} />
      )}
    </section>
  );
}

function handlePrimaryAction(item: Notification, onRead: (id: string) => void | Promise<void>, onArchive: (id: string) => void | Promise<void>, onSnooze: (id: string) => void | Promise<void>) {
  if (item.status === "unread") return void onRead(item.id);
  if (item.severity === "urgent") return void onSnooze(item.id);
  return void onArchive(item.id);
}

function primaryActionLabel(item: Notification): string {
  if (item.type === "internal_error") return "Ver detalhes";
  if (item.type === "overdue_next_action") return "Abrir";
  if (item.title.toLowerCase().includes("auvo")) return "Triar";
  if (item.status === "unread") return "Ver";
  return "Arquivar";
}

function notificationIcon(item: Notification) {
  if (item.type === "internal_error") return <Zap size={17} aria-hidden="true" />;
  if (item.type === "opportunity_assigned" || item.type === "next_action_reassigned") return <UserPlus size={17} aria-hidden="true" />;
  if (item.severity === "urgent") return <Clock3 size={17} aria-hidden="true" />;
  if (item.severity === "attention") return <AlertTriangle size={17} aria-hidden="true" />;
  return <BellRing size={17} aria-hidden="true" />;
}

function groupNotifications(items: Notification[]): { today: Notification[]; week: Notification[] } {
  const today: Notification[] = [];
  const week: Notification[] = [];
  for (const item of items) {
    if (isToday(item.createdAt)) today.push(item);
    else week.push(item);
  }
  return { today, week };
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function relativeTime(value: string): string {
  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (diffMinutes < 60) return `há ${diffMinutes || 1} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  return formatDateTime(value);
}
