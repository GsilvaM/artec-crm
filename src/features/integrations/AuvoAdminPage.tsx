import { Copy, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingPanels } from "../../components/ui/Skeleton";
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

// Limite provisorio para sinalizar fila de pendentes fora do normal — achado
// real de diagnostico visual (contador sem nenhuma indicacao de severidade).
// Ajustar quando a Artec definir um limite operacional real.
const PENDING_COUNT_WARNING_THRESHOLD = 50;

export function AuvoAdminPage() {
  const [status, setStatus] = useState<AuvoIntegrationStatus | null>(null);
  const [events, setEvents] = useState<AuvoWebhookEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AuvoWebhookEvent | null>(null);
  const [filter, setFilter] = useState<AuvoWebhookStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh(currentFilter = filter) {
    setIsLoading(true);
    setError(null);
    try {
      const [integrationStatus, list] = await Promise.all([
        loadAuvoIntegrationStatus(),
        loadAuvoWebhookEvents({ status: currentFilter || undefined, limit: "10" }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFilterChange(value: AuvoWebhookStatus | "") {
    setFilter(value);
    await refresh(value);
  }

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

  const pendingCount = status?.pendingCount ?? 0;
  const failedCount = status?.failedCount ?? 0;

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Configurações</p>
          <h1>Integração Auvo</h1>
        </div>
        <button className="button secondary" type="button" onClick={() => void refresh()} disabled={isLoading}>
          <RefreshCw aria-hidden="true" />
          Atualizar
        </button>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {isLoading && !status ? (
        <LoadingPanels />
      ) : (
        <section className="panel auvo-admin" aria-label="Integração Auvo">
          <header>
            <div>
              <p className="eyebrow">Homologação</p>
              <h2>Status e eventos recebidos</h2>
            </div>
            <div className="filter-actions">
              <select aria-label="Filtrar eventos Auvo por status" value={filter} onChange={(event) => void handleFilterChange(event.target.value as AuvoWebhookStatus | "")}>
                <option value="">Todos</option>
                <option value="received">Recebidos</option>
                <option value="processing">Processando</option>
                <option value="processed">Processados</option>
                <option value="ignored">Ignorados</option>
                <option value="failed">Falhas</option>
              </select>
            </div>
          </header>
          <div className="auvo-status-grid">
            <Metric label="Webhook" value={status?.configured ? "Configurado" : "Pendente"} />
            <Metric
              label="Pendentes"
              value={pendingCount}
              tone={pendingCount > PENDING_COUNT_WARNING_THRESHOLD ? "warning" : "neutral"}
            />
            <Metric label="Falhas" value={failedCount} tone={failedCount > 0 ? "danger" : "neutral"} />
            <Metric label="Último evento" value={formatShortDate(status?.lastReceivedAt)} />
          </div>
          <div className="auvo-layout">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Recebido</th><th>Tipo</th><th>Status</th><th>Tentativas</th><th>Ações</th></tr></thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>{formatShortDate(event.receivedAt)}</td>
                      <td>{event.eventType ?? "Não informado"}</td>
                      <td>{formatAuvoStatus(event.status)}</td>
                      <td>{event.attemptCount}</td>
                      <td>
                        <div className="row-actions">
                          <button className="button ghost" type="button" onClick={() => void handleOpenEvent(event.id)}>Detalhe</button>
                          <button className="button ghost" type="button" onClick={() => void navigator.clipboard?.writeText(event.id)} aria-label="Copiar ID do evento Auvo">
                            <Copy aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!events.length ? <tr><td colSpan={5}>Nenhum evento recebido nesta homologação.</td></tr> : null}
                </tbody>
              </table>
            </div>
            <AuvoEventDetail event={selectedEvent} onReprocess={handleReprocess} onIgnore={handleIgnore} />
          </div>
        </section>
      )}
    </>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "warning" | "danger" }) {
  return (
    <article className={`metric-card${tone !== "neutral" ? ` metric-card-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AuvoEventDetail({ event, onReprocess, onIgnore }: {
  event: AuvoWebhookEvent | null;
  onReprocess: (id: string) => void | Promise<void>;
  onIgnore: (id: string) => void | Promise<void>;
}) {
  if (!event) {
    return (
      <aside className="auvo-detail">
        <EmptyState title="Selecione um evento" text="O payload exibido aqui sempre passa por sanitização." />
      </aside>
    );
  }

  const canChange = event.status !== "processed";

  return (
    <aside className="auvo-detail">
      <header>
        <div>
          <p className="eyebrow">{event.eventType ?? "Evento sem tipo"}</p>
          <h3>{formatAuvoStatus(event.status)}</h3>
        </div>
        <span className="badge">{event.id.slice(0, 8)}</span>
      </header>
      <dl className="detail-list">
        <div><dt>Recebido</dt><dd>{formatDateTime(event.receivedAt)}</dd></div>
        <div><dt>Hash</dt><dd>{event.payloadHash.slice(0, 16)}</dd></div>
        <div><dt>Tamanho</dt><dd>{event.contentLength ?? "Não informado"}</dd></div>
        <div><dt>Erro</dt><dd>{event.lastError ?? "Nenhum"}</dd></div>
      </dl>
      <div className="quick-actions">
        <button className="button secondary" type="button" disabled={!canChange} onClick={() => void onReprocess(event.id)}>Reprocessar</button>
        <button className="button ghost" type="button" disabled={!canChange} onClick={() => void onIgnore(event.id)}>Ignorar</button>
      </div>
      <pre className="payload-preview">{JSON.stringify(event.sanitizedPayload, null, 2)}</pre>
    </aside>
  );
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatAuvoStatus(status: AuvoWebhookStatus): string {
  if (status === "received") return "Recebido";
  if (status === "processing") return "Processando";
  if (status === "processed") return "Processado";
  if (status === "ignored") return "Ignorado";
  return "Falha";
}
