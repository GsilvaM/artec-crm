import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock, Filter, Plus, Search } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/input";
import { useToast } from "../../components/ui/Toast";
import { QuickOpportunityModal } from "../../components/QuickOpportunityModal";
import { formatDateTime, formatMoney } from "../../domain/format";
import {
  loadOpportunitiesPage,
  loadPipelineStages,
  updateOpportunity,
  type Opportunity,
  type PipelineStage,
} from "../../domain/crm";

type OpportunityTab = "all" | "mine" | "late" | "withoutNextAction";

export function OportunidadesPage({ currentUserId }: { currentUserId: string }) {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<OpportunityTab>("all");
  const [etapaFilter, setEtapaFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const preselectedCustomerId = searchParams.get("clienteId") ?? "";

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const [page, stageList] = await Promise.all([loadOpportunitiesPage(search), loadPipelineStages()]);
      setOpportunities(page.opportunities);
      setNextCursor(page.nextCursor);
      setStages(stageList);
      if (preselectedCustomerId) setShowCreateModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as oportunidades.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLoadMore() {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const page = await loadOpportunitiesPage(search, nextCursor);
      setOpportunities((current) => [...current, ...page.opportunities]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar mais oportunidades.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleMoveStage(opportunityId: string, etapaId: string) {
    const previous = opportunities.find((opportunity) => opportunity.id === opportunityId);
    if (!previous || previous.etapaId === etapaId) return;
    const stageName = stages.find((stage) => stage.id === etapaId)?.nome;
    setOpportunities((current) => current.map((opportunity) => (opportunity.id === opportunityId ? { ...opportunity, etapaId, etapaNome: stageName ?? opportunity.etapaNome } : opportunity)));
    try {
      await updateOpportunity(opportunityId, { etapaId });
      showToast(stageName ? `Oportunidade movida para ${stageName}.` : "Etapa atualizada.");
    } catch (err) {
      setOpportunities((current) => current.map((opportunity) => (opportunity.id === opportunityId ? previous : opportunity)));
      showToast(err instanceof Error ? err.message : "Não foi possível mover a oportunidade.", "error");
    }
  }

  const visibleOpportunities = opportunities.filter((opportunity) => !opportunity.archivedAt);
  const lateCount = visibleOpportunities.filter(isOpportunityOverdue).length;
  const filteredOpportunities = useMemo(
    () => visibleOpportunities.filter((opportunity) => {
      if (etapaFilter && opportunity.etapaId !== etapaFilter) return false;
      if (activeTab === "mine" && opportunity.responsavelId !== currentUserId) return false;
      if (activeTab === "late" && !isOpportunityOverdue(opportunity)) return false;
      if (activeTab === "withoutNextAction" && (opportunity.proximaAcao && opportunity.proximaAcaoEm)) return false;
      return true;
    }),
    [activeTab, currentUserId, etapaFilter, visibleOpportunities],
  );
  const orderedStages = useMemo(() => [...stages].sort((a, b) => a.ordem - b.ordem), [stages]);

  const columns: DataTableColumn<Opportunity>[] = [
    {
      key: "oportunidade",
      header: "Oportunidade",
      render: (opportunity) => (
        <span className="design-table-stack">
          <Link className="design-table-title" to={`/oportunidades/${opportunity.id}`}>{opportunity.titulo}</Link>
          <small>{opportunity.clienteNome}</small>
        </span>
      ),
    },
    {
      key: "etapa",
      header: "Etapa",
      render: (opportunity) => <Badge tone={stageBadgeTone(opportunity.etapaNome)}>{opportunity.etapaNome}</Badge>,
    },
    {
      key: "valor",
      header: "Valor",
      render: (opportunity) => <strong className="design-table-money">{formatOpportunityValue(opportunity)}</strong>,
    },
    {
      key: "proxima-acao",
      header: "Próxima ação",
      render: (opportunity) =>
        opportunity.proximaAcao && opportunity.proximaAcaoEm ? (
          <span className={isOpportunityOverdue(opportunity) ? "design-table-danger" : "design-table-muted"}>
            <Clock size={13} aria-hidden="true" /> {opportunity.proximaAcao} · {formatDateTime(opportunity.proximaAcaoEm)}
          </span>
        ) : (
          <span className="design-table-danger">Sem próxima ação</span>
        ),
    },
    {
      key: "dias",
      header: "Dias parada",
      render: (opportunity) => <span className="design-table-muted">{daysStopped(opportunity)}d</span>,
    },
    {
      key: "responsavel",
      header: "Responsável",
      render: (opportunity) => (
        <span className="design-table-owner">
          <Avatar name={opportunity.clienteNome} size="sm" /> {opportunity.responsavelId === currentUserId ? "Ana Ribeiro" : `Usuário ${opportunity.responsavelId.slice(0, 4)}`}
        </span>
      ),
    },
    {
      key: "acoes",
      header: "",
      className: "actions-cell",
      render: (opportunity) => (
        <select aria-label={`Mover ${opportunity.titulo} para outra etapa`} value={opportunity.etapaId} onChange={(event) => void handleMoveStage(opportunity.id, event.target.value)}>
          {orderedStages.filter((stage) => !stage.isTerminal || stage.id === opportunity.etapaId).map((stage) => <option key={stage.id} value={stage.id}>{stage.nome}</option>)}
        </select>
      ),
    },
  ];

  return (
    <>
      <section id="oportunidades" className="page-heading design-page-heading">
        <div>
          <h1>Oportunidades</h1>
          <p>{visibleOpportunities.length} no total · {lateCount} com atraso</p>
        </div>
        <Button variant="primary" type="button" onClick={() => setShowCreateModal(true)}>
          <Plus aria-hidden="true" /> Nova oportunidade
        </Button>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {showCreateModal ? (
        <QuickOpportunityModal
          currentUserId={currentUserId}
          preselectedCustomerId={preselectedCustomerId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => refresh()}
        />
      ) : null}

      <section id="oportunidades-section" className="data-section design-list-page">
        <div className="design-list-toolbar">
          <div className="design-tabs" role="group" aria-label="Filtrar oportunidades">
            <button type="button" className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>Todas</button>
            <button type="button" className={activeTab === "mine" ? "active" : ""} onClick={() => setActiveTab("mine")}>Minhas</button>
            <button type="button" className={activeTab === "late" ? "active" : ""} onClick={() => setActiveTab("late")}>Com atraso</button>
            <button type="button" className={activeTab === "withoutNextAction" ? "active" : ""} onClick={() => setActiveTab("withoutNextAction")}>Sem próxima ação</button>
          </div>
          <label className="design-search-field">
            <Search size={17} aria-hidden="true" />
            <Input type="search" placeholder="Buscar" aria-label="Filtrar oportunidades" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void refresh(); }} />
          </label>
          <select className="design-filter-select" value={etapaFilter} onChange={(event) => setEtapaFilter(event.target.value)} aria-label="Filtrar por etapa">
            <option value="">Todas as etapas</option>
            {orderedStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.nome}</option>)}
          </select>
          <Button variant="secondary" type="button"><Filter size={16} aria-hidden="true" /> Mais filtros</Button>
        </div>

        <DataTable
          columns={columns}
          rows={filteredOpportunities}
          rowKey={(opportunity) => opportunity.id}
          isLoading={isLoading}
          emptyTitle="Nenhuma oportunidade cadastrada"
          emptyText="Crie uma oportunidade com responsável, próxima ação e data."
          hasMore={nextCursor !== null}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => void handleLoadMore()}
          loadMoreLabel="Carregar mais oportunidades"
        />
      </section>
    </>
  );
}

function isOpportunityOverdue(opportunity: Opportunity): boolean {
  if (opportunity.status !== "ativa" || !opportunity.proximaAcaoEm) return false;
  return new Date(opportunity.proximaAcaoEm).getTime() < Date.now();
}

function daysStopped(opportunity: Opportunity): number {
  const date = new Date(opportunity.proximaAcaoEm ?? opportunity.dataEntrada);
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 86_400_000));
}

function formatOpportunityValue(opportunity: Opportunity): string {
  if (opportunity.valorAprovado) return formatMoney(opportunity.valorAprovado);
  if (opportunity.valorOrcamento) return formatMoney(opportunity.valorOrcamento);
  if (opportunity.valorEstimado) return formatMoney(opportunity.valorEstimado);
  return "—";
}

function stageBadgeTone(stageName: string): "positive" | "warning" | "informative" | "purple" | "neutral" {
  const normalized = stageName.toLowerCase();
  if (normalized.includes("aprov")) return "positive";
  if (normalized.includes("orçamento") || normalized.includes("orcamento") || normalized.includes("negocia")) return "warning";
  if (normalized.includes("visita")) return "purple";
  if (normalized.includes("atendimento")) return "informative";
  return "informative";
}
