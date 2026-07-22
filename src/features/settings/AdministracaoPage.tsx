import { useEffect, useState } from "react";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { AdminPanel } from "../../components/AdminPanel";
import { loadPipelineStages, type PipelineStage } from "../../domain/crm";

export function AdministracaoPage({ currentUserId }: { currentUserId: string }) {
  const [stages, setStages] = useState<PipelineStage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setStages(await loadPipelineStages());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as etapas do funil.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Gestão</p>
          <h1>Administração</h1>
        </div>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {stages === null ? <LoadingPanels /> : <AdminPanel stages={stages} onStagesChanged={refresh} currentUserId={currentUserId} />}
    </>
  );
}
