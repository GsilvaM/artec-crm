import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { PipelineBoard } from "../../components/PipelineBoard";
import { loadCrmSnapshot, updateOpportunity, type CrmSnapshot } from "../../domain/crm";

export function PipelinePage() {
  const [snapshot, setSnapshot] = useState<CrmSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileStageId, setMobileStageId] = useState<string | null>(null);
  const navigate = useNavigate();

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadCrmSnapshot();
      setSnapshot(data);
      setMobileStageId((current) => current ?? data.stages.slice().sort((a, b) => a.ordem - b.ordem)[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar o funil.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleMoveStage(opportunityId: string, etapaId: string) {
    setError(null);
    try {
      await updateOpportunity(opportunityId, { etapaId });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel mover a oportunidade de etapa.");
    }
  }

  const stalledIds = useMemo(
    () => new Set((snapshot?.commercialCenter.stalledOpportunities ?? []).map((item) => item.id)),
    [snapshot],
  );
  const orderedStages = useMemo(() => [...(snapshot?.stages ?? [])].sort((a, b) => a.ordem - b.ordem), [snapshot]);

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Funil comercial</p>
          <h1>Oportunidades por etapa</h1>
        </div>
        <button className="button secondary" type="button" onClick={() => void refresh()} disabled={isLoading}>
          <RefreshCw aria-hidden="true" />
          Atualizar
        </button>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

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
          opportunities={snapshot.opportunities}
          stalledOpportunityIds={stalledIds}
          mobileActiveStageId={mobileStageId}
          onMoveStage={handleMoveStage}
          onOpenOpportunity={(id) => navigate(`/oportunidades/${id}`)}
        />
      ) : (
        <EmptyState title="Nenhuma etapa configurada" text="Configure as etapas do funil para visualizar o quadro." />
      )}
    </>
  );
}
