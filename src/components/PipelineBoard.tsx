import { useState, type DragEvent } from "react";
import { Clock, MoreHorizontal, UserCheck } from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { formatDateTime, formatMoney } from "../domain/format";
import type { Opportunity, PipelineStage } from "../domain/crm";

const DRAG_DATA_TYPE = "application/x-artec-opportunity-id";

export function PipelineBoard({ stages, opportunities, stalledOpportunityIds, mobileActiveStageId, currentUserId, onMoveStage, onAssignToMe, onOpenOpportunity }: {
  stages: PipelineStage[];
  opportunities: Opportunity[];
  stalledOpportunityIds: Set<string>;
  mobileActiveStageId: string | null;
  currentUserId: string;
  onMoveStage: (opportunityId: string, stageId: string) => void | Promise<void>;
  onAssignToMe: (opportunityId: string) => void | Promise<void>;
  onOpenOpportunity: (id: string) => void;
}) {
  const orderedStages = [...stages].sort((a, b) => a.ordem - b.ordem);
  const movableStages = orderedStages.filter((stage) => !stage.isTerminal);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [draggingOpportunityId, setDraggingOpportunityId] = useState<string | null>(null);

  return (
    <div className="pipeline-board" role="list" aria-label="Funil comercial por etapa">
      {orderedStages.map((stage) => {
        const stageOpportunities = opportunities.filter((opportunity) => opportunity.etapaId === stage.id);
        const isMobileHidden = mobileActiveStageId !== null && stage.id !== mobileActiveStageId;
        const acceptsDrop = !stage.isTerminal;
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
            <div
              className={`pipeline-column-body${dragOverStageId === stage.id ? " pipeline-column-body-drop-target" : ""}`}
              onDragOver={(event) => {
                if (!acceptsDrop) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dragOverStageId !== stage.id) setDragOverStageId(stage.id);
              }}
              onDragLeave={() => setDragOverStageId((current) => (current === stage.id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                setDragOverStageId(null);
                if (!acceptsDrop) return;
                const opportunityId = event.dataTransfer.getData(DRAG_DATA_TYPE);
                if (opportunityId) void onMoveStage(opportunityId, stage.id);
              }}
            >
              {stageOpportunities.length ? (
                stageOpportunities.map((opportunity) => (
                  <PipelineCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    stage={stage}
                    movableStages={movableStages}
                    isStalled={stalledOpportunityIds.has(opportunity.id)}
                    isDragging={draggingOpportunityId === opportunity.id}
                    currentUserId={currentUserId}
                    onDragStart={() => setDraggingOpportunityId(opportunity.id)}
                    onDragEnd={() => setDraggingOpportunityId(null)}
                    onMoveStage={onMoveStage}
                    onAssignToMe={onAssignToMe}
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

function PipelineCard({ opportunity, stage, movableStages, isStalled, isDragging, currentUserId, onDragStart, onDragEnd, onMoveStage, onAssignToMe, onOpenOpportunity }: {
  opportunity: Opportunity;
  stage: PipelineStage;
  movableStages: PipelineStage[];
  isStalled: boolean;
  isDragging: boolean;
  currentUserId: string;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMoveStage: (opportunityId: string, stageId: string) => void | Promise<void>;
  onAssignToMe: (opportunityId: string) => void | Promise<void>;
  onOpenOpportunity: (id: string) => void;
}) {
  const isActive = opportunity.status === "ativa";
  const value = opportunity.valorAprovado ?? opportunity.valorEstimado;
  const overdue = isOpportunityOverdue(opportunity);

  return (
    <article
      className={`pipeline-card pipeline-stage-tone-${stageTone(stage.nome)}${isActive ? " pipeline-card-draggable" : ""}${isDragging ? " pipeline-card-dragging" : ""}`}
      draggable={isActive}
      onClick={() => onOpenOpportunity(opportunity.id)}
      onDragStart={(event: DragEvent<HTMLElement>) => {
        if (!isActive) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData(DRAG_DATA_TYPE, opportunity.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <header>
        <button className="pipeline-card-open" type="button" onClick={(event) => { event.stopPropagation(); onOpenOpportunity(opportunity.id); }}>
          {opportunity.clienteNome}
        </button>
        <MoreHorizontal size={16} aria-hidden="true" />
      </header>
      <p className="pipeline-card-title">{opportunity.titulo}</p>
      <span className="pipeline-card-location">{opportunity.situacao}</span>
      {value !== null ? <strong className="pipeline-card-value">{formatMoney(value)}</strong> : null}
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
        <span className="pipeline-card-owner">
          <Avatar name={opportunity.clienteNome} size="sm" />
          {opportunity.responsavelId === currentUserId ? "Você" : `Usuário ${opportunity.responsavelId.slice(0, 4)}`}
        </span>
        {opportunity.responsavelId !== currentUserId ? (
          <button className="button secondary pipeline-card-assign" type="button" onClick={(event) => { event.stopPropagation(); void onAssignToMe(opportunity.id); }}>
            <UserCheck size={14} aria-hidden="true" /> Atribuir a mim
          </button>
        ) : null}
        {isActive ? (
          <label className="pipeline-card-move">
            <span className="sr-only">Mover {opportunity.titulo} para outra etapa</span>
            <select value={stage.id} onClick={(event) => event.stopPropagation()} onChange={(event) => void onMoveStage(opportunity.id, event.target.value)}>
              {movableStages.map((option) => <option key={option.id} value={option.id}>{option.nome}</option>)}
            </select>
          </label>
        ) : null}
      </div>
    </article>
  );
}

function stageTone(stageName: string): string {
  const normalized = stageName.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (normalized.includes("novo")) return "new";
  if (normalized.includes("atendimento")) return "contact";
  if (normalized.includes("visita")) return "visit";
  if (normalized.includes("orcamento")) return "quote";
  if (normalized.includes("negoci")) return "negotiation";
  if (normalized.includes("aprov") || normalized.includes("ganho")) return "won";
  if (normalized.includes("perd")) return "lost";
  return "default";
}

function isOpportunityOverdue(opportunity: Opportunity): boolean {
  if (opportunity.status !== "ativa" || !opportunity.proximaAcaoEm) return false;
  return new Date(opportunity.proximaAcaoEm).getTime() < Date.now();
}
