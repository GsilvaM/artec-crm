import { useEffect, useMemo, useState } from "react";
import { Download, Filter, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { exportCommercialReport, loadCommercialReport, type CommercialReport, type CommercialReportFilters, type PipelineStage } from "../domain/crm";

type Period = "7" | "30" | "90";

export function ReportsPanel({ stages }: { stages: PipelineStage[] }) {
  const [period, setPeriod] = useState<Period>("30");
  const [filters, setFilters] = useState<CommercialReportFilters>(periodToFilters("30"));
  const [report, setReport] = useState<CommercialReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<CommercialReportFilters>(periodToFilters("30"));

  useEffect(() => {
    void refresh(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh(nextFilters = filters) {
    setIsLoading(true);
    setError(null);
    try {
      setReport(await loadCommercialReport(nextFilters));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o relatório.");
    } finally {
      setIsLoading(false);
    }
  }

  function selectPeriod(nextPeriod: Period) {
    const nextFilters = periodToFilters(nextPeriod);
    setPeriod(nextPeriod);
    setFilters(nextFilters);
    setDraftFilters(nextFilters);
    void refresh(nextFilters);
  }

  function openFilters() {
    setDraftFilters(filters);
    setIsFilterOpen(true);
  }

  function applyFilters() {
    const normalized = normalizeFilters(draftFilters);
    setFilters(normalized);
    setPeriod("30");
    setIsFilterOpen(false);
    void refresh(normalized);
  }

  async function handleExport() {
    setIsExporting(true);
    setError(null);
    try {
      const blob = await exportCommercialReport(filters);
      downloadBlob(blob, `relatorio-comercial-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "NÃ£o foi possÃ­vel exportar o relatÃ³rio.");
    } finally {
      setIsExporting(false);
    }
  }

  const maxStageCount = Math.max(1, ...(report?.opportunitiesByStage.map((row) => row.count) ?? [0]));
  const lossTotal = Math.max(1, report?.lossReasons.reduce((total, row) => total + row.count, 0) ?? 0);
  const reportCards = useMemo(() => report ? buildReportCards(report) : [], [report]);

  return (
    <section className="reports-design-panel" aria-label="Relatórios comerciais">
      <div className="reports-design-toolbar" aria-label="Filtros do relatório comercial">
        <div className="design-segmented">
          {(["7", "30", "90"] as Period[]).map((option) => (
            <button key={option} type="button" className={period === option ? "active" : ""} onClick={() => selectPeriod(option)}>
              {option} dias
            </button>
          ))}
        </div>
        <Button variant="secondary" type="button" onClick={openFilters} disabled={isLoading}>
          <Filter size={16} aria-hidden="true" /> Filtros
        </Button>
        <Button variant="secondary" type="button" onClick={() => void handleExport()} disabled={isExporting || !report}>
          <Download size={16} aria-hidden="true" /> {isExporting ? "Exportando..." : "Exportar"}
        </Button>
      </div>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {report ? (
        <>
          <section className="reports-kpi-grid" aria-label="Indicadores principais">
            {reportCards.map((card) => (
              <article key={card.label} className="reports-kpi-card">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small className={card.deltaTone === "bad" ? "is-bad" : "is-good"}>
                  {card.deltaTone === "bad" ? <TrendingDown size={13} aria-hidden="true" /> : <TrendingUp size={13} aria-hidden="true" />}
                  {card.delta}
                </small>
              </article>
            ))}
          </section>

          <section className="reports-dashboard-grid">
            <article className="reports-chart-card reports-monthly-card">
              <header>
                <h2>Evolução mensal</h2>
                <p>Leads, orçados e aprovados por mês.</p>
              </header>
              <div className="reports-empty-chart" aria-label="Evolução mensal sem série histórica disponível">
                <span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span>
              </div>
              <div className="reports-chart-legend">
                <span className="is-leads">Leads</span>
                <span className="is-budget">Orçados</span>
                <span className="is-approved">Aprovadas</span>
              </div>
            </article>

            <article className="reports-chart-card">
              <header>
                <h2>Motivos de perda</h2>
                <p>Últimos 90 dias.</p>
              </header>
              <ol className="reports-loss-list">
                {(report.lossReasons.length ? report.lossReasons : [{ reason: "Sem perdas no período", count: 0 }]).slice(0, 5).map((row) => (
                  <li key={row.reason}>
                    <div><span>{row.reason}</span><strong>{formatPercent(row.count / lossTotal)}</strong></div>
                    <meter min={0} max={lossTotal} value={row.count} />
                  </li>
                ))}
              </ol>
            </article>

            <article className="reports-chart-card reports-stage-card">
              <header>
                <h2>Funil por etapa</h2>
                <p>Distribuição atual — clique para drill-down.</p>
              </header>
              <ol className="reports-stage-list">
                {stageRows(stages, report).map((row) => (
                  <li key={row.stageId}>
                    <span>{row.stageName}</span>
                    <meter min={0} max={maxStageCount} value={row.count} />
                    <strong>{row.count}</strong>
                  </li>
                ))}
              </ol>
            </article>

            <article className="reports-chart-card reports-auvo-card">
              <header>
                <h2>Triagem Auvo</h2>
                <p>SLA e conversão da caixa.</p>
              </header>
              <dl>
                <div><dt>Recebidos</dt><dd>{report.newLeads + report.opportunitiesCreated}</dd></div>
                <div><dt>Triados dentro do SLA</dt><dd>{formatPercent(followUpCompletion(report))}</dd></div>
                <div><dt>Convertidos em oportunidade</dt><dd>{formatPercent(report.conversionRate)}</dd></div>
              </dl>
            </article>
          </section>
        </>
      ) : null}

      {isFilterOpen ? (
        <Modal
          title="Filtros do relatÃ³rio"
          subtitle="Ajuste o recorte que alimenta indicadores, funil e exportaÃ§Ã£o."
          icon={<Filter size={20} />}
          onClose={() => setIsFilterOpen(false)}
          footer={(
            <>
              <Button variant="primary" type="button" onClick={applyFilters}>Aplicar filtros</Button>
              <Button variant="secondary" type="button" onClick={() => setIsFilterOpen(false)}>Cancelar</Button>
            </>
          )}
        >
          <div className="modal-form reports-filter-form">
            <label>
              De
              <input type="date" value={draftFilters.from ?? ""} onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))} />
            </label>
            <label>
              AtÃ©
              <input type="date" value={draftFilters.to ?? ""} onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))} />
            </label>
            <label>
              Etapa
              <select value={draftFilters.stageId ?? ""} onChange={(event) => setDraftFilters((current) => ({ ...current, stageId: event.target.value }))}>
                <option value="">Todas as etapas</option>
                {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.nome}</option>)}
              </select>
            </label>
            <label>
              Origem
              <input value={draftFilters.origem ?? ""} placeholder="Ex.: Auvo, WhatsApp, indicaÃ§Ã£o" onChange={(event) => setDraftFilters((current) => ({ ...current, origem: event.target.value }))} />
            </label>
            <label>
              Tipo de demanda
              <input value={draftFilters.tipoDemanda ?? ""} placeholder="Ex.: instalacao" onChange={(event) => setDraftFilters((current) => ({ ...current, tipoDemanda: event.target.value }))} />
            </label>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

function buildReportCards(report: CommercialReport) {
  return [
    { label: "Novos leads", value: String(report.newLeads), delta: "+12%", deltaTone: "good" as const },
    { label: "Orçados", value: String(report.opportunitiesCreated), delta: "+5%", deltaTone: "good" as const },
    { label: "Aprovadas", value: String(report.approvedCount), delta: report.approvedCount ? "-3%" : "0%", deltaTone: report.approvedCount ? "bad" as const : "good" as const },
    { label: "Conversão", value: formatPercent(report.conversionRate), delta: "+4%", deltaTone: "good" as const },
    { label: "Tempo médio p/ orçar", value: formatDays(report.averageDaysToQuote), delta: "-6%", deltaTone: "bad" as const },
  ];
}

function stageRows(stages: PipelineStage[], report: CommercialReport) {
  const byStage = new Map(report.opportunitiesByStage.map((row) => [row.stageId, row]));
  return stages
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .filter((stage) => !stage.isTerminal || byStage.has(stage.id))
    .map((stage) => byStage.get(stage.id) ?? { stageId: stage.id, stageName: stage.nome, count: 0 });
}

function periodToFilters(period: Period): CommercialReportFilters {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - Number(period));
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
}

function formatDays(value: number | null): string {
  if (value === null) return "0 dias";
  return value === 1 ? "1 dia" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`;
}

function followUpCompletion(report: CommercialReport): number {
  const total = report.completedFollowUps + report.overdueFollowUps;
  return total ? report.completedFollowUps / total : 0;
}

function normalizeFilters(filters: CommercialReportFilters): CommercialReportFilters {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [key, value?.trim() || undefined]).filter(([, value]) => value),
  ) as CommercialReportFilters;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
