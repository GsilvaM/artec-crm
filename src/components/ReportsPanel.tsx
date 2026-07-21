import { useEffect, useState } from "react";
import { formatMoney } from "../domain/format";
import { loadCommercialReport, type CommercialReport, type CommercialReportFilters, type PipelineStage } from "../domain/crm";

export function ReportsPanel({ stages }: { stages: PipelineStage[] }) {
  const [filters, setFilters] = useState<CommercialReportFilters>({});
  const [report, setReport] = useState<CommercialReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      setReport(await loadCommercialReport(filters));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar o relatorio.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="panel reports-panel" aria-label="Relatorios comerciais">
      <header>
        <div>
          <p className="eyebrow">Relatorios</p>
          <h2>Desempenho comercial</h2>
        </div>
      </header>

      <div className="filter-grid">
        <label>De<input type="date" value={filters.from ?? ""} onChange={(event) => setFilters({ ...filters, from: event.target.value || undefined })} /></label>
        <label>Ate<input type="date" value={filters.to ?? ""} onChange={(event) => setFilters({ ...filters, to: event.target.value || undefined })} /></label>
        <label>Etapa
          <select value={filters.stageId ?? ""} onChange={(event) => setFilters({ ...filters, stageId: event.target.value || undefined })}>
            <option value="">Todas</option>
            {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.nome}</option>)}
          </select>
        </label>
      </div>
      <div className="filter-actions">
        <button className="button secondary" type="button" onClick={refresh} disabled={isLoading}>Aplicar filtros</button>
      </div>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {report ? (
        <>
          <div className="reports-metrics-grid">
            <article className="metric-card"><span>Novos leads</span><strong>{report.newLeads}</strong></article>
            <article className="metric-card"><span>Oportunidades criadas</span><strong>{report.opportunitiesCreated}</strong></article>
            <article className="metric-card"><span>Valor orcado</span><strong>{formatMoney(report.budgetValue)}</strong></article>
            <article className="metric-card"><span>Valor aprovado</span><strong>{formatMoney(report.approvedValue)}</strong></article>
            <article className="metric-card"><span>Aprovacoes</span><strong>{report.approvedCount}</strong></article>
            <article className="metric-card"><span>Ticket medio</span><strong>{formatMoney(report.averageApprovedTicket)}</strong></article>
            <article className="metric-card"><span>Conversao</span><strong>{formatPercentValue(report.conversionRate)}</strong></article>
            <article className="metric-card"><span>Follow-ups vencidos</span><strong>{report.overdueFollowUps}</strong></article>
            <article className="metric-card"><span>Follow-ups concluidos</span><strong>{report.completedFollowUps}</strong></article>
            <article className="metric-card"><span>Dias ate orcamento</span><strong>{formatDaysValue(report.averageDaysToQuote)}</strong></article>
            <article className="metric-card"><span>Dias ate aprovacao</span><strong>{formatDaysValue(report.averageDaysToApproval)}</strong></article>
            <article className="metric-card"><span>Dias ate perda</span><strong>{formatDaysValue(report.averageDaysToLoss)}</strong></article>
          </div>

          <div className="admin-grid">
            <article className="admin-block">
              <h3>Oportunidades por etapa</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Etapa</th><th>Quantidade</th></tr></thead>
                  <tbody>
                    {report.opportunitiesByStage.map((row) => <tr key={row.stageId}><td>{row.stageName}</td><td>{row.count}</td></tr>)}
                    {!report.opportunitiesByStage.length ? <tr><td colSpan={2}>Sem dados no periodo.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="admin-block">
              <h3>Conversao por origem</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Origem</th><th>Criadas</th><th>Aprovadas</th><th>Conversao</th></tr></thead>
                  <tbody>
                    {report.conversionByOrigin.map((row) => (
                      <tr key={row.origem}><td>{row.origem}</td><td>{row.created}</td><td>{row.approved}</td><td>{formatPercentValue(row.conversionRate)}</td></tr>
                    ))}
                    {!report.conversionByOrigin.length ? <tr><td colSpan={4}>Sem dados no periodo.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="admin-block">
              <h3>Motivos de perda</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Motivo</th><th>Quantidade</th></tr></thead>
                  <tbody>
                    {report.lossReasons.map((row) => <tr key={row.reason}><td>{row.reason}</td><td>{row.count}</td></tr>)}
                    {!report.lossReasons.length ? <tr><td colSpan={2}>Nenhuma perda no periodo.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}

function formatPercentValue(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

function formatDaysValue(value: number | null): string {
  return value === null ? "Sem dados" : `${value} dias`;
}
