import { useEffect, useState } from "react";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { ReportsPanel } from "../../components/ReportsPanel";
import { loadPipelineStages, type PipelineStage } from "../../domain/crm";

export function RelatoriosPage() {
  const [stages, setStages] = useState<PipelineStage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setStages(await loadPipelineStages());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar as etapas do funil.");
      }
    })();
  }, []);

  return (
    <>
      <section className="page-heading design-page-heading">
        <div>
          <h1>Relatórios</h1>
          <p>Indicadores comerciais — sem receita, faturamento ou DRE.</p>
        </div>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {stages === null ? <LoadingPanels /> : <ReportsPanel stages={stages} />}
    </>
  );
}
