import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { formatDateTime, formatOpportunityStatus } from "../../domain/format";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { createOpportunity, loadCustomersPage, loadOpportunitiesPage, type Customer, type Opportunity } from "../../domain/crm";

export function OportunidadesPage({ currentUserId }: { currentUserId: string }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ clienteId: "", titulo: "", tipoDemanda: "instalacao", situacao: "em andamento", proximaAcao: "", proximaAcaoEm: "" });

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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createOpportunity({ ...form, responsavelId: currentUserId });
      setForm((current) => ({ ...current, titulo: "", proximaAcao: "", proximaAcaoEm: "" }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a oportunidade.");
    }
  }

  const demandTypeSample = ["instalacao", "manutencao_corretiva", "manutencao_preventiva", "higienizacao", "visita_tecnica_consultiva", "garantia", "suporte", "pos_venda"];

  return (
    <>
      <section id="oportunidades" className="page-heading">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h1>Oportunidades</h1>
        </div>
      </section>

      <form className="panel compact-form" onSubmit={handleCreate}>
        <h2>Nova oportunidade</h2>
        <label>Cliente
          <select required value={form.clienteId} onChange={(event) => setForm({ ...form, clienteId: event.target.value })}>
            <option value="">Selecione</option>
            {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.nome}</option>)}
          </select>
        </label>
        <label>Título<input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /></label>
        <label>
          Tipo de demanda
          <input required list="demand-types" value={form.tipoDemanda} onChange={(event) => setForm({ ...form, tipoDemanda: event.target.value })} />
          <span className="field-hint">Valor padrão preenchido — ajuste se necessário</span>
        </label>
        <datalist id="demand-types">
          {demandTypeSample.map((type) => <option value={type} key={type} />)}
        </datalist>
        <label>
          Situação
          <input required value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} />
          <span className="field-hint">Valor padrão preenchido — ajuste se necessário</span>
        </label>
        <label>Próxima ação<input required value={form.proximaAcao} onChange={(event) => setForm({ ...form, proximaAcao: event.target.value })} /></label>
        <label>Data da próxima ação<input required type="datetime-local" value={form.proximaAcaoEm} onChange={(event) => setForm({ ...form, proximaAcaoEm: event.target.value })} /></label>
        <button className="button primary" type="submit" disabled={!customers.length}><Plus aria-hidden="true" />Salvar oportunidade</button>
      </form>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      <section id="oportunidades-section" className="data-section">
        <div className="pipeline-section-header">
          <h2>Todas as oportunidades</h2>
          <label className="search-box">
            <Search aria-hidden="true" />
            <input
              type="search"
              placeholder="Filtrar por título ou cliente"
              aria-label="Filtrar oportunidades"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void refresh();
              }}
            />
          </label>
        </div>

        {isLoading ? (
          <LoadingPanels />
        ) : opportunities.length ? (
          <div className="table-wrap mobile-cards">
            <table>
              <thead><tr><th>Título</th><th>Cliente</th><th>Etapa</th><th>Situação</th><th>Próxima ação</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id}>
                    <td data-label="Título">{opportunity.titulo}</td>
                    <td data-label="Cliente">{opportunity.clienteNome}</td>
                    <td data-label="Etapa">{opportunity.etapaNome}</td>
                    <td data-label="Situação">{opportunity.situacao}</td>
                    <td data-label="Próxima ação">{opportunity.proximaAcao ? `${opportunity.proximaAcao} - ${formatDateTime(opportunity.proximaAcaoEm)}` : <span className="badge badge-alert-danger">sem próxima ação</span>}</td>
                    <td data-label="Status"><span className="badge">{formatOpportunityStatus(opportunity.status)}</span></td>
                    <td className="actions-cell"><Link className="button secondary" to={`/oportunidades/${opportunity.id}`}>Abrir</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Nenhuma oportunidade cadastrada" text="Crie uma oportunidade com responsável, próxima ação e data." />
        )}
        {nextCursor ? (
          <button className="button secondary" type="button" disabled={isLoadingMore} onClick={() => void handleLoadMore()}>
            {isLoadingMore ? "Carregando..." : "Carregar mais oportunidades"}
          </button>
        ) : null}
      </section>
    </>
  );
}
