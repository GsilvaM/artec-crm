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
      setError(err instanceof Error ? err.message : "Não foi possível carregar o relatório.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="panel reports-panel" aria-label="Relatórios comerciais">
      <header>
        <div>
          <p className="eyebrow">Relatórios</p>
          <h2>Desempenho comercial</h2>
        </div>
      </header>

      <div className="filter-grid">
        <label>De<input type="date" value={filters.from ?? ""} onChange={(event) => setFilters({ ...filters, from: event.target.value || undefined })} /></label>
        <label>Até<input type="date" value={filters.to ?? ""} onChange={(event) => setFilters({ ...filters, to: event.target.value || undefined })} /></label>
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
            <article className="metric-card"><span>Valor orçado</span><strong>{formatMoney(report.budgetValue)}</strong></article>
            <article className="metric-card"><span>Valor aprovado</span><strong>{formatMoney(report.approvedValue)}</strong></article>
            <article className="metric-card"><span>Aprovações</span><strong>{report.approvedCount}</strong></article>
            <article className="metric-card"><span>Ticket médio</span><strong>{formatMoney(report.averageApprovedTicket)}</strong></article>
            <article className="metric-card"><span>Conversão</span><strong>{formatPercentValue(report.conversionRate)}</strong></article>
            <article className="metric-card"><span>Follow-ups vencidos</span><strong>{report.overdueFollowUps}</strong></article>
            <article className="metric-card"><span>Follow-ups concluídos</span><strong>{report.completedFollowUps}</strong></article>
            <article className="metric-card"><span>Dias até orçamento</span><strong>{formatDaysValue(report.averageDaysToQuote)}</strong></article>
            <article className="metric-card"><span>Dias até aprovação</span><strong>{formatDaysValue(report.averageDaysToApproval)}</strong></article>
            <article className="metric-card"><span>Dias até perda</span><strong>{formatDaysValue(report.averageDaysToLoss)}</strong></article>
          </div>

          <div className="admin-grid">
            <article className="admin-block">
              <h3>Oportunidades por etapa</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Etapa</th><th>Quantidade</th></tr></thead>
                  <tbody>
                    {report.opportunitiesByStage.map((row) => <tr key={row.stageId}><td>{row.stageName}</td><td>{row.count}</td></tr>)}
                    {!report.opportunitiesByStage.length ? <tr><td colSpan={2}>Sem dados no período.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="admin-block">
              <h3>Conversão por origem</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Origem</th><th>Criadas</th><th>Aprovadas</th><th>Conversão</th></tr></thead>
                  <tbody>
                    {report.conversionByOrigin.map((row) => (
                      <tr key={row.origem}><td>{row.origem}</td><td>{row.created}</td><td>{row.approved}</td><td>{formatPercentValue(row.conversionRate)}</td></tr>
                    ))}
                    {!report.conversionByOrigin.length ? <tr><td colSpan={4}>Sem dados no período.</td></tr> : null}
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
                    {!report.lossReasons.length ? <tr><td colSpan={2}>Nenhuma perda no período.</td></tr> : null}
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

// "0 dias" sozinho e ambiguo (pode parecer "sem dados" em vez de "no mesmo
// dia") — achado real de diagnostico visual. O backend ja distingue null
// (sem dados) de 0 (media real igual a zero); aqui so tornamos os dois casos
// inequivocos na exibicao, sem tocar no calculo.
function formatDaysValue(value: number | null): string {
  if (value === null) return "Sem dados";
  if (value === 0) return "Menos de 1 dia";
  return `${value} dias`;
}
