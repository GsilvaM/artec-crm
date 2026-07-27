import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Building2, CheckCircle2, MapPin, Phone, Plus, Search } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [customerToArchive, setCustomerToArchive] = useState<Customer | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [lastCreatedCustomer, setLastCreatedCustomer] = useState<Customer | null>(null);
  const [lastCreatedOpportunityTitle, setLastCreatedOpportunityTitle] = useState<string | null>(null);
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
        await createOpportunity({
          clienteId: customer.id,
          titulo: opportunityTitle,
          tipoDemanda: form.tipoDemanda,
          situacao: form.situacao.trim() || "primeiro contato",
          proximaAcao: form.proximaAcao.trim(),
          proximaAcaoEm: form.proximaAcaoEm,
          responsavelId: currentUserId,
        });
      }
      setForm(EMPTY_FORM);
      setShowCreateForm(false);
      setLastCreatedCustomer(customer);
      setLastCreatedOpportunityTitle(opportunityTitle || null);
      showToast(opportunityTitle ? "Cliente e oportunidade salvos." : "Cliente salvo.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar o cliente.");
    }
  }

  const activeCustomers = customers.filter((customer) => !customer.archivedAt);
  const duplicateCount = activeCustomers.filter((customer) => customer.duplicatePhoneCustomerIds.length > 0).length;
  const opportunitiesCount = activeCustomers.reduce((total, customer) => total + customer.opportunitiesCount, 0);
  const customerLanes = useMemo(() => groupCustomersBySegment(activeCustomers), [activeCustomers]);
  const duplicateCandidates = useMemo(() => findDuplicateCandidates(activeCustomers, form.telefone), [activeCustomers, form.telefone]);

  return (
    <>
      <section id="clientes" className="page-heading customers-heading">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h1>Clientes</h1>
        </div>
        <button className="button primary" type="button" onClick={() => {
          setLastCreatedCustomer(null);
          setLastCreatedOpportunityTitle(null);
          setShowCreateForm((open) => !open);
        }}>
          <Plus aria-hidden="true" />{showCreateForm ? "Fechar criacao" : "Novo cliente"}
        </button>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}
      {lastCreatedCustomer ? (
        <div className="alert success-alert customer-created-alert" role="status">
          <CheckCircle2 aria-hidden="true" />
          <div>
            <strong>{lastCreatedCustomer.nome} cadastrado.</strong>
            <span>{lastCreatedOpportunityTitle ? `Oportunidade "${lastCreatedOpportunityTitle}" criada com proxima acao.` : "Continue o atendimento criando a oportunidade com o cliente ja selecionado."}</span>
          </div>
          {lastCreatedOpportunityTitle ? (
            <Link className="button primary" to="/oportunidades">
              Abrir oportunidades
            </Link>
          ) : (
            <Link className="button primary" to={`/oportunidades?clienteId=${lastCreatedCustomer.id}`}>
              <Plus aria-hidden="true" />Criar oportunidade
            </Link>
          )}
        </div>
      ) : null}

      {showCreateForm ? (
        <form className="panel compact-form customer-create-form" onSubmit={handleCreate}>
          <div className="form-heading">
            <div>
              <h2>Novo cliente</h2>
              <p>Capture o essencial agora; se ja houver demanda, crie a oportunidade e a proxima acao no mesmo envio.</p>
            </div>
            <span className="badge neutral">cadastro rapido</span>
          </div>
          <label>Tipo de pessoa
            <select value={form.tipoPessoa} onChange={(event) => setForm({ ...form, tipoPessoa: event.target.value as "fisica" | "juridica" })}>
              <option value="fisica">Pessoa fisica</option>
              <option value="juridica">Pessoa juridica</option>
            </select>
          </label>
          <label>Nome<input required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /></label>
          <label>Telefone<input value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} /></label>
          {duplicateCandidates.length ? (
            <div className="inline-warning" role="status">
              <AlertTriangle aria-hidden="true" />
              <div>
                <strong>Telefone parecido ja existe</strong>
                <span>{duplicateCandidates.map((customer) => customer.nome).join(", ")}</span>
              </div>
            </div>
          ) : null}
          <label>E-mail<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Empresa<input value={form.empresa} onChange={(event) => setForm({ ...form, empresa: event.target.value })} /></label>
          <div className="form-row">
            <label>Bairro<input value={form.bairro} onChange={(event) => setForm({ ...form, bairro: event.target.value })} /></label>
            <label>Cidade<input value={form.cidade} onChange={(event) => setForm({ ...form, cidade: event.target.value })} /></label>
          </div>
          <fieldset className="quick-opportunity-fields">
            <legend>Demanda comercial</legend>
            <p className="form-hint">Opcional. Preencha quando o contato ja precisa entrar no funil comercial.</p>
            <label>Titulo da oportunidade<input value={form.opportunityTitle} onChange={(event) => setForm({ ...form, opportunityTitle: event.target.value })} placeholder="ex: Instalacao split quarto" /></label>
            <label>Tipo de demanda
              <select value={form.tipoDemanda} onChange={(event) => setForm({ ...form, tipoDemanda: event.target.value })}>
                {TIPO_DEMANDA_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>Situacao
              <input list="customer-situacao-suggestions" value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} />
            </label>
            <datalist id="customer-situacao-suggestions">
              {SITUACAO_SUGGESTIONS.map((suggestion) => <option value={suggestion} key={suggestion} />)}
            </datalist>
            <label>Proxima acao<input required={Boolean(form.opportunityTitle.trim())} value={form.proximaAcao} onChange={(event) => setForm({ ...form, proximaAcao: event.target.value })} placeholder="ex: retornar orçamento" /></label>
            <label>Data da proxima acao<input required={Boolean(form.opportunityTitle.trim())} type="datetime-local" value={form.proximaAcaoEm} onChange={(event) => setForm({ ...form, proximaAcaoEm: event.target.value })} /></label>
          </fieldset>
          <button className="button primary" type="submit"><Plus aria-hidden="true" />Salvar atendimento</button>
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

function findDuplicateCandidates(customers: Customer[], phone: string): Customer[] {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length < 8) return [];
  return customers
    .filter((customer) => normalizePhone(customer.telefone ?? "") === normalizedPhone || customer.telefoneNormalizado === normalizedPhone)
    .slice(0, 3);
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
