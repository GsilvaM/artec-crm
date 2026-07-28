import { useEffect, useMemo, useState } from "react";
import { Filter, LayoutGrid, List, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { PipelineBoard } from "../../components/PipelineBoard";
import { QuickOpportunityModal } from "../../components/QuickOpportunityModal";
import { formatMoney } from "../../domain/format";
import { loadCrmSnapshot, updateOpportunity, type CrmSnapshot } from "../../domain/crm";

export function PipelinePage({ currentUserId }: { currentUserId: string }) {
  const [snapshot, setSnapshot] = useState<CrmSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileStageId, setMobileStageId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isQuickOpportunityOpen, setIsQuickOpportunityOpen] = useState(false);
  const [showOnlyStalled, setShowOnlyStalled] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadCrmSnapshot();
      setSnapshot(data);
      setMobileStageId((current) => current ?? data.stages.slice().sort((a, b) => a.ordem - b.ordem)[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o funil.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleMoveStage(opportunityId: string, etapaId: string) {
    const current = snapshot;
    const previousOpportunity = current?.opportunities.find((opportunity) => opportunity.id === opportunityId);
    if (!current || !previousOpportunity || previousOpportunity.etapaId === etapaId) return;
    const previousEtapaId = previousOpportunity.etapaId;
    const stageName = current.stages.find((stage) => stage.id === etapaId)?.nome;

    setError(null);
    setSnapshot({
      ...current,
      opportunities: current.opportunities.map((opportunity) =>
        opportunity.id === opportunityId ? { ...opportunity, etapaId } : opportunity,
      ),
    });

    try {
      await updateOpportunity(opportunityId, { etapaId });
      showToast(stageName ? `Oportunidade movida para ${stageName}.` : "Etapa atualizada.");
    } catch (err) {
      setSnapshot((rollbackBase) =>
        rollbackBase
          ? {
              ...rollbackBase,
              opportunities: rollbackBase.opportunities.map((opportunity) =>
                opportunity.id === opportunityId ? { ...opportunity, etapaId: previousEtapaId } : opportunity,
              ),
            }
          : rollbackBase,
      );
      setError(err instanceof Error ? err.message : "Não foi possível mover a oportunidade de etapa. A alteração foi desfeita.");
    }
  }

  const stalledIds = useMemo(
    () => new Set((snapshot?.commercialCenter.stalledOpportunities ?? []).map((item) => item.id)),
    [snapshot],
  );
  const orderedStages = useMemo(() => [...(snapshot?.stages ?? [])].sort((a, b) => a.ordem - b.ordem), [snapshot]);
  const activeOpportunities = (snapshot?.opportunities ?? []).filter((opportunity) => opportunity.status === "ativa" && !opportunity.archivedAt);
  const boardOpportunities = (snapshot?.opportunities ?? []).filter((opportunity) => !showOnlyStalled || stalledIds.has(opportunity.id));
  const pipelineValue = activeOpportunities.reduce((total, opportunity) => total + (opportunity.valorAprovado ?? opportunity.valorOrcamento ?? opportunity.valorEstimado ?? 0), 0);

  return (
    <>
      <section className="page-heading design-page-heading">
        <div>
          <h1>Funil Comercial</h1>
          <p>{activeOpportunities.length} oportunidades ativas · {formatMoney(pipelineValue)} em pipeline</p>
        </div>
        <div className="pipeline-heading-actions">
          <div className="design-segmented" aria-label="Modo de visualização do funil">
            <button type="button" className="active"><LayoutGrid size={16} aria-hidden="true" /> Kanban</button>
            <button type="button" onClick={() => navigate("/oportunidades")}><List size={16} aria-hidden="true" /> Lista</button>
          </div>
          <Button variant="secondary" type="button" onClick={() => setShowFilters((open) => !open)}><Filter size={16} aria-hidden="true" /> Filtros</Button>
          <Button variant="primary" type="button" onClick={() => setIsQuickOpportunityOpen(true)}><Plus size={16} aria-hidden="true" /> Nova oportunidade</Button>
        </div>
      </section>

      <section className="data-section pipeline-page" aria-label="Board operacional do funil">
        {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

        {showFilters ? (
          <div className="pipeline-filter-row">
            <label>
              <input type="checkbox" checked={showOnlyStalled} onChange={(event) => setShowOnlyStalled(event.target.checked)} />
              Somente oportunidades paradas
            </label>
          </div>
        ) : null}

        {orderedStages.length ? (
          <div className="pipeline-mobile-tabs segmented-control" aria-label="Selecionar etapa no mobile">
            {orderedStages.map((stage) => (
              <button
                key={stage.id}
                type="button"
                className={mobileStageId === stage.id ? "active" : ""}
                onClick={() => setMobileStageId(stage.id)}
              >
                {stage.nome}
              </button>
            ))}
          </div>
        ) : null}

        {isLoading || !snapshot ? (
          <LoadingPanels />
        ) : orderedStages.length ? (
          <PipelineBoard
            stages={orderedStages}
            opportunities={boardOpportunities}
            stalledOpportunityIds={stalledIds}
            mobileActiveStageId={mobileStageId}
            onMoveStage={handleMoveStage}
            currentUserId={currentUserId}
            onAssignToMe={(id) => updateOpportunity(id, { responsavelId: currentUserId }).then(refresh)}
            onOpenOpportunity={(id) => navigate(`/oportunidades/${id}`)}
          />
        ) : (
          <EmptyState title="Nenhuma etapa configurada" text="Configure as etapas do funil para visualizar o quadro." />
        )}
      </section>

      {isQuickOpportunityOpen ? (
        <QuickOpportunityModal
          currentUserId={currentUserId}
          onClose={() => setIsQuickOpportunityOpen(false)}
          onCreated={() => refresh()}
        />
      ) : null}
    </>
  );
}
