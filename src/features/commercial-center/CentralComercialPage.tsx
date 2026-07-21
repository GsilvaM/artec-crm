import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
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

export function CentralComercialPage({ currentUserId }: { currentUserId: string }) {
  const [filters, setFilters] = useState<CommercialCenterFilters>({});
  const [center, setCenter] = useState<CommercialCenter | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const notifications = useNotifications({ status: "active", limit: "5" });

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const [centerData, stageData] = await Promise.all([loadCommercialCenter(filters), loadPipelineStages()]);
      setCenter(centerData);
      setStages(stageData);
      await notifications.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar a Central Comercial.");
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

  const auvoMessage = useMemo(() => center?.auvoInbox.message ?? "", [center]);

  return (
    <>
      <section id="central-comercial" className="page-heading">
        <div>
          <p className="eyebrow">Operacao do dia</p>
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
          <h2>Periodo e escopo</h2>
        </div>
        <div className="filter-grid">
          <label>De<input type="date" value={filters.from ?? ""} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
          <label>Ate<input type="date" value={filters.to ?? ""} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
          <label>Etapa
            <select value={filters.stageId ?? ""} onChange={(event) => setFilters({ ...filters, stageId: event.target.value || undefined })}>
              <option value="">Todas</option>
              {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.nome}</option>)}
            </select>
          </label>
          <label>Situacao<input value={filters.situation ?? ""} onChange={(event) => setFilters({ ...filters, situation: event.target.value || undefined })} placeholder="ex: aguardando cliente" /></label>
          <label>Tipo de demanda<input value={filters.demandType ?? ""} onChange={(event) => setFilters({ ...filters, demandType: event.target.value || undefined })} placeholder="ex: instalacao" /></label>
          <label>Categoria
            <select value={filters.category ?? ""} onChange={(event) => setFilters({ ...filters, category: (event.target.value || undefined) as CommercialCenterFilters["category"] })}>
              <option value="">Todas</option>
              <option value="commercial">Comercial</option>
              <option value="warranty">Garantia</option>
              <option value="support">Suporte</option>
              <option value="after_sales">Pos-venda</option>
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
        <div className="filter-actions">
          <button className="button secondary" type="button" onClick={() => void refresh()} disabled={isLoading}>Aplicar filtros</button>
          <button className="button ghost" type="button" onClick={() => { setFilters({}); void refresh(); }} disabled={isLoading || !hasFilters}>Limpar filtros</button>
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
            title="Acoes vencidas"
            emptyText="Nenhuma acao vencida."
            items={center.overdueActions}
            onAction={(item, mode) => void actionOperation.open(toActionTarget(item), mode)}
          />
          <CommercialActionBlock
            title="Acoes de hoje"
            emptyText="Nenhuma acao prevista para hoje."
            items={center.todayActions}
            onAction={(item, mode) => void actionOperation.open(toActionTarget(item), mode)}
          />
          <CommercialActionBlock
            title="Visitas proximas"
            emptyText="Nenhuma visita proxima."
            items={center.upcomingVisits}
            onAction={(item, mode) => void actionOperation.open(toActionTarget(item), mode)}
          />
          <CommercialOpportunityBlock
            title="Orcamentos aguardando retorno"
            emptyText="Nenhum orcamento aguardando retorno."
            items={center.quotesAwaitingReturn}
            onOpen={openOpportunity}
          />
          <CommercialOpportunityBlock
            title="Oportunidades sem proxima acao"
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
              <h2>Notificacoes relevantes</h2>
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
              <div><dt>Ticket medio</dt><dd>{formatMoney(center.summary.averageApprovedTicket)}</dd></div>
            </dl>
          </article>
        </section>
      )}

    </>
  );
}
