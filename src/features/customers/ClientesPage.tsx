import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Filter, Mail, MapPin, Phone, Plus, Search, UserRound } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/input";
import { useToast } from "../../components/ui/Toast";
import { archiveCustomer, createCustomer, createOpportunity, loadCustomersPage, SITUACAO_SUGGESTIONS, TIPO_DEMANDA_OPTIONS, type Customer } from "../../domain/crm";

type CustomerForm = {
  tipoPessoa: "fisica" | "juridica";
  nome: string;
  telefone: string;
  email: string;
  empresa: string;
  bairro: string;
  cidade: string;
  opportunityTitle: string;
  tipoDemanda: string;
  situacao: string;
  proximaAcao: string;
  proximaAcaoEm: string;
};

type CustomerFilter = "all" | "fisica" | "juridica" | "withOpportunity";

const EMPTY_FORM: CustomerForm = {
  tipoPessoa: "fisica",
  nome: "",
  telefone: "",
  email: "",
  empresa: "",
  bairro: "",
  cidade: "",
  opportunityTitle: "",
  tipoDemanda: "instalacao",
  situacao: "primeiro contato",
  proximaAcao: "",
  proximaAcaoEm: "",
};

export function ClientesPage({ currentUserId }: { currentUserId: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [customerToArchive, setCustomerToArchive] = useState<Customer | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);
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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const customer = await createCustomer({
        tipoPessoa: form.tipoPessoa,
        nome: form.nome,
        telefone: form.telefone,
        email: form.email,
        empresa: form.empresa,
        bairro: form.bairro,
        cidade: form.cidade,
      });
      const opportunityTitle = form.opportunityTitle.trim();
      if (opportunityTitle) {
        try {
          await createOpportunity({
            clienteId: customer.id,
            titulo: opportunityTitle,
            tipoDemanda: form.tipoDemanda,
            situacao: form.situacao.trim() || "primeiro contato",
            proximaAcao: form.proximaAcao.trim(),
            proximaAcaoEm: form.proximaAcaoEm,
            responsavelId: currentUserId,
          });
        } catch (opportunityError) {
          setForm(EMPTY_FORM);
          setShowCreateForm(false);
          setCreatedMessage("Cliente salvo. A oportunidade nao foi criada porque a API recusou a atribuicao ou os dados comerciais.");
          showToast(opportunityError instanceof Error ? opportunityError.message : "Cliente salvo, mas a oportunidade nao foi criada.", "error");
          await refresh();
          return;
        }
      }
      setForm(EMPTY_FORM);
      setShowCreateForm(false);
      setCreatedMessage(opportunityTitle ? `Cliente salvo. Oportunidade "${opportunityTitle}" criada.` : "Cliente salvo.");
      showToast(opportunityTitle ? "Cliente e oportunidade salvos." : "Cliente salvo.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o cliente.");
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

  const activeCustomers = customers.filter((customer) => !customer.archivedAt);
  const customersWithOpportunities = activeCustomers.filter((customer) => customer.opportunitiesCount > 0).length;
  const visibleCustomers = useMemo(
    () => activeCustomers.filter((customer) => {
      if (filter === "fisica") return customer.tipoPessoa === "fisica";
      if (filter === "juridica") return customer.tipoPessoa === "juridica";
      if (filter === "withOpportunity") return customer.opportunitiesCount > 0;
      return true;
    }),
    [activeCustomers, filter],
  );

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "cliente",
      header: "Cliente",
      render: (customer) => (
        <div className="design-table-identity">
          <span className="design-table-icon">{customer.tipoPessoa === "fisica" ? <UserRound size={17} aria-hidden="true" /> : <Building2 size={17} aria-hidden="true" />}</span>
          <span>
            <Link to={`/clientes/${customer.id}`}>{customer.nome}</Link>
            <small>{customer.tipoPessoa === "fisica" ? "PF" : customer.empresa ? "Empresa" : "Condomínio"}</small>
          </span>
        </div>
      ),
    },
    {
      key: "contato",
      header: "Contato",
      render: (customer) => (
        <span className="design-table-stack">
          <small><Phone size={13} aria-hidden="true" /> {customer.telefone ?? "Sem telefone"}</small>
          {customer.email ? <small><Mail size={13} aria-hidden="true" /> {customer.email}</small> : null}
        </span>
      ),
    },
    {
      key: "localidade",
      header: "Localidade",
      render: (customer) => <span className="design-table-muted"><MapPin size={13} aria-hidden="true" /> {formatCustomerLocation(customer)}</span>,
    },
    {
      key: "oportunidades",
      header: "Oportunidades",
      render: (customer) => (
        <span className="design-table-stack">
          {customer.opportunitiesCount ? <Badge tone="positive">{customer.opportunitiesCount} ativa{customer.opportunitiesCount > 1 ? "s" : ""}</Badge> : <span className="design-table-muted">Sem ativas</span>}
          {customer.duplicatePhoneCustomerIds.length ? <Badge tone="warning">duplicidade</Badge> : null}
        </span>
      ),
    },
    {
      key: "ultimo",
      header: "Último contato",
      render: () => <span className="design-table-muted">há 1 dia</span>,
    },
    {
      key: "responsavel",
      header: "Responsável",
      render: (customer) => (
        <span className="design-table-owner">
          <Avatar name={customer.nome} size="sm" /> Ana Ribeiro
        </span>
      ),
    },
  ];

  return (
    <>
      <section id="clientes" className="page-heading design-page-heading">
        <div>
          <h1>Clientes</h1>
          <p>{activeCustomers.length} cadastros · {customersWithOpportunities} com oportunidades ativas</p>
        </div>
        <Button variant="primary" type="button" onClick={() => setShowCreateForm((open) => !open)}>
          <Plus aria-hidden="true" /> {showCreateForm ? "Fechar" : "Novo cliente"}
        </Button>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}
      {createdMessage ? <div className="alert customer-created-alert" role="status">{createdMessage}</div> : null}

      {showCreateForm ? (
        <form className="panel compact-form design-create-form" onSubmit={handleCreate}>
          <h2>Novo cliente</h2>
          <label>Tipo de pessoa
            <select value={form.tipoPessoa} onChange={(event) => setForm({ ...form, tipoPessoa: event.target.value as "fisica" | "juridica" })}>
              <option value="fisica">Pessoa física</option>
              <option value="juridica">Pessoa jurídica</option>
            </select>
          </label>
          <label>Nome<Input required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /></label>
          <label>Telefone<Input value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} /></label>
          <label>E-mail<Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Empresa<Input value={form.empresa} onChange={(event) => setForm({ ...form, empresa: event.target.value })} /></label>
          <label>Bairro<Input value={form.bairro} onChange={(event) => setForm({ ...form, bairro: event.target.value })} /></label>
          <label>Cidade<Input value={form.cidade} onChange={(event) => setForm({ ...form, cidade: event.target.value })} /></label>
          <fieldset className="quick-opportunity-fields">
            <legend>Demanda comercial</legend>
            <label>Título da oportunidade<Input aria-label="Titulo da oportunidade" value={form.opportunityTitle} onChange={(event) => setForm({ ...form, opportunityTitle: event.target.value })} /></label>
            <label>Tipo de demanda
              <select value={form.tipoDemanda} onChange={(event) => setForm({ ...form, tipoDemanda: event.target.value })}>
                {TIPO_DEMANDA_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>Situação<Input aria-label="Situacao" list="customer-situacao-suggestions" value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} /></label>
            <datalist id="customer-situacao-suggestions">
              {SITUACAO_SUGGESTIONS.map((suggestion) => <option value={suggestion} key={suggestion} />)}
            </datalist>
            <label>Próxima ação<Input aria-label="Proxima acao" required={Boolean(form.opportunityTitle.trim())} value={form.proximaAcao} onChange={(event) => setForm({ ...form, proximaAcao: event.target.value })} /></label>
            <label>Data da próxima ação<Input aria-label="Data da proxima acao" required={Boolean(form.opportunityTitle.trim())} type="datetime-local" value={form.proximaAcaoEm} onChange={(event) => setForm({ ...form, proximaAcaoEm: event.target.value })} /></label>
          </fieldset>
          <Button variant="primary" type="submit"><Plus aria-hidden="true" /> Salvar atendimento</Button>
        </form>
      ) : null}

      <section id="clientes-section" className="data-section design-list-page">
        <div className="design-list-toolbar">
          <label className="design-search-field">
            <Search size={17} aria-hidden="true" />
            <Input type="search" placeholder="Buscar por nome, cidade ou telefone" aria-label="Filtrar clientes" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void refresh(); }} />
          </label>
          <div className="design-segmented" role="group" aria-label="Filtrar clientes por tipo">
            <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Todos</button>
            <button type="button" className={filter === "fisica" ? "active" : ""} onClick={() => setFilter("fisica")}>PF</button>
            <button type="button" className={filter === "juridica" ? "active" : ""} onClick={() => setFilter("juridica")}>Empresa</button>
          </div>
          <Button variant="secondary" type="button"><Filter size={16} aria-hidden="true" /> Mais filtros</Button>
        </div>

        <DataTable
          columns={columns}
          rows={visibleCustomers}
          rowKey={(customer) => customer.id}
          isLoading={isLoading}
          emptyTitle="Nenhum cliente cadastrado"
          emptyText="Cadastre o primeiro cliente para criar oportunidades comerciais."
          hasMore={nextCursor !== null}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => void handleLoadMore()}
          loadMoreLabel="Carregar mais clientes"
        />
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

function formatCustomerLocation(customer: Customer): string {
  return [customer.bairro, customer.cidade].filter(Boolean).join(" — ") || "Sem localização";
}
