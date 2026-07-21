import { useEffect, useState } from "react";
import { Drawer } from "./Drawer";
import { EmptyState } from "./EmptyState";
import { formatActivityType, formatDateTime } from "../../domain/format";
import {
  createQuote,
  loadCustomerActivities,
  loadOpportunity,
  loadOpportunityActivities,
  loadOpportunityQuotes,
  updateQuote,
  type Activity,
  type Opportunity,
  type Quote,
  type QuoteStatus,
} from "../../domain/crm";
import { QuotesPanel } from "../QuotesPanel";

export type TimelineTarget = { type: "customer"; id: string; name: string } | { type: "opportunity"; id: string; name: string };

export function TimelineDrawer({ target, onClose }: { target: TimelineTarget; onClose: () => void }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    async function load() {
      if (target.type === "customer") {
        const items = await loadCustomerActivities(target.id);
        if (!cancelled) setActivities(items);
      } else {
        const [items, opportunityRecord, opportunityQuotes] = await Promise.all([
          loadOpportunityActivities(target.id),
          loadOpportunity(target.id),
          loadOpportunityQuotes(target.id),
        ]);
        if (!cancelled) {
          setActivities(items);
          setOpportunity(opportunityRecord);
          setQuotes(opportunityQuotes);
        }
      }
    }
    load()
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Nao foi possivel carregar a linha do tempo."))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [target.type, target.id]);

  async function handleCreateQuote(valorReais: string, resumo: string) {
    if (!opportunity) return;
    const valor = Math.round(Number(valorReais.replace(",", ".")) * 100);
    if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe um valor valido para o orcamento.");
    await createQuote(opportunity.id, { valor, resumo: resumo.trim() || undefined });
    setQuotes(await loadOpportunityQuotes(opportunity.id));
  }

  async function handleUpdateQuoteStatus(quote: Quote, status: QuoteStatus) {
    await updateQuote(quote.id, { status });
    if (opportunity) setQuotes(await loadOpportunityQuotes(opportunity.id));
  }

  return (
    <Drawer title={target.name} subtitle={target.type === "customer" ? "Linha do tempo do cliente" : "Linha do tempo da oportunidade"} onClose={onClose}>
      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}
      {isLoading ? (
        <div className="panel"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-line" /></div>
      ) : (
        <>
          {target.type === "opportunity" ? <QuotesPanel opportunity={opportunity} quotes={quotes} onCreate={handleCreateQuote} onUpdateStatus={handleUpdateQuoteStatus} /> : null}
          {activities.length ? (
            <ol className="timeline-list">
              {activities.map((activity) => (
                <li key={activity.id}>
                  <strong>{formatActivityType(activity.type)}</strong>
                  <span>{formatDateTime(activity.occurredAt)}</span>
                  <p>{activity.description}</p>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="Nenhuma atividade registrada" text="O historico aparece aqui assim que houver o primeiro registro." />
          )}
        </>
      )}
    </Drawer>
  );
}
