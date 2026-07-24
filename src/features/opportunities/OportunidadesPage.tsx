import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CircleDollarSign, Plus, Search, UserRound } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { formatDateTime, formatMoney, formatOpportunityStatus, opportunityStatusBadgeClass } from "../../domain/format";
import { createOpportunity, loadCustomersPage, loadOpportunitiesPage, SITUACAO_SUGGESTIONS, TIPO_DEMANDA_OPTIONS, type Customer, type Opportunity } from "../../domain/crm";

const EMPTY_FORM = { clienteId: "", titulo: "", tipoDemanda: "instalacao", situacao: "em andamento", proximaAcao: "", proximaAcaoEm: "" };

export function OportunidadesPage({ currentUserId }: { currentUserId: string }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showCreateForm, setShowCreateForm] = useState(false);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const [page, customersPage] = await Promise.all([loadOpportunitiesPage(search), loadCustomersPage()]);
      setOpportunities(page.opportunities);
      setNextCursor(page.nextCursor);
      setCustomers(customersPage.customers);
      setForm((current) => ({ ...current, clienteId: current.clienteId || customersPage.customers[0]?.id || "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar as oportunidades.");
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
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar mais oportunidades.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createOpportunity({ ...form, responsavelId: currentUserId });
      setForm((current) => ({ ...EMPTY_FORM, clienteId: current.clienteId || customers[0]?.id || "" }));
      setShowCreateForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar a oportunidade.");
    }
  }

  const visibleOpportunities = opportunities.filter((opportunity) => !opportunity.archivedAt);
  const activeCount = visibleOpportunities.filter((opportunity) => opportunity.status === "ativa").length;
  const wonValue = visibleOpportunities.reduce((total, opportunity) => total + (opportunity.valorAprovado ?? 0), 0);
  const withoutNextActionCount = visibleOpportunities.filter((opportunity) => !opportunity.proximaAcao || !opportunity.proximaAcaoEm).length;
  const opportunityLanes = useMemo(() => groupOpportunitiesByStage(visibleOpportunities), [visibleOpportunities]);

  return (
    <>
      <section id="oportunidades" className="page-heading opportunities-heading">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h1>Oportunidades</h1>
        </div>
        <button className="button primary" type="button" onClick={() => setShowCreateForm((open) => !open)}>
          <Plus aria-hidden="true" />{showCreateForm ? "Fechar criacao" : "Nova oportunidade"}
        </button>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {showCreateForm ? (
        <form className="panel compact-form opportunity-create-form" onSubmit={handleCreate}>
          <h2>Nova oportunidade</h2>
          <label>Cliente
            <select required value={form.clienteId} onChange={(event) => setForm({ ...form, clienteId: event.target.value })}>
              <option value="">Selecione</option>
              {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.nome}</option>)}
            </select>
          </label>
          <label>Titulo<input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /></label>
          <label>Tipo de demanda
            <select required value={form.tipoDemanda} onChange={(event) => setForm({ ...form, tipoDemanda: event.target.value })}>
              {TIPO_DEMANDA_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>Situacao
            <input required list="situacao-suggestions" value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} />
          </label>
          <datalist id="situacao-suggestions">
            {SITUACAO_SUGGESTIONS.map((suggestion) => <option value={suggestion} key={suggestion} />)}
          </datalist>
          <label>Proxima acao<input required value={form.proximaAcao} onChange={(event) => setForm({ ...form, proximaAcao: event.target.value })} /></label>
          <label>Data da proxima acao<input required type="datetime-local" value={form.proximaAcaoEm} onChange={(event) => setForm({ ...form, proximaAcaoEm: event.target.value })} /></label>
          <button className="button primary" type="submit" disabled={!customers.length}><Plus aria-hidden="true" />Salvar oportunidade</button>
        </form>
      ) : null}

      <section id="oportunidades-section" className="data-section opportunities-board-page">
        <section className="opportunities-summary" aria-label="Resumo da carteira de oportunidades">
          <article>
            <span>Ativas</span>
            <strong>{activeCount}</strong>
          </article>
          <article>
            <span>Valor aprovado</span>
            <strong>{formatMoney(wonValue)}</strong>
          </article>
          <article className={withoutNextActionCount ? "opportunities-summary-warning" : ""}>
            <span>Sem proxima acao</span>
            <strong>{withoutNextActionCount}</strong>
          </article>
        </section>

        <div className="pipeline-section-header opportunities-section-header">
          <h2>Board de oportunidades</h2>
          <label className="search-box">
            <Search aria-hidden="true" />
            <input
              type="search"
              placeholder="Filtrar por titulo ou cliente"
              aria-label="Filtrar oportunidades"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void refresh();
              }}
            />
          </label>
        </div>

        <div className="opportunities-board" aria-busy={isLoading}>
          {isLoading ? (
            <p className="quotes-empty">Carregando oportunidades...</p>
          ) : opportunityLanes.length ? (
            <>
              <section className="opportunity-kanban" aria-label="Board operacional de oportunidades">
                {opportunityLanes.map((lane) => (
                  <article key={lane.stage} className="opportunity-lane">
                    <header>
                      <div>
                        <h3>{lane.stage}</h3>
                        <p>{lane.items.length} oportunidades nesta etapa</p>
                      </div>
                      <strong>{lane.items.length}</strong>
                    </header>
                    <div className="opportunity-lane-scroll">
                      <ul className="opportunity-card-list">
                        {lane.items.map((opportunity) => (
                          <li key={opportunity.id} className={!opportunity.proximaAcao || !opportunity.proximaAcaoEm ? "opportunity-card opportunity-card-warning" : "opportunity-card"}>
                            <div className="opportunity-card-main">
                              <div>
                                <Link className="opportunity-card-title" to={`/oportunidades/${opportunity.id}`}>{opportunity.titulo}</Link>
                                <span>{opportunity.situacao}</span>
                              </div>
                              <span className={`badge ${opportunityStatusBadgeClass(opportunity.status)}`}>{formatOpportunityStatus(opportunity.status)}</span>
                            </div>

                            <div className="opportunity-card-client">
                              <Avatar name={opportunity.clienteNome} size="sm" />
                              <span><UserRound aria-hidden="true" size={14} /> {opportunity.clienteNome}</span>
                            </div>

                            <div className="opportunity-card-facts">
                              <span><CalendarClock aria-hidden="true" size={14} /> {formatNextAction(opportunity)}</span>
                              <span><CircleDollarSign aria-hidden="true" size={14} /> {formatOpportunityValue(opportunity)}</span>
                            </div>

                            <div className="opportunity-card-footer">
                              <span>{formatDemandType(opportunity.tipoDemanda)}</span>
                              <Link className="button secondary" to={`/oportunidades/${opportunity.id}`}>Abrir oportunidade</Link>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </section>
              {nextCursor !== null ? (
                <button className="button secondary" type="button" disabled={isLoadingMore} onClick={() => void handleLoadMore()}>
                  {isLoadingMore ? "Carregando..." : "Carregar mais oportunidades"}
                </button>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <h3>Nenhuma oportunidade cadastrada</h3>
              <p>Crie uma oportunidade com responsavel, proxima acao e data.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function groupOpportunitiesByStage(opportunities: Opportunity[]): Array<{ stage: string; items: Opportunity[] }> {
  const map = new Map<string, Opportunity[]>();
  for (const opportunity of opportunities) {
    const stage = opportunity.etapaNome || "Sem etapa";
    map.set(stage, [...(map.get(stage) ?? []), opportunity]);
  }
  return Array.from(map.entries()).map(([stage, items]) => ({ stage, items }));
}

function formatNextAction(opportunity: Opportunity): string {
  if (!opportunity.proximaAcao || !opportunity.proximaAcaoEm) return "Sem proxima acao";
  return `${opportunity.proximaAcao} - ${formatDateTime(opportunity.proximaAcaoEm)}`;
}

function formatOpportunityValue(opportunity: Opportunity): string {
  if (opportunity.valorAprovado) return `Aprovado ${formatMoney(opportunity.valorAprovado)}`;
  if (opportunity.valorOrcamento) return `Orcado ${formatMoney(opportunity.valorOrcamento)}`;
  if (opportunity.valorEstimado) return `Estimado ${formatMoney(opportunity.valorEstimado)}`;
  return "Sem valor";
}

function formatDemandType(value: string): string {
  return TIPO_DEMANDA_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
