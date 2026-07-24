import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, MapPin, Phone, Plus, Search } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { archiveCustomer, createCustomer, loadCustomersPage, type Customer } from "../../domain/crm";

const EMPTY_FORM = { nome: "", telefone: "", email: "", empresa: "", bairro: "", cidade: "" };

export function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [customerToArchive, setCustomerToArchive] = useState<Customer | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { showToast } = useToast();

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const page = await loadCustomersPage(search);
      setCustomers(page.customers);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar os clientes.");
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
      const page = await loadCustomersPage(search, nextCursor);
      setCustomers((current) => [...current, ...page.customers]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar mais clientes.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleConfirmArchive() {
    if (!customerToArchive) return;
    try {
      await archiveCustomer(customerToArchive.id);
      showToast(`${customerToArchive.nome} arquivado.`);
      setCustomerToArchive(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Nao foi possivel arquivar o cliente.", "error");
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createCustomer({ tipoPessoa: "fisica", ...form });
      setForm(EMPTY_FORM);
      setShowCreateForm(false);
      showToast("Cliente salvo.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar o cliente.");
    }
  }

  const activeCustomers = customers.filter((customer) => !customer.archivedAt);
  const duplicateCount = activeCustomers.filter((customer) => customer.duplicatePhoneCustomerIds.length > 0).length;
  const opportunitiesCount = activeCustomers.reduce((total, customer) => total + customer.opportunitiesCount, 0);
  const customerLanes = useMemo(() => groupCustomersBySegment(activeCustomers), [activeCustomers]);

  return (
    <>
      <section id="clientes" className="page-heading customers-heading">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h1>Clientes</h1>
        </div>
        <button className="button primary" type="button" onClick={() => setShowCreateForm((open) => !open)}>
          <Plus aria-hidden="true" />{showCreateForm ? "Fechar criacao" : "Novo cliente"}
        </button>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {showCreateForm ? (
        <form className="panel compact-form customer-create-form" onSubmit={handleCreate}>
          <h2>Novo cliente</h2>
          <label>Nome<input required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /></label>
          <label>Telefone<input value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} /></label>
          <label>E-mail<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Empresa<input value={form.empresa} onChange={(event) => setForm({ ...form, empresa: event.target.value })} /></label>
          <div className="form-row">
            <label>Bairro<input value={form.bairro} onChange={(event) => setForm({ ...form, bairro: event.target.value })} /></label>
            <label>Cidade<input value={form.cidade} onChange={(event) => setForm({ ...form, cidade: event.target.value })} /></label>
          </div>
          <button className="button primary" type="submit"><Plus aria-hidden="true" />Salvar cliente</button>
        </form>
      ) : null}

      <section id="clientes-section" className="data-section customers-board-page">
        <section className="customers-summary" aria-label="Resumo da carteira de clientes">
          <article>
            <span>Clientes ativos</span>
            <strong>{activeCustomers.length}</strong>
          </article>
          <article>
            <span>Oportunidades vinculadas</span>
            <strong>{opportunitiesCount}</strong>
          </article>
          <article className={duplicateCount ? "customers-summary-warning" : ""}>
            <span>Possiveis duplicidades</span>
            <strong>{duplicateCount}</strong>
          </article>
        </section>

        <div className="pipeline-section-header customers-section-header">
          <h2>Board de clientes</h2>
          <label className="search-box">
            <Search aria-hidden="true" />
            <input
              type="search"
              placeholder="Filtrar por nome, telefone ou empresa"
              aria-label="Filtrar clientes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void refresh();
              }}
            />
          </label>
        </div>

        <div className="customers-board" aria-busy={isLoading}>
          {isLoading ? (
            <p className="quotes-empty">Carregando clientes...</p>
          ) : customerLanes.length ? (
            <>
              <section className="customer-kanban" aria-label="Board operacional de clientes">
                {customerLanes.map((lane) => (
                  <article key={lane.id} className="customer-lane">
                    <header>
                      <div>
                        <h3>{lane.title}</h3>
                        <p>{lane.hint}</p>
                      </div>
                      <strong>{lane.items.length}</strong>
                    </header>
                    <div className="customer-lane-scroll">
                      <ul className="customer-card-list">
                        {lane.items.map((customer) => (
                          <li key={customer.id} className={customer.duplicatePhoneCustomerIds.length ? "customer-card customer-card-warning" : "customer-card"}>
                            <div className="customer-card-main">
                              <Avatar name={customer.nome} size="sm" />
                              <div>
                                <Link className="customer-card-title" to={`/clientes/${customer.id}`}>{customer.nome}</Link>
                                <span>{customer.tipoPessoa === "fisica" ? "Pessoa fisica" : "Pessoa juridica"}</span>
                              </div>
                              {customer.duplicatePhoneCustomerIds.length ? <span className="badge warning">possivel duplicidade</span> : null}
                            </div>

                            <div className="customer-card-facts">
                              <span><Phone aria-hidden="true" size={14} /> {customer.telefone ?? "Sem telefone"}</span>
                              <span><Building2 aria-hidden="true" size={14} /> {customer.empresa ?? "Sem empresa"}</span>
                              <span><MapPin aria-hidden="true" size={14} /> {formatCustomerLocation(customer)}</span>
                            </div>

                            <div className="customer-card-footer">
                              <span><strong>{customer.opportunitiesCount}</strong> oportunidade(s)</span>
                              <div className="quick-actions">
                                <Link className="button secondary" to={`/clientes/${customer.id}`}>Abrir cliente</Link>
                                <button className="button ghost" type="button" onClick={() => setCustomerToArchive(customer)}>Arquivar</button>
                              </div>
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
                  {isLoadingMore ? "Carregando..." : "Carregar mais clientes"}
                </button>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <h3>Nenhum cliente cadastrado</h3>
              <p>Cadastre o primeiro cliente para criar oportunidades comerciais.</p>
            </div>
          )}
        </div>
      </section>

      {customerToArchive ? (
        <ConfirmDialog
          title="Arquivar cliente"
          message={`Arquivar ${customerToArchive.nome}? O historico sera preservado.`}
          confirmLabel="Arquivar"
          onConfirm={() => void handleConfirmArchive()}
          onCancel={() => setCustomerToArchive(null)}
        />
      ) : null}
    </>
  );
}

function groupCustomersBySegment(customers: Customer[]): Array<{ id: string; title: string; hint: string; items: Customer[] }> {
  const attention = customers.filter((customer) => customer.duplicatePhoneCustomerIds.length > 0);
  const stable = customers.filter((customer) => customer.duplicatePhoneCustomerIds.length === 0);
  return [
    { id: "attention", title: "Atencao", hint: "Possiveis duplicidades para revisar.", items: attention },
    { id: "with-opportunities", title: "Com oportunidades", hint: "Clientes com venda ou atendimento ativo.", items: stable.filter((customer) => customer.opportunitiesCount > 0) },
    { id: "without-opportunities", title: "Sem oportunidade", hint: "Cadastro pronto para qualificar demanda.", items: stable.filter((customer) => customer.opportunitiesCount === 0) },
  ].filter((lane) => lane.items.length > 0);
}

function formatCustomerLocation(customer: Customer): string {
  return [customer.bairro, customer.cidade].filter(Boolean).join(" - ") || "Sem localizacao";
}
