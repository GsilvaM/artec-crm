import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { formatDateTime, formatOpportunityStatus, opportunityStatusBadgeClass } from "../../domain/format";
import { Avatar } from "../../components/ui/Avatar";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { createOpportunity, loadCustomersPage, loadOpportunitiesPage, TIPO_DEMANDA_OPTIONS, SITUACAO_SUGGESTIONS, type Customer, type Opportunity } from "../../domain/crm";

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
          <select required value={form.tipoDemanda} onChange={(event) => setForm({ ...form, tipoDemanda: event.target.value })}>
            {TIPO_DEMANDA_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label>
          Situação
          <input required list="situacao-suggestions" value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} />
        </label>
        <datalist id="situacao-suggestions">
          {SITUACAO_SUGGESTIONS.map((suggestion) => <option value={suggestion} key={suggestion} />)}
        </datalist>
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

        <DataTable
          columns={opportunityColumns}
          rows={opportunities}
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

const opportunityColumns: DataTableColumn<Opportunity>[] = [
  { key: "titulo", header: "Título", render: (opportunity) => opportunity.titulo },
  {
    key: "cliente",
    header: "Cliente",
    render: (opportunity) => (
      <span className="cell-with-avatar">
        <Avatar name={opportunity.clienteNome} size="sm" />
        <span className="cell-primary-text">{opportunity.clienteNome}</span>
      </span>
    ),
  },
  { key: "etapa", header: "Etapa", render: (opportunity) => opportunity.etapaNome },
  { key: "situacao", header: "Situação", render: (opportunity) => opportunity.situacao },
  {
    key: "proximaAcao",
    header: "Próxima ação",
    render: (opportunity) => (opportunity.proximaAcao ? `${opportunity.proximaAcao} - ${formatDateTime(opportunity.proximaAcaoEm)}` : <span className="badge badge-alert-danger">sem próxima ação</span>),
  },
  { key: "status", header: "Status", render: (opportunity) => <span className={`badge ${opportunityStatusBadgeClass(opportunity.status)}`}>{formatOpportunityStatus(opportunity.status)}</span> },
  { key: "acoes", header: "Ações", className: "actions-cell", render: (opportunity) => <Link className="button secondary" to={`/oportunidades/${opportunity.id}`}>Abrir</Link> },
];
