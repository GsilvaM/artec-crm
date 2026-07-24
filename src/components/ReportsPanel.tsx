import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, DollarSign, Filter, TrendingUp } from "lucide-react";
import { formatMoney } from "../domain/format";
import { loadCommercialReport, type CommercialReport, type CommercialReportFilters, type PipelineStage } from "../domain/crm";

type ReportMetric = {
  label: string;
  value: string;
  detail: string;
  tone?: "good" | "warning" | "neutral";
};

export function ReportsPanel({ stages }: { stages: PipelineStage[] }) {
  const [filters, setFilters] = useState<CommercialReportFilters>({});
  const [report, setReport] = useState<CommercialReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const metrics = report ? buildReportMetrics(report) : [];
  const maxStageCount = Math.max(1, ...(report?.opportunitiesByStage.map((row) => row.count) ?? [0]));
  const maxOriginCount = Math.max(1, ...(report?.conversionByOrigin.map((row) => row.created) ?? [0]));
  const maxLossCount = Math.max(1, ...(report?.lossReasons.map((row) => row.count) ?? [0]));
  const followUpTotal = report ? report.completedFollowUps + report.overdueFollowUps : 0;
  const followUpCompletion = followUpTotal ? report!.completedFollowUps / followUpTotal : null;

  return (
    <section className="reports-panel" aria-label="Relatorios comerciais">
      <header className="reports-header">
        <div>
          <p className="eyebrow">Relatorios</p>
          <h2>Desempenho comercial</h2>
          <p>Leia conversao, receita aprovada e pendencias de follow-up antes de abrir a carteira.</p>
        </div>
      </header>

      <div className="reports-filter-bar" aria-label="Filtros do relatorio comercial">
        <label>De<input type="date" value={filters.from ?? ""} onChange={(event) => setFilters({ ...filters, from: event.target.value || undefined })} /></label>
        <label>Ate<input type="date" value={filters.to ?? ""} onChange={(event) => setFilters({ ...filters, to: event.target.value || undefined })} /></label>
        <label>Etapa
          <select value={filters.stageId ?? ""} onChange={(event) => setFilters({ ...filters, stageId: event.target.value || undefined })}>
            <option value="">Todas</option>
            {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.nome}</option>)}
          </select>
        </label>
        <button className="button secondary" type="button" onClick={() => void refresh()} disabled={isLoading}>
          <Filter aria-hidden="true" size={16} /> Aplicar
        </button>
      </div>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {report ? (
        <>
          <section className="reports-decision-grid" aria-label="Indicadores principais">
            {metrics.map((metric) => (
              <article key={metric.label} className={`report-decision-card report-decision-card-${metric.tone ?? "neutral"}`}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.detail}</small>
              </article>
            ))}
          </section>

          <section className="reports-main-grid">
            <article className="report-section" aria-label="Oportunidades por etapa">
              <header>
                <TrendingUp aria-hidden="true" size={18} />
                <h3>Oportunidades por etapa</h3>
              </header>
              {report.opportunitiesByStage.length ? (
                <ol className="report-bar-list">
                  {report.opportunitiesByStage.map((row) => (
                    <li key={row.stageId}>
                      <div>
                        <span>{row.stageName}</span>
                        <strong>{row.count}</strong>
                      </div>
                      <meter min={0} max={maxStageCount} value={row.count} aria-label={`${row.stageName}: ${row.count} oportunidades`} />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="quotes-empty">Sem dados no periodo.</p>
              )}
            </article>

            <article className="report-section" aria-label="Conversao por origem">
              <header>
                <DollarSign aria-hidden="true" size={18} />
                <h3>Conversao por origem</h3>
              </header>
              {report.conversionByOrigin.length ? (
                <ol className="report-origin-list">
                  {report.conversionByOrigin.map((row) => (
                    <li key={row.origem}>
                      <div>
                        <strong>{row.origem}</strong>
                        <span>{row.created} criadas - {row.approved} aprovadas - {formatPercentValue(row.conversionRate)}</span>
                      </div>
                      <meter min={0} max={maxOriginCount} value={row.created} aria-label={`${row.origem}: ${row.created} oportunidades criadas`} />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="quotes-empty">Sem dados no periodo.</p>
              )}
            </article>
          </section>

          <section className="reports-secondary-grid">
            <article className="report-section" aria-label="Eficiencia de follow-up">
              <header>
                <CheckCircle2 aria-hidden="true" size={18} />
                <h3>Eficiencia de follow-up</h3>
              </header>
              <div className="report-followup-grid">
                <span><CheckCircle2 aria-hidden="true" size={16} /> {report.completedFollowUps} concluidos</span>
                <span><AlertTriangle aria-hidden="true" size={16} /> {report.overdueFollowUps} vencidos</span>
                <span><Clock3 aria-hidden="true" size={16} /> {followUpCompletion === null ? "Sem base" : formatPercentValue(followUpCompletion)} resolvidos</span>
              </div>
            </article>

            <article className="report-section" aria-label="Motivos de perda">
              <header>
                <AlertTriangle aria-hidden="true" size={18} />
                <h3>Motivos de perda</h3>
              </header>
              {report.lossReasons.length ? (
                <ol className="report-bar-list">
                  {report.lossReasons.map((row) => (
                    <li key={row.reason}>
                      <div>
                        <span>{row.reason}</span>
                        <strong>{row.count}</strong>
                      </div>
                      <meter min={0} max={maxLossCount} value={row.count} aria-label={`${row.reason}: ${row.count} perdas`} />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="quotes-empty">Nenhuma perda no periodo.</p>
              )}
            </article>
          </section>
        </>
      ) : null}
    </section>
  );
}

function buildReportMetrics(report: CommercialReport): ReportMetric[] {
  const openBudget = Math.max(0, report.budgetValue - report.approvedValue);
  return [
    {
      label: "Valor aprovado",
      value: formatMoney(report.approvedValue),
      detail: `${report.approvedCount} aprovacao(oes) - ticket medio ${formatMoney(report.averageApprovedTicket)}`,
      tone: report.approvedValue > 0 ? "good" : "neutral",
    },
    {
      label: "Conversao",
      value: formatPercentValue(report.conversionRate),
      detail: `${report.opportunitiesCreated} oportunidades criadas`,
      tone: report.conversionRate >= 0.35 ? "good" : report.conversionRate > 0 ? "warning" : "neutral",
    },
    {
      label: "Valor em aberto",
      value: formatMoney(openBudget),
      detail: `${formatMoney(report.budgetValue)} orcado no periodo`,
      tone: openBudget > 0 ? "warning" : "neutral",
    },
    {
      label: "Tempo ate aprovacao",
      value: formatDaysValue(report.averageDaysToApproval),
      detail: `Orcamento: ${formatDaysValue(report.averageDaysToQuote)} - perda: ${formatDaysValue(report.averageDaysToLoss)}`,
      tone: "neutral",
    },
  ];
}

function formatPercentValue(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

function formatDaysValue(value: number | null): string {
  if (value === null) return "Sem dados";
  if (value === 0) return "Menos de 1 dia";
  return `${value} dias`;
}
