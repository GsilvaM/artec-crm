import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { archiveCustomer, createCustomer, loadCustomersPage, type Customer } from "../../domain/crm";

export function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", empresa: "", bairro: "", cidade: "" });
  const [customerToArchive, setCustomerToArchive] = useState<Customer | null>(null);
  const { showToast } = useToast();

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const page = await loadCustomersPage(search);
      setCustomers(page.customers);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os clientes.");
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
      setError(err instanceof Error ? err.message : "Não foi possível carregar mais clientes.");
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
      showToast(err instanceof Error ? err.message : "Não foi possível arquivar o cliente.", "error");
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createCustomer({ tipoPessoa: "fisica", ...form });
      setForm({ nome: "", telefone: "", email: "", empresa: "", bairro: "", cidade: "" });
      showToast("Cliente salvo.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o cliente.");
    }
  }

  const activeCustomers = customers.filter((customer) => !customer.archivedAt);

  return (
    <>
      <section id="clientes" className="page-heading">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h1>Clientes</h1>
        </div>
      </section>

      <form className="panel compact-form" onSubmit={handleCreate}>
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

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      <section id="clientes-section" className="data-section">
        <div className="pipeline-section-header">
          <h2>Todos os clientes</h2>
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

        {isLoading ? (
          <LoadingPanels />
        ) : activeCustomers.length ? (
          <div className="table-wrap mobile-cards">
            <table>
              <thead><tr><th>Nome</th><th>Telefone</th><th>Empresa</th><th>Oportunidades</th><th>Ações</th></tr></thead>
              <tbody>
                {activeCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td data-label="Nome">{customer.nome}{customer.duplicatePhoneCustomerIds.length ? <span className="badge warning">possível duplicidade</span> : null}</td>
                    <td data-label="Telefone">{customer.telefone ?? "-"}</td>
                    <td data-label="Empresa">{customer.empresa ?? "-"}</td>
                    <td data-label="Oportunidades">{customer.opportunitiesCount}</td>
                    <td className="actions-cell">
                      <Link className="button secondary" to={`/clientes/${customer.id}`}>Abrir</Link>
                      <button className="button ghost" type="button" onClick={() => setCustomerToArchive(customer)}>Arquivar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Nenhum cliente cadastrado" text="Cadastre o primeiro cliente para criar oportunidades comerciais." />
        )}
        {nextCursor ? (
          <button className="button secondary" type="button" disabled={isLoadingMore} onClick={() => void handleLoadMore()}>
            {isLoadingMore ? "Carregando..." : "Carregar mais clientes"}
          </button>
        ) : null}
      </section>

      {customerToArchive ? (
        <ConfirmDialog
          title="Arquivar cliente"
          message={`Arquivar ${customerToArchive.nome}? O histórico será preservado.`}
          confirmLabel="Arquivar"
          onConfirm={() => void handleConfirmArchive()}
          onCancel={() => setCustomerToArchive(null)}
        />
      ) : null}
    </>
  );
}
