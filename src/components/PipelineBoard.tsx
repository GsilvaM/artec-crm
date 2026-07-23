import { Clock } from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { formatDateTime, formatMoney, formatOpportunityStatus, opportunityStatusBadgeClass } from "../domain/format";
import type { Opportunity, PipelineStage } from "../domain/crm";

export function PipelineBoard({ stages, opportunities, stalledOpportunityIds, mobileActiveStageId, onMoveStage, onOpenOpportunity }: {
  stages: PipelineStage[];
  opportunities: Opportunity[];
  stalledOpportunityIds: Set<string>;
  mobileActiveStageId: string | null;
  onMoveStage: (opportunityId: string, stageId: string) => void | Promise<void>;
  onOpenOpportunity: (id: string) => void;
}) {
  const orderedStages = [...stages].sort((a, b) => a.ordem - b.ordem);
  const movableStages = orderedStages.filter((stage) => !stage.isTerminal);

  return (
    <div className="pipeline-board" role="list" aria-label="Funil comercial por etapa">
      {orderedStages.map((stage) => {
        const stageOpportunities = opportunities.filter((opportunity) => opportunity.etapaId === stage.id);
        const isMobileHidden = mobileActiveStageId !== null && stage.id !== mobileActiveStageId;
        return (
          <section
            className="pipeline-column"
            role="listitem"
            key={stage.id}
            aria-label={`Etapa ${stage.nome}`}
            data-mobile-hidden={isMobileHidden ? "true" : "false"}
          >
            <header className="pipeline-column-header">
              <h3>{stage.nome}</h3>
              <span className="badge">{stageOpportunities.length}</span>
            </header>
            <div className="pipeline-column-body">
              {stageOpportunities.length ? (
                stageOpportunities.map((opportunity) => (
                  <PipelineCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    stage={stage}
                    movableStages={movableStages}
                    isStalled={stalledOpportunityIds.has(opportunity.id)}
                    onMoveStage={onMoveStage}
                    onOpenOpportunity={onOpenOpportunity}
                  />
                ))
              ) : (
                <p className="pipeline-column-empty">Nenhuma oportunidade nesta etapa.</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PipelineCard({ opportunity, stage, movableStages, isStalled, onMoveStage, onOpenOpportunity }: {
  opportunity: Opportunity;
  stage: PipelineStage;
  movableStages: PipelineStage[];
  isStalled: boolean;
  onMoveStage: (opportunityId: string, stageId: string) => void | Promise<void>;
  onOpenOpportunity: (id: string) => void;
}) {
  const isActive = opportunity.status === "ativa";
  const value = opportunity.valorAprovado ?? opportunity.valorEstimado;
  const overdue = isOpportunityOverdue(opportunity);

  return (
    <article className="pipeline-card">
      <header>
        <Avatar name={opportunity.clienteNome} size="sm" />
        <button className="pipeline-card-open" type="button" onClick={() => onOpenOpportunity(opportunity.id)}>
          {opportunity.clienteNome}
        </button>
        <span className={`badge ${opportunityStatusBadgeClass(opportunity.status)}`}>{formatOpportunityStatus(opportunity.status)}</span>
      </header>
      <p className="pipeline-card-title">{opportunity.titulo}</p>
      <dl className="pipeline-card-facts">
        <div><dt>Tipo</dt><dd>{opportunity.tipoDemanda}</dd></div>
        {opportunity.origem ? <div><dt>Origem</dt><dd>{opportunity.origem}</dd></div> : null}
        {value !== null ? <div><dt>Valor</dt><dd>{formatMoney(value)}</dd></div> : null}
        <div><dt>Situação</dt><dd>{opportunity.situacao}</dd></div>
      </dl>
      {isActive && isStalled ? <span className="badge badge-alert-warning">parada</span> : null}
      <p className={`pipeline-card-next-action${overdue ? " danger-text" : ""}`}>
        {opportunity.proximaAcao ? (
          <>
            <Clock aria-hidden="true" size={14} />
            {opportunity.proximaAcao} - {formatDateTime(opportunity.proximaAcaoEm)}
            {overdue ? <span className="badge badge-alert-danger">atrasada</span> : null}
          </>
        ) : (
          <span className="badge badge-alert-danger">sem próxima ação</span>
        )}
      </p>
      <div className="pipeline-card-actions">
        <button className="button secondary" type="button" onClick={() => onOpenOpportunity(opportunity.id)}>Abrir oportunidade</button>
        {isActive ? (
          <label className="pipeline-card-move">
            <span className="sr-only">Mover {opportunity.titulo} para outra etapa</span>
            <select value={stage.id} onChange={(event) => void onMoveStage(opportunity.id, event.target.value)}>
              {movableStages.map((option) => <option key={option.id} value={option.id}>{option.nome}</option>)}
            </select>
          </label>
        ) : null}
      </div>
    </article>
  );
}

function isOpportunityOverdue(opportunity: Opportunity): boolean {
  if (opportunity.status !== "ativa" || !opportunity.proximaAcaoEm) return false;
  return new Date(opportunity.proximaAcaoEm).getTime() < Date.now();
}
