import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatDateTime, formatMoney } from "../domain/format";
import type { Opportunity, PipelineStage } from "../domain/crm";

export function PipelineBoard({ stages, opportunities, onMoveStage, onApprove, onLose, onOpenTimeline }: {
  stages: PipelineStage[];
  opportunities: Opportunity[];
  onMoveStage: (opportunityId: string, stageId: string) => void | Promise<void>;
  onApprove: (opportunity: Opportunity) => void | Promise<void>;
  onLose: (opportunity: Opportunity) => void | Promise<void>;
  onOpenTimeline: (id: string) => void | Promise<void>;
}) {
  const orderedStages = [...stages].sort((a, b) => a.ordem - b.ordem);
  const movableStages = orderedStages.filter((stage) => !stage.isTerminal);

  return (
    <div className="pipeline-board" role="list" aria-label="Funil comercial por etapa">
      {orderedStages.map((stage) => {
        const stageOpportunities = opportunities.filter((opportunity) => opportunity.etapaId === stage.id);
        return (
          <section className="pipeline-column" role="listitem" key={stage.id} aria-label={`Etapa ${stage.nome}`}>
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
                    onMoveStage={onMoveStage}
                    onApprove={onApprove}
                    onLose={onLose}
                    onOpenTimeline={onOpenTimeline}
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

function PipelineCard({ opportunity, stage, movableStages, onMoveStage, onApprove, onLose, onOpenTimeline }: {
  opportunity: Opportunity;
  stage: PipelineStage;
  movableStages: PipelineStage[];
  onMoveStage: (opportunityId: string, stageId: string) => void | Promise<void>;
  onApprove: (opportunity: Opportunity) => void | Promise<void>;
  onLose: (opportunity: Opportunity) => void | Promise<void>;
  onOpenTimeline: (id: string) => void | Promise<void>;
}) {
  const isActive = opportunity.status === "ativa";
  const value = opportunity.valorAprovado ?? opportunity.valorEstimado;
  const overdue = isOpportunityOverdue(opportunity);

  return (
    <article className="pipeline-card">
      <header>
        <strong>{opportunity.clienteNome}</strong>
        <span className="badge">{opportunity.status}</span>
      </header>
      <p className="pipeline-card-title">{opportunity.titulo}</p>
      <dl className="pipeline-card-facts">
        <div><dt>Tipo</dt><dd>{opportunity.tipoDemanda}</dd></div>
        {opportunity.origem ? <div><dt>Origem</dt><dd>{opportunity.origem}</dd></div> : null}
        {value !== null ? <div><dt>Valor</dt><dd>{formatMoney(value)}</dd></div> : null}
        <div><dt>Situacao</dt><dd>{opportunity.situacao}</dd></div>
      </dl>
      <p className={`pipeline-card-next-action${overdue ? " danger-text" : ""}`}>
        {opportunity.proximaAcao ? (
          <>
            <Clock aria-hidden="true" size={14} />
            {opportunity.proximaAcao} - {formatDateTime(opportunity.proximaAcaoEm)}
            {overdue ? <span className="badge danger-badge">atrasada</span> : null}
          </>
        ) : (
          <span className="badge danger-badge">sem proxima acao</span>
        )}
      </p>
      <div className="pipeline-card-actions">
        <button className="button ghost" type="button" onClick={() => void onOpenTimeline(opportunity.id)}>Historico</button>
        {isActive ? (
          <>
            <label className="pipeline-card-move">
              <span className="sr-only">Mover {opportunity.titulo} para outra etapa</span>
              <select value={stage.id} onChange={(event) => void onMoveStage(opportunity.id, event.target.value)}>
                {movableStages.map((option) => <option key={option.id} value={option.id}>{option.nome}</option>)}
              </select>
            </label>
            <button className="icon-button" type="button" aria-label={`Aprovar ${opportunity.titulo}`} onClick={() => void onApprove(opportunity)}>
              <CheckCircle2 aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" aria-label={`Marcar ${opportunity.titulo} como perdida`} onClick={() => void onLose(opportunity)}>
              <XCircle aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

function isOpportunityOverdue(opportunity: Opportunity): boolean {
  if (opportunity.status !== "ativa" || !opportunity.proximaAcaoEm) return false;
  return new Date(opportunity.proximaAcaoEm).getTime() < Date.now();
}
