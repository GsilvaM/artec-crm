import { useEffect, useMemo, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { NotificationList } from "../../components/ui/NotificationList";
import { formatMoney } from "../../domain/format";
import {
  loadCommercialCenter,
  loadPipelineStages,
  type CommercialCenter,
  type CommercialCenterFilters,
  type PipelineStage,
} from "../../domain/crm";
import { useNotifications } from "../notifications/useNotifications";
import { useActionOperation, type ActionOperationTarget } from "../next-actions/useActionOperation";
import { ActionOperationForm } from "../next-actions/ActionOperationForm";
import { CommercialActionBlock } from "./CommercialActionBlock";
import { CommercialOpportunityBlock } from "./CommercialOpportunityBlock";

const CATEGORY_FILTER_LABELS: Record<string, string> = {
  commercial: "Comercial",
  warranty: "Garantia",
  support: "Suporte",
  after_sales: "Pós-venda",
};

const PRIORITY_FILTER_LABELS: Record<string, string> = {
  high: "Alta",
  normal: "Normal",
  low: "Baixa",
};

export function CentralComercialPage({ currentUserId }: { currentUserId: string }) {
  const [filters, setFilters] = useState<CommercialCenterFilters>({});
  const [center, setCenter] = useState<CommercialCenter | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const notifications = useNotifications({ status: "active", limit: "5" });

  async function refresh(nextFilters: CommercialCenterFilters = filters) {
    setIsLoading(true);
    setError(null);
    try {
      const [centerData, stageData] = await Promise.all([loadCommercialCenter(nextFilters), loadPipelineStages()]);
      setCenter(centerData);
      setStages(stageData);
      await notifications.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a Central Comercial.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionOperation = useActionOperation(currentUserId, refresh);
  const hasFilters = Object.values(filters).some((value) => Boolean(value));

  function openOpportunity(id: string) {
    navigate(`/oportunidades/${id}`);
  }

  function toActionTarget(item: { id: string; customerId: string; customerName: string; opportunityId: string | null; category: ActionOperationTarget["category"]; dueAt: string }): ActionOperationTarget {
    return { id: item.id, customerId: item.customerId, customerName: item.customerName, opportunityId: item.opportunityId, category: item.category, dueAt: item.dueAt };
  }

  async function clearFilter(key: keyof CommercialCenterFilters) {
    const next = { ...filters, [key]: undefined };
    setFilters(next);
    await refresh(next);
  }

  const auvoMessage = useMemo(() => center?.auvoInbox.message ?? "", [center]);

  const stageName = stages.find((stage) => stage.id === filters.stageId)?.nome;
  const filterChipCandidates: Array<{ key: keyof CommercialCenterFilters; label: string } | null> = [
    filters.from ? { key: "from", label: `De ${formatShortDate(filters.from)}` } : null,
    filters.to ? { key: "to", label: `Até ${formatShortDate(filters.to)}` } : null,
    filters.stageId ? { key: "stageId", label: `Etapa: ${stageName ?? filters.stageId}` } : null,
    filters.situation ? { key: "situation", label: `Situação: ${filters.situation}` } : null,
    filters.demandType ? { key: "demandType", label: `Demanda: ${filters.demandType}` } : null,
    filters.category ? { key: "category", label: `Categoria: ${CATEGORY_FILTER_LABELS[filters.category] ?? filters.category}` } : null,
    filters.priority ? { key: "priority", label: `Prioridade: ${PRIORITY_FILTER_LABELS[filters.priority] ?? filters.priority}` } : null,
  ];
  const activeFilterChips = filterChipCandidates.filter(
    (chip): chip is { key: keyof CommercialCenterFilters; label: string } => chip !== null,
  );

  return (
    <>
      <section id="central-comercial" className="page-heading">
        <div>
          <p className="eyebrow">Operação do dia</p>
          <h1>Central Comercial</h1>
        </div>
        <button className="button secondary" type="button" onClick={() => void refresh()} disabled={isLoading}>
          <RefreshCw aria-hidden="true" />
          Atualizar
        </button>
      </section>

      <section className="panel commercial-filters" aria-label="Filtros da Central Comercial">
        <div>
          <p className="eyebrow">Filtros</p>
          <h2>Período e escopo</h2>
        </div>
        <div className="filter-grid">
          <label>De<input type="date" value={filters.from ?? ""} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
          <label>Até<input type="date" value={filters.to ?? ""} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
          <label>Etapa
            <select value={filters.stageId ?? ""} onChange={(event) => setFilters({ ...filters, stageId: event.target.value || undefined })}>
              <option value="">Todas</option>
              {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.nome}</option>)}
            </select>
          </label>
          <label>Situação<input value={filters.situation ?? ""} onChange={(event) => setFilters({ ...filters, situation: event.target.value || undefined })} placeholder="ex: aguardando cliente" /></label>
          <label>Tipo de demanda<input value={filters.demandType ?? ""} onChange={(event) => setFilters({ ...filters, demandType: event.target.value || undefined })} placeholder="ex: instalação" /></label>
          <label>Categoria
            <select value={filters.category ?? ""} onChange={(event) => setFilters({ ...filters, category: (event.target.value || undefined) as CommercialCenterFilters["category"] })}>
              <option value="">Todas</option>
              <option value="commercial">Comercial</option>
              <option value="warranty">Garantia</option>
              <option value="support">Suporte</option>
              <option value="after_sales">Pós-venda</option>
            </select>
          </label>
          <label>Prioridade
            <select value={filters.priority ?? ""} onChange={(event) => setFilters({ ...filters, priority: (event.target.value || undefined) as CommercialCenterFilters["priority"] })}>
              <option value="">Todas</option>
              <option value="high">Alta</option>
              <option value="normal">Normal</option>
              <option value="low">Baixa</option>
            </select>
          </label>
        </div>
        {activeFilterChips.length ? (
          <ul className="active-filter-chips" aria-label="Filtros ativos">
            {activeFilterChips.map((chip) => (
              <li key={chip.key}>
                <button type="button" onClick={() => void clearFilter(chip.key)} aria-label={`Remover filtro ${chip.label}`}>
                  {chip.label}
                  <X aria-hidden="true" size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="filter-actions">
          <button className="button secondary" type="button" onClick={() => void refresh()} disabled={isLoading}>Aplicar filtros</button>
          <button className="button ghost" type="button" onClick={() => { setFilters({}); void refresh({}); }} disabled={isLoading || !hasFilters}>Limpar filtros</button>
        </div>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {actionOperation.operation ? (
        <ActionOperationForm
          operation={actionOperation.operation}
          error={actionOperation.error}
          onChange={actionOperation.update}
          onSubmit={() => void actionOperation.submit()}
          onCancel={actionOperation.close}
        />
      ) : null}

      {isLoading || !center ? (
        <LoadingPanels />
      ) : (
        <section className="commercial-center" aria-label="Central Comercial">
          <CommercialActionBlock
            title="Ações vencidas"
            emptyText="Nenhuma ação vencida."
            items={center.overdueActions}
            onAction={(item, mode) => void actionOperation.open(toActionTarget(item), mode)}
          />
          <CommercialActionBlock
            title="Ações de hoje"
            emptyText="Nenhuma ação prevista para hoje."
            items={center.todayActions}
            onAction={(item, mode) => void actionOperation.open(toActionTarget(item), mode)}
          />
          <CommercialActionBlock
            title="Visitas próximas"
            emptyText="Nenhuma visita próxima."
            items={center.upcomingVisits}
            onAction={(item, mode) => void actionOperation.open(toActionTarget(item), mode)}
          />
          <CommercialOpportunityBlock
            title="Orçamentos aguardando retorno"
            emptyText="Nenhum orçamento aguardando retorno."
            items={center.quotesAwaitingReturn}
            onOpen={openOpportunity}
          />
          <CommercialOpportunityBlock
            title="Oportunidades sem próxima ação"
            emptyText="Todas as oportunidades ativas possuem acompanhamento."
            items={center.opportunitiesWithoutNextAction}
            onOpen={openOpportunity}
          />
          <CommercialOpportunityBlock
            title="Oportunidades paradas"
            emptyText="Nenhuma oportunidade parada."
            items={center.stalledOpportunities}
            onOpen={openOpportunity}
          />
          <article className="panel commercial-card">
            <header>
              <h2>Notificações relevantes</h2>
              <span className="badge">{notifications.notifications.length}</span>
            </header>
            <NotificationList items={notifications.notifications} onRead={notifications.read} onArchive={notifications.archive} onSnooze={notifications.snooze} />
          </article>
          <article className="panel commercial-card">
            <h2>Caixa Auvo</h2>
            <p>{auvoMessage}</p>
          </article>
          <article className="panel commercial-card summary-card">
            <h2>Resumo comercial</h2>
            <dl>
              <div><dt>Novas oportunidades</dt><dd>{center.summary.newOpportunities}</dd></div>
              <div><dt>Aprovadas</dt><dd>{center.summary.approvedOpportunities}</dd></div>
              <div><dt>Perdidas</dt><dd>{center.summary.lostOpportunities}</dd></div>
              <div><dt>Valor aprovado</dt><dd>{formatMoney(center.summary.approvedValue)}</dd></div>
              <div><dt>Ticket médio</dt><dd>{formatMoney(center.summary.averageApprovedTicket)}</dd></div>
            </dl>
          </article>
        </section>
      )}

    </>
  );
}

function formatShortDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}
