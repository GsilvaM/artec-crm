import { type FormEvent, useState } from "react";
import { FileText } from "lucide-react";
import { formatDateTime, formatMoney } from "../domain/format";
import type { Opportunity, Quote, QuoteStatus } from "../domain/crm";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  revisado: "Revisado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  expirado: "Expirado",
};

const NEXT_STATUS_ACTIONS: Record<QuoteStatus, { status: QuoteStatus; label: string }[]> = {
  rascunho: [{ status: "enviado", label: "Enviar" }],
  enviado: [
    { status: "revisado", label: "Marcar revisado" },
    { status: "aprovado", label: "Aprovar" },
    { status: "recusado", label: "Recusar" },
    { status: "expirado", label: "Expirar" },
  ],
  revisado: [
    { status: "aprovado", label: "Aprovar" },
    { status: "recusado", label: "Recusar" },
    { status: "expirado", label: "Expirar" },
  ],
  aprovado: [],
  recusado: [],
  expirado: [],
};

export function QuotesPanel({ opportunity, quotes, onCreate, onUpdateStatus }: {
  opportunity: Opportunity | null;
  quotes: Quote[];
  onCreate: (valorReais: string, resumo: string) => void | Promise<void>;
  onUpdateStatus: (quote: Quote, status: QuoteStatus) => void | Promise<void>;
}) {
  const [valorReais, setValorReais] = useState("");
  const [resumo, setResumo] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!opportunity) {
    return (
      <section className="panel quotes-panel" aria-label="Orçamentos">
        <header>
          <p className="eyebrow">Orçamentos</p>
          <h2>Nenhuma oportunidade selecionada</h2>
        </header>
        <p className="quotes-empty">Abra o histórico de uma oportunidade para ver e gerenciar seus orçamentos.</p>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await onCreate(valorReais, resumo);
      setValorReais("");
      setResumo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o orçamento.");
    }
  }

  return (
    <section className="panel quotes-panel" aria-label="Orçamentos">
      <header>
        <div>
          <p className="eyebrow">Orçamentos</p>
          <h2>{opportunity.titulo}</h2>
        </div>
      </header>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {quotes.length ? (
        <ul className="quotes-list">
          {quotes.map((quote) => (
            <li key={quote.id} className="quote-item">
              <div className="quote-item-header">
                <strong>Versão {quote.versao}</strong>
                <span className="badge">{STATUS_LABELS[quote.status]}</span>
              </div>
              <p className="quote-value">{formatMoney(quote.valor)}</p>
              {quote.resumo ? <p className="quote-summary">{quote.resumo}</p> : null}
              <dl className="quote-dates">
                {quote.enviadoEm ? <div><dt>Enviado</dt><dd>{formatDateTime(quote.enviadoEm)}</dd></div> : null}
                {quote.respondidoEm ? <div><dt>Respondido</dt><dd>{formatDateTime(quote.respondidoEm)}</dd></div> : null}
              </dl>
              {NEXT_STATUS_ACTIONS[quote.status].length ? (
                <div className="quick-actions">
                  {NEXT_STATUS_ACTIONS[quote.status].map((action) => (
                    <button key={action.status} className="button secondary" type="button" onClick={() => void onUpdateStatus(quote, action.status)}>
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="quotes-empty">Nenhum orçamento registrado para esta oportunidade.</p>
      )}

      <form className="admin-inline-form" onSubmit={handleSubmit}>
        <label>Valor (R$)<input required type="number" min="0.01" step="0.01" value={valorReais} onChange={(event) => setValorReais(event.target.value)} /></label>
        <label>Resumo<input value={resumo} onChange={(event) => setResumo(event.target.value)} /></label>
        <button className="button primary" type="submit"><FileText aria-hidden="true" />Novo orçamento</button>
      </form>
    </section>
  );
}
