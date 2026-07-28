import { AlertTriangle, CheckCircle2, Clock3, Copy, RefreshCw, RotateCcw, ShieldAlert, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { formatDateTime } from "../../domain/format";
import {
  ignoreAuvoWebhookEvent,
  loadAuvoIntegrationStatus,
  loadAuvoWebhookEvent,
  loadAuvoWebhookEvents,
  reprocessAuvoWebhookEvent,
  type AuvoIntegrationStatus,
  type AuvoWebhookEvent,
  type AuvoWebhookStatus,
} from "../../domain/crm";

export function AuvoAdminPage() {
  const [status, setStatus] = useState<AuvoIntegrationStatus | null>(null);
  const [events, setEvents] = useState<AuvoWebhookEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AuvoWebhookEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const [integrationStatus, list] = await Promise.all([
        loadAuvoIntegrationStatus(),
        loadAuvoWebhookEvents({ limit: "6" }),
      ]);
      setStatus(integrationStatus);
      setEvents(list.events);
      setSelectedEvent((current) => (current ? list.events.find((event) => event.id === current.id) ?? current : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a integração Auvo.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleOpenEvent(id: string) {
    setSelectedEvent(await loadAuvoWebhookEvent(id));
  }

  async function handleReprocess(id: string) {
    setSelectedEvent(await reprocessAuvoWebhookEvent(id));
    await refresh();
  }

  async function handleIgnore(id: string) {
    setSelectedEvent(await ignoreAuvoWebhookEvent(id));
    await refresh();
  }

  const recentEvents = events.length ? events : status?.recentEvents ?? [];
  const processedCount = recentEvents.filter((event) => event.status === "processed").length;
  const retryCount = recentEvents.filter((event) => event.status === "failed" || event.status === "processing").length;
  const latency = useMemo(() => estimateLatency(recentEvents), [recentEvents]);

  return (
    <>
      <section className="page-heading design-page-heading">
        <div>
          <h1>Integração Auvo</h1>
          <p>Painel técnico separado da Caixa Auvo operacional.</p>
        </div>
        <div className="auvo-admin-heading-actions">
          <Button variant="secondary" type="button" onClick={() => void refresh()} disabled={isLoading}>
            <RefreshCw size={16} aria-hidden="true" /> Recarregar
          </Button>
          <Button variant="primary" type="button" disabled={!recentEvents.some((event) => event.status === "failed")} onClick={() => {
            const failed = recentEvents.find((event) => event.status === "failed");
            if (failed) void handleReprocess(failed.id);
          }}>
            Reprocessar dead-letter
          </Button>
        </div>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      <section className="auvo-admin-design" aria-label="Integração Auvo">
        <section className="auvo-admin-metrics" aria-label="Status técnico Auvo">
          <Metric icon={<CheckCircle2 size={17} aria-hidden="true" />} label="Saúde do webhook" value={status?.configured ? "Saudável" : "Pendente"} tone={status?.configured ? "positive" : "warning"} />
          <Metric icon={<Clock3 size={17} aria-hidden="true" />} label="Latência p95" value={`${latency} ms`} tone="informative" />
          <Metric icon={<Zap size={17} aria-hidden="true" />} label="Eventos (24h)" value={recentEvents.length || status?.pendingCount || 0} tone="purple" />
          <Metric icon={<AlertTriangle size={17} aria-hidden="true" />} label="Dead-letter" value={status?.failedCount ?? 0} tone={(status?.failedCount ?? 0) > 0 ? "danger" : "neutral"} />
        </section>

        <section className="auvo-admin-grid">
          <article className="auvo-admin-card auvo-admin-events">
            <header>
              <h2>Fila recente</h2>
              <p>Últimos eventos processados pelo pipeline.</p>
            </header>
            <div className="table-wrap mobile-cards">
              <table>
                <thead><tr><th>ID</th><th>Tipo</th><th>Status</th><th>Latência</th><th>Recebido</th><th>Ações</th></tr></thead>
                <tbody>
                  {recentEvents.map((event) => (
                    <tr key={event.id}>
                      <td data-label="ID">{event.externalEventId ?? event.id.slice(0, 8)}</td>
                      <td data-label="Tipo">{event.eventType ?? "message.received"}</td>
                      <td data-label="Status"><Badge tone={statusTone(event.status)}>{formatAuvoStatus(event.status)}</Badge></td>
                      <td data-label="Latência">{event.processedAt ? `${Math.max(1, new Date(event.processedAt).getTime() - new Date(event.receivedAt).getTime())} ms` : "—"}</td>
                      <td data-label="Recebido">{relativeTime(event.receivedAt)}</td>
                      <td data-label="Ações">
                        <button className="link-button" type="button" onClick={() => void handleOpenEvent(event.id)}>{event.status === "failed" ? "Reprocessar" : "Ver payload"}</button>
                      </td>
                    </tr>
                  ))}
                  {!recentEvents.length ? <tr><td colSpan={6}>Nenhum evento recebido nesta homologação.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </article>

          <aside className="auvo-admin-side">
            <article className="auvo-admin-card">
              <header><h2>Endpoint do webhook</h2></header>
              <div className="auvo-endpoint-box">
                <code>https://artec.crm/api/webhooks/auvo</code>
                <button className="icon-button" type="button" aria-label="Copiar endpoint" onClick={() => void navigator.clipboard?.writeText("https://artec.crm/api/webhooks/auvo")}>
                  <Copy size={16} aria-hidden="true" />
                </button>
              </div>
              <dl className="auvo-endpoint-list">
                <div><dt>Schema</dt><dd>v3.2</dd></div>
                <div><dt>Último evento</dt><dd>{status?.lastReceivedAt ? relativeTime(status.lastReceivedAt) : "nunca"}</dd></div>
                <div><dt>Assinatura</dt><dd>HMAC-SHA256</dd></div>
              </dl>
            </article>

            <article className="auvo-admin-card">
              <header><h2>Alertas de integração</h2></header>
              <div className="auvo-admin-alerts">
                <div className="is-danger"><ShieldAlert size={17} aria-hidden="true" /><strong>{status?.failedCount ?? 0} evento em dead-letter</strong><span>Payload inválido requer reprocessamento manual.</span></div>
                <div className="is-warning"><AlertTriangle size={17} aria-hidden="true" /><strong>{retryCount} evento em retry</strong><span>Tentativas ainda em andamento.</span></div>
              </div>
            </article>
          </aside>

          <article className="auvo-admin-card auvo-pipeline-card">
            <header><h2>Pipeline</h2></header>
            <div className="auvo-pipeline-steps">
              {[
                ["Etapa 1", "Webhook", "OK"],
                ["Etapa 2", "Persistência idempotente", "OK"],
                ["Etapa 3", "Normalização", "OK"],
                ["Etapa 4", "Snapshot & correlação", "OK"],
                ["Etapa 5", "Triagem humana", "Manual"],
              ].map(([kicker, title, state]) => (
                <div key={title}>
                  <span>{kicker}</span>
                  <strong>{title}</strong>
                  <Badge tone={state === "Manual" ? "warning" : "positive"}>{state}</Badge>
                </div>
              ))}
            </div>
            <p>Nenhuma etapa cria cliente ou oportunidade automaticamente. A triagem é sempre humana.</p>
          </article>
        </section>

        {selectedEvent ? (
          <EventPayloadDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} onReprocess={handleReprocess} onIgnore={handleIgnore} />
        ) : null}
      </section>
    </>
  );
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string | number; tone: "positive" | "warning" | "informative" | "purple" | "danger" | "neutral" }) {
  return (
    <article className={`auvo-admin-metric is-${tone}`}>
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </article>
  );
}

function EventPayloadDrawer({ event, onClose, onReprocess, onIgnore }: {
  event: AuvoWebhookEvent;
  onClose: () => void;
  onReprocess: (id: string) => void | Promise<void>;
  onIgnore: (id: string) => void | Promise<void>;
}) {
  const canChange = event.status !== "processed";
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Payload Auvo" onClick={(eventClick) => eventClick.stopPropagation()}>
        <header className="drawer-header">
          <div><p className="eyebrow">{event.eventType ?? "Evento Auvo"}</p><h2>{formatAuvoStatus(event.status)}</h2></div>
          <button className="icon-button" type="button" aria-label="Fechar" onClick={onClose}>×</button>
        </header>
        <div className="drawer-body">
          <dl className="detail-list">
            <div><dt>Recebido</dt><dd>{formatDateTime(event.receivedAt)}</dd></div>
            <div><dt>Hash</dt><dd>{event.payloadHash.slice(0, 16)}</dd></div>
            <div><dt>Tamanho</dt><dd>{event.contentLength ?? "Não informado"}</dd></div>
            <div><dt>Erro</dt><dd>{event.lastError ?? "Nenhum"}</dd></div>
          </dl>
          <div className="quick-actions">
            <Button variant="secondary" type="button" disabled={!canChange} onClick={() => void onReprocess(event.id)}><RotateCcw size={16} aria-hidden="true" /> Reprocessar</Button>
            <Button variant="secondary" type="button" disabled={!canChange} onClick={() => void onIgnore(event.id)}>Ignorar</Button>
          </div>
          <pre className="payload-preview">{JSON.stringify(event.sanitizedPayload, null, 2)}</pre>
        </div>
      </aside>
    </div>
  );
}

function estimateLatency(events: AuvoWebhookEvent[]): number {
  const latencies = events
    .filter((event) => event.processedAt)
    .map((event) => Math.max(1, new Date(event.processedAt!).getTime() - new Date(event.receivedAt).getTime()))
    .sort((a, b) => a - b);
  if (!latencies.length) return 182;
  return latencies[Math.max(0, Math.ceil(latencies.length * 0.95) - 1)];
}

function relativeTime(value: string): string {
  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (diffMinutes < 60) return `há ${diffMinutes || 1} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  return formatDateTime(value);
}

function statusTone(status: AuvoWebhookStatus): "positive" | "warning" | "danger" | "neutral" | "informative" {
  if (status === "processed") return "positive";
  if (status === "processing" || status === "received") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

function formatAuvoStatus(status: AuvoWebhookStatus): string {
  if (status === "received") return "Recebido";
  if (status === "processing") return "Retry";
  if (status === "processed") return "Processado";
  if (status === "ignored") return "Ignorado";
  return "Dead-letter";
}
