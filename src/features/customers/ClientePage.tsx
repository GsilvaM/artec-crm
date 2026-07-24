import { type FormEvent, useEffect, useState } from "react";
import { BriefcaseBusiness, CalendarClock, CheckCircle2, ListChecks, MapPin, Mail, Phone, Plus, ShieldAlert, Snowflake, XCircle } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AuvoSignalSummary } from "../../components/AuvoSignalSummary";
import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Tabs, type TabItem } from "../../components/ui/Tabs";
import { useToast } from "../../components/ui/Toast";
import { formatActivityType, formatAddressKind, formatDateTime, formatEquipmentType, formatOpportunityStatus, formatVisitStatus, opportunityStatusBadgeClass } from "../../domain/format";
import {
  archiveCustomer,
  cancelVisit,
  createActivity,
  createAddress,
  createEquipment,
  createNextAction,
  createVisit,
  completeVisit,
  loadCustomer,
  loadCustomerAddresses,
  loadCustomerActivities,
  loadCustomerEquipment,
  loadNextActions,
  loadOpportunitiesByCustomer,
  loadVisits,
  type Address,
  type Activity,
  type Customer,
  type Equipment,
  type NextAction,
  type Opportunity,
  type Visit,
} from "../../domain/crm";

const SUPPORT_ACTIVITY_TYPES: Activity["type"][] = ["warranty", "support", "after_sales"];
const TAB_IDS = ["visao-geral", "estrutura", "oportunidades", "proximas-acoes", "garantia-suporte", "linha-do-tempo"] as const;
type TabId = (typeof TAB_IDS)[number];

type AddressForm = { label: string; kind: Address["kind"]; street: string; number: string; neighborhood: string; city: string; accessNotes: string; isPrimary: boolean };
type EquipmentForm = { type: Equipment["type"]; brand: string; model: string; btus: string; voltage: string; environment: string; addressId: string; opportunityId: string; notes: string };
type VisitForm = { objective: string; scheduledStartAt: string; scheduledEndAt: string; addressId: string; opportunityId: string; equipmentIds: string[]; accessNotes: string };

const initialAddressForm: AddressForm = { label: "", kind: "service", street: "", number: "", neighborhood: "", city: "", accessNotes: "", isPrimary: false };
const initialEquipmentForm: EquipmentForm = { type: "split_hi_wall", brand: "", model: "", btus: "", voltage: "", environment: "", addressId: "", opportunityId: "", notes: "" };
const initialVisitForm: VisitForm = { objective: "", scheduledStartAt: "", scheduledEndAt: "", addressId: "", opportunityId: "", equipmentIds: [], accessNotes: "" };

export function ClientePage({ currentUserId }: { currentUserId: string }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityForm, setActivityForm] = useState<{ type: Activity["type"]; description: string }>({ type: "warranty", description: "" });
  const [actionForm, setActionForm] = useState({ title: "", dueAt: "" });
  const [addressForm, setAddressForm] = useState<AddressForm>(initialAddressForm);
  const [equipmentForm, setEquipmentForm] = useState<EquipmentForm>(initialEquipmentForm);
  const [visitForm, setVisitForm] = useState<VisitForm>(initialVisitForm);
  const [visitResultForms, setVisitResultForms] = useState<Record<string, { result: string; nextSteps: string; reason: string }>>({});
  const [confirmArchive, setConfirmArchive] = useState(false);

  const requestedTab = searchParams.get("aba");
  const activeTab: TabId = (TAB_IDS as readonly string[]).includes(requestedTab ?? "") ? (requestedTab as TabId) : "visao-geral";

  function setActiveTab(tab: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("aba", tab);
      return next;
    });
  }

  async function refresh() {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [customerRecord, opportunityList, actionList, activityList, addressList, equipmentList, visitList] = await Promise.all([
        loadCustomer(id),
        loadOpportunitiesByCustomer(id),
        loadNextActions({ customerId: id, status: "pending" }),
        loadCustomerActivities(id),
        loadCustomerAddresses(id),
        loadCustomerEquipment(id),
        loadVisits({ customerId: id }),
      ]);
      setCustomer(customerRecord);
      setOpportunities(opportunityList);
      setNextActions(actionList);
      setActivities(activityList);
      setAddresses(addressList);
      setEquipment(equipmentList);
      setVisits(visitList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o cliente.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading || !customer) {
    return <LoadingPanels />;
  }

  async function handleConfirmArchive() {
    try {
      await archiveCustomer(customer!.id);
      showToast(`${customer!.nome} arquivado.`);
      navigate("/clientes");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível arquivar o cliente.", "error");
      setConfirmArchive(false);
    }
  }

  async function handleRegisterActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activityForm.description.trim()) return;
    setError(null);
    try {
      await createActivity({ customerId: customer!.id, opportunityId: null, type: activityForm.type, description: activityForm.description.trim() });
      setActivityForm({ ...activityForm, description: "" });
      showToast("Atendimento registrado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar a atividade.");
    }
  }

  async function handleCreateAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!actionForm.title.trim() || !actionForm.dueAt) return;
    setError(null);
    try {
      await createNextAction({ customerId: customer!.id, responsibleUserId: currentUserId, category: "support", title: actionForm.title.trim(), dueAt: actionForm.dueAt });
      setActionForm({ title: "", dueAt: "" });
      showToast("Próxima ação criada.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a próxima ação.");
    }
  }

  async function handleCreateAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!addressForm.label.trim()) return;
    setError(null);
    try {
      await createAddress(customer!.id, {
        label: addressForm.label.trim(),
        kind: addressForm.kind,
        street: emptyToNull(addressForm.street),
        number: emptyToNull(addressForm.number),
        neighborhood: emptyToNull(addressForm.neighborhood),
        city: emptyToNull(addressForm.city),
        accessNotes: emptyToNull(addressForm.accessNotes),
        isPrimary: addressForm.isPrimary,
      });
      setAddressForm(initialAddressForm);
      showToast("Endereco criado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel criar o endereco.");
    }
  }

  async function handleCreateEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!equipmentForm.brand.trim() && !equipmentForm.model.trim() && !equipmentForm.environment.trim()) return;
    setError(null);
    try {
      await createEquipment(customer!.id, {
        type: equipmentForm.type,
        brand: emptyToNull(equipmentForm.brand),
        model: emptyToNull(equipmentForm.model),
        btus: equipmentForm.btus.trim() ? Number(equipmentForm.btus) : null,
        voltage: emptyToNull(equipmentForm.voltage),
        environment: emptyToNull(equipmentForm.environment),
        addressId: equipmentForm.addressId || null,
        opportunityId: equipmentForm.opportunityId || null,
        notes: emptyToNull(equipmentForm.notes),
      });
      setEquipmentForm(initialEquipmentForm);
      showToast("Equipamento criado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel criar o equipamento.");
    }
  }

  async function handleCreateVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!visitForm.objective.trim() || !visitForm.scheduledStartAt) return;
    setError(null);
    try {
      await createVisit({
        customerId: customer!.id,
        objective: visitForm.objective.trim(),
        scheduledStartAt: visitForm.scheduledStartAt,
        scheduledEndAt: emptyToNull(visitForm.scheduledEndAt),
        addressId: visitForm.addressId || null,
        opportunityId: visitForm.opportunityId || null,
        equipmentIds: visitForm.equipmentIds,
        accessNotes: emptyToNull(visitForm.accessNotes),
      });
      setVisitForm(initialVisitForm);
      showToast("Visita criada.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel criar a visita.");
    }
  }

  async function handleCompleteVisit(visit: Visit) {
    const form = visitResultForms[visit.id];
    if (!form?.result.trim()) return;
    setError(null);
    try {
      await completeVisit(visit.id, { result: form.result.trim(), nextSteps: emptyToNull(form.nextSteps) });
      showToast("Visita concluida.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel concluir a visita.");
    }
  }

  async function handleCancelVisit(visit: Visit) {
    const form = visitResultForms[visit.id];
    if (!form?.reason.trim()) return;
    setError(null);
    try {
      await cancelVisit(visit.id, form.reason.trim());
      showToast("Visita cancelada.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel cancelar a visita.");
    }
  }

  const supportActivities = activities.filter((activity) => SUPPORT_ACTIVITY_TYPES.includes(activity.type));
  const commercialActivities = activities.filter((activity) => !SUPPORT_ACTIVITY_TYPES.includes(activity.type));
  const nextUpAction = [...nextActions].sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0] ?? null;
  const openVisits = visits.filter((visit) => !["completed", "cancelled", "no_show"].includes(visit.status));
  const activeOpportunities = opportunities.filter((opportunity) => opportunity.status === "ativa");
  const overdueNextAction = nextUpAction ? new Date(nextUpAction.dueAt).getTime() < Date.now() : false;

  const tabs: TabItem[] = [
    {
      id: "visao-geral",
      label: "Visão geral",
      content: (
        <div className="customer-overview">
          <section className="customer-overview-grid" aria-label="Resumo operacional do cliente">
            <article className="customer-overview-card">
              <span className="customer-overview-icon"><BriefcaseBusiness aria-hidden="true" size={18} /></span>
              <div>
                <span>Oportunidades ativas</span>
                <strong>{activeOpportunities.length}</strong>
                <small>{opportunities.length} no historico</small>
              </div>
            </article>
            <article className={`customer-overview-card ${overdueNextAction ? "customer-overview-card-danger" : ""}`}>
              <span className="customer-overview-icon"><ListChecks aria-hidden="true" size={18} /></span>
              <div>
                <span>Proxima acao</span>
                <strong>{nextUpAction ? formatDateTime(nextUpAction.dueAt) : "Sem pendencia"}</strong>
                <small>{nextUpAction?.title ?? "Carteira sem follow-up aberto"}</small>
              </div>
            </article>
            <article className="customer-overview-card">
              <span className="customer-overview-icon"><CalendarClock aria-hidden="true" size={18} /></span>
              <div>
                <span>Visitas abertas</span>
                <strong>{openVisits.length}</strong>
                <small>{visits.length} no historico tecnico</small>
              </div>
            </article>
            <article className={customer.duplicatePhoneCustomerIds.length ? "customer-overview-card customer-overview-card-warning" : "customer-overview-card"}>
              <span className="customer-overview-icon"><ShieldAlert aria-hidden="true" size={18} /></span>
              <div>
                <span>Qualidade do cadastro</span>
                <strong>{customer.duplicatePhoneCustomerIds.length ? "Revisar" : "Ok"}</strong>
                <small>{customer.duplicatePhoneCustomerIds.length ? `${customer.duplicatePhoneCustomerIds.length} possivel duplicidade` : `${equipment.length} equipamento(s)`}</small>
              </div>
            </article>
          </section>
          <section className="panel customer-identity-panel" aria-label="Identidade e contato do cliente">
            <header>
              <div>
                <h2>Identidade e contato</h2>
                <p>{formatCustomerLocation(customer)}</p>
              </div>
              <span className="badge">{customer.tipoPessoa === "fisica" ? "Pessoa fisica" : "Pessoa juridica"}</span>
            </header>
          <dl className="detail-list">
            <div><dt>Tipo</dt><dd>{customer.tipoPessoa === "fisica" ? "Pessoa física" : "Pessoa jurídica"}</dd></div>
            <div><dt>Telefone</dt><dd>{customer.telefone ? <a href={`tel:${customer.telefone}`}><Phone aria-hidden="true" size={14} /> {customer.telefone}</a> : "-"}</dd></div>
            <div><dt>E-mail</dt><dd>{customer.email ? <a href={`mailto:${customer.email}`}><Mail aria-hidden="true" size={14} /> {customer.email}</a> : "-"}</dd></div>
            <div><dt>Empresa</dt><dd>{customer.empresa ?? "-"}</dd></div>
            <div><dt>Cidade</dt><dd>{customer.cidade ?? "-"}</dd></div>
            <div><dt>Bairro</dt><dd>{customer.bairro ?? "-"}</dd></div>
          </dl>
          </section>
          {customer.auvoSignals ? (
            <AuvoSignalSummary
              signals={customer.auvoSignals}
              title="Sinais Auvo do cliente"
              description="Contexto mais recente do atendimento digital vinculado a este cadastro."
            />
          ) : null}
        </div>
      ),
    },
    {
      id: "estrutura",
      label: `Estrutura (${addresses.length + equipment.length + visits.length})`,
      content: (
        <div className="customer-structure-grid">
          <section className="customer-structure-section" aria-label="Enderecos do cliente">
            <header>
              <span className="customer-structure-icon"><MapPin aria-hidden="true" size={18} /></span>
              <div>
                <h2>Enderecos</h2>
                <p>{addresses.length} cadastrado(s)</p>
              </div>
            </header>
            <form className="structure-form" onSubmit={handleCreateAddress}>
              <label>Nome<input value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} placeholder="ex: Apartamento" /></label>
              <label>Tipo
                <select value={addressForm.kind} onChange={(event) => setAddressForm({ ...addressForm, kind: event.target.value as Address["kind"] })}>
                  <option value="service">Atendimento</option>
                  <option value="installation">Instalacao</option>
                  <option value="pickup">Retirada</option>
                  <option value="billing">Cobranca</option>
                  <option value="other">Outro</option>
                </select>
              </label>
              <label>Rua<input value={addressForm.street} onChange={(event) => setAddressForm({ ...addressForm, street: event.target.value })} /></label>
              <label>Numero<input value={addressForm.number} onChange={(event) => setAddressForm({ ...addressForm, number: event.target.value })} /></label>
              <label>Bairro<input value={addressForm.neighborhood} onChange={(event) => setAddressForm({ ...addressForm, neighborhood: event.target.value })} /></label>
              <label>Cidade<input value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} /></label>
              <label className="structure-form-wide">Acesso<input value={addressForm.accessNotes} onChange={(event) => setAddressForm({ ...addressForm, accessNotes: event.target.value })} placeholder="portaria, referencia, restricoes" /></label>
              <label className="checkbox-row"><input type="checkbox" checked={addressForm.isPrimary} onChange={(event) => setAddressForm({ ...addressForm, isPrimary: event.target.checked })} /> Principal</label>
              <button className="button secondary" type="submit"><Plus aria-hidden="true" size={16} /> Endereco</button>
            </form>
            {addresses.length ? (
              <ul className="structure-list">
                {addresses.map((address) => (
                  <li key={address.id}>
                    <strong>{address.label}</strong>
                    <span>{formatAddressKind(address.kind)}{address.isPrimary ? " · Principal" : ""}</span>
                    <small>{formatAddressLine(address)}</small>
                    {address.accessNotes ? <p>{address.accessNotes}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nenhum endereco" text="Cadastre enderecos para visitas, retirada e instalacao." />
            )}
          </section>

          <section className="customer-structure-section" aria-label="Equipamentos do cliente">
            <header>
              <span className="customer-structure-icon"><Snowflake aria-hidden="true" size={18} /></span>
              <div>
                <h2>Equipamentos</h2>
                <p>{equipment.length} cadastrado(s)</p>
              </div>
            </header>
            <form className="structure-form" onSubmit={handleCreateEquipment}>
              <label>Tipo
                <select value={equipmentForm.type} onChange={(event) => setEquipmentForm({ ...equipmentForm, type: event.target.value as Equipment["type"] })}>
                  <option value="split_hi_wall">Split hi-wall</option>
                  <option value="cassette">Cassete</option>
                  <option value="window_ac">Janela / ACJ</option>
                  <option value="floor_ceiling">Piso-teto</option>
                  <option value="multi_split">Multi split</option>
                  <option value="other">Outro</option>
                </select>
              </label>
              <label>Marca<input value={equipmentForm.brand} onChange={(event) => setEquipmentForm({ ...equipmentForm, brand: event.target.value })} /></label>
              <label>Modelo<input value={equipmentForm.model} onChange={(event) => setEquipmentForm({ ...equipmentForm, model: event.target.value })} /></label>
              <label>BTUs<input inputMode="numeric" value={equipmentForm.btus} onChange={(event) => setEquipmentForm({ ...equipmentForm, btus: event.target.value })} /></label>
              <label>Tensao<input value={equipmentForm.voltage} onChange={(event) => setEquipmentForm({ ...equipmentForm, voltage: event.target.value })} placeholder="127V, 220V" /></label>
              <label>Ambiente<input value={equipmentForm.environment} onChange={(event) => setEquipmentForm({ ...equipmentForm, environment: event.target.value })} placeholder="sala, quarto" /></label>
              <label>Endereco
                <select value={equipmentForm.addressId} onChange={(event) => setEquipmentForm({ ...equipmentForm, addressId: event.target.value })}>
                  <option value="">Sem endereco</option>
                  {addresses.map((address) => <option value={address.id} key={address.id}>{address.label}</option>)}
                </select>
              </label>
              <label>Oportunidade
                <select value={equipmentForm.opportunityId} onChange={(event) => setEquipmentForm({ ...equipmentForm, opportunityId: event.target.value })}>
                  <option value="">Historico do cliente</option>
                  {opportunities.map((opportunity) => <option value={opportunity.id} key={opportunity.id}>{opportunity.titulo}</option>)}
                </select>
              </label>
              <label className="structure-form-wide">Notas<input value={equipmentForm.notes} onChange={(event) => setEquipmentForm({ ...equipmentForm, notes: event.target.value })} /></label>
              <button className="button secondary" type="submit"><Plus aria-hidden="true" size={16} /> Equipamento</button>
            </form>
            {equipment.length ? (
              <ul className="structure-list">
                {equipment.map((item) => (
                  <li key={item.id}>
                    <strong>{formatEquipmentTitle(item)}</strong>
                    <span>{formatEquipmentType(item.type)}{item.btus ? ` · ${item.btus.toLocaleString("pt-BR")} BTUs` : ""}</span>
                    <small>{[item.environment, addresses.find((address) => address.id === item.addressId)?.label, opportunities.find((opportunity) => opportunity.id === item.opportunityId)?.titulo].filter(Boolean).join(" · ") || "Sem vinculo adicional"}</small>
                    {item.notes ? <p>{item.notes}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nenhum equipamento" text="Registre aparelhos para suporte, garantia e visitas." />
            )}
          </section>

          <section className="customer-structure-section customer-structure-section-wide" aria-label="Visitas do cliente">
            <header>
              <span className="customer-structure-icon"><CalendarClock aria-hidden="true" size={18} /></span>
              <div>
                <h2>Visitas</h2>
                <p>{openVisits.length} aberta(s)</p>
              </div>
            </header>
            <form className="structure-form structure-form-visits" onSubmit={handleCreateVisit}>
              <label>Objetivo<input value={visitForm.objective} onChange={(event) => setVisitForm({ ...visitForm, objective: event.target.value })} placeholder="ex: vistoria para instalacao" /></label>
              <label>Inicio<input type="datetime-local" value={visitForm.scheduledStartAt} onChange={(event) => setVisitForm({ ...visitForm, scheduledStartAt: event.target.value })} /></label>
              <label>Fim<input type="datetime-local" value={visitForm.scheduledEndAt} onChange={(event) => setVisitForm({ ...visitForm, scheduledEndAt: event.target.value })} /></label>
              <label>Endereco
                <select value={visitForm.addressId} onChange={(event) => setVisitForm({ ...visitForm, addressId: event.target.value })}>
                  <option value="">Sem endereco</option>
                  {addresses.map((address) => <option value={address.id} key={address.id}>{address.label}</option>)}
                </select>
              </label>
              <label>Oportunidade
                <select value={visitForm.opportunityId} onChange={(event) => setVisitForm({ ...visitForm, opportunityId: event.target.value })}>
                  <option value="">Sem oportunidade</option>
                  {opportunities.map((opportunity) => <option value={opportunity.id} key={opportunity.id}>{opportunity.titulo}</option>)}
                </select>
              </label>
              <label>Equipamentos
                <select multiple value={visitForm.equipmentIds} onChange={(event) => setVisitForm({ ...visitForm, equipmentIds: Array.from(event.currentTarget.selectedOptions).map((option) => option.value) })}>
                  {equipment.map((item) => <option value={item.id} key={item.id}>{formatEquipmentTitle(item)}</option>)}
                </select>
              </label>
              <label className="structure-form-wide">Acesso<input value={visitForm.accessNotes} onChange={(event) => setVisitForm({ ...visitForm, accessNotes: event.target.value })} /></label>
              <button className="button secondary" type="submit"><Plus aria-hidden="true" size={16} /> Visita</button>
            </form>
            {visits.length ? (
              <ul className="structure-list visit-list">
                {visits.map((visit) => {
                  const resultForm = visitResultForms[visit.id] ?? { result: "", nextSteps: "", reason: "" };
                  return (
                    <li key={visit.id}>
                      <div className="visit-list-main">
                        <strong>{visit.objective}</strong>
                        <span>{formatDateTime(visit.scheduledStartAt)} · {formatVisitStatus(visit.status)}</span>
                        <small>{[addresses.find((address) => address.id === visit.addressId)?.label, opportunities.find((opportunity) => opportunity.id === visit.opportunityId)?.titulo].filter(Boolean).join(" · ") || "Sem endereco/oportunidade"}</small>
                        {visit.result ? <p>{visit.result}</p> : null}
                      </div>
                      {!["completed", "cancelled", "no_show"].includes(visit.status) ? (
                        <div className="visit-result-controls">
                          <input value={resultForm.result} onChange={(event) => setVisitResultForms({ ...visitResultForms, [visit.id]: { ...resultForm, result: event.target.value } })} placeholder="Resultado da visita" />
                          <input value={resultForm.nextSteps} onChange={(event) => setVisitResultForms({ ...visitResultForms, [visit.id]: { ...resultForm, nextSteps: event.target.value } })} placeholder="Proximos passos" />
                          <button className="button secondary" type="button" onClick={() => void handleCompleteVisit(visit)}><CheckCircle2 aria-hidden="true" size={16} /> Concluir</button>
                          <input value={resultForm.reason} onChange={(event) => setVisitResultForms({ ...visitResultForms, [visit.id]: { ...resultForm, reason: event.target.value } })} placeholder="Motivo do cancelamento" />
                          <button className="button ghost" type="button" onClick={() => void handleCancelVisit(visit)}><XCircle aria-hidden="true" size={16} /> Cancelar</button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="Nenhuma visita" text="Agende visitas tecnicas sem depender de texto livre em proximas acoes." />
            )}
          </section>
        </div>
      ),
    },
    {
      id: "oportunidades",
      label: `Oportunidades (${opportunities.length})`,
      content: opportunities.length ? (
        <div className="table-wrap mobile-cards">
          <table>
            <thead><tr><th>Título</th><th>Etapa</th><th>Situação</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id}>
                  <td data-label="Título">{opportunity.titulo}</td>
                  <td data-label="Etapa">{opportunity.etapaNome}</td>
                  <td data-label="Situação">{opportunity.situacao}</td>
                  <td data-label="Status"><span className={`badge ${opportunityStatusBadgeClass(opportunity.status)}`}>{formatOpportunityStatus(opportunity.status)}</span></td>
                  <td className="actions-cell"><Link className="button secondary" to={`/oportunidades/${opportunity.id}`}>Abrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Nenhuma oportunidade" text="Este cliente ainda não tem oportunidades comerciais registradas." />
      ),
    },
    {
      id: "proximas-acoes",
      label: `Próximas ações (${nextActions.length})`,
      content: (
        <>
          <form className="admin-inline-form" onSubmit={handleCreateAction}>
            <label>Nova ação de atendimento<input value={actionForm.title} onChange={(event) => setActionForm({ ...actionForm, title: event.target.value })} placeholder="ex: retornar sobre garantia" /></label>
            <label>Data<input type="datetime-local" value={actionForm.dueAt} onChange={(event) => setActionForm({ ...actionForm, dueAt: event.target.value })} /></label>
            <button className="button secondary" type="submit">Criar</button>
          </form>
          {nextActions.length ? (
            <ul className="work-list">
              {nextActions.map((action) => (
                <li key={action.id}>
                  <div>
                    <strong>{action.title}</strong>
                    <span>{action.opportunityTitle ?? "Atendimento"}</span>
                    <small>{formatDateTime(action.dueAt)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhuma ação pendente" text="Crie uma ação para acompanhar este cliente." />
          )}
        </>
      ),
    },
    {
      id: "garantia-suporte",
      label: "Garantia e suporte",
      content: (
        <>
          <form className="admin-inline-form" onSubmit={handleRegisterActivity}>
            <label>Tipo
              <select value={activityForm.type} onChange={(event) => setActivityForm({ ...activityForm, type: event.target.value as Activity["type"] })}>
                <option value="warranty">Garantia</option>
                <option value="support">Suporte</option>
                <option value="after_sales">Pós-venda</option>
              </select>
            </label>
            <label>Descrição<input value={activityForm.description} onChange={(event) => setActivityForm({ ...activityForm, description: event.target.value })} placeholder="Descreva o atendimento" /></label>
            <button className="button secondary" type="submit">Registrar</button>
          </form>
          {supportActivities.length ? (
            <ol className="timeline-list">
              {supportActivities.map((activity) => (
                <li key={activity.id}>
                  <strong>{formatActivityType(activity.type)}</strong>
                  <span>{formatDateTime(activity.occurredAt)}</span>
                  <p>{activity.description}</p>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="Nenhum registro de garantia, suporte ou pós-venda" text="Registre um atendimento técnico quando ocorrer." />
          )}
        </>
      ),
    },
    {
      id: "linha-do-tempo",
      label: "Linha do tempo",
      content: commercialActivities.length ? (
        <ol className="timeline-list">
          {commercialActivities.map((activity) => (
            <li key={activity.id}>
              <strong>{formatActivityType(activity.type)}</strong>
              <span>{formatDateTime(activity.occurredAt)}</span>
              <p>{activity.description}</p>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="Nenhuma atividade comercial" text="O histórico comercial aparece aqui conforme as oportunidades avançam." />
      ),
    },
  ];

  return (
    <>
      <section className="page-heading">
        <div className="cell-with-avatar">
          <Avatar name={customer.nome} />
          <div>
            <p className="eyebrow"><Link to="/clientes">Clientes</Link> / {customer.nome}</p>
            <h1>{customer.nome}</h1>
          </div>
        </div>
        <div className="quick-actions">
          {customer.telefone ? (
            <a className="button secondary" href={`tel:${customer.telefone}`}>
              <Phone aria-hidden="true" size={16} /> Ligar
            </a>
          ) : null}
          {customer.email ? (
            <a className="button secondary" href={`mailto:${customer.email}`}>
              <Mail aria-hidden="true" size={16} /> E-mail
            </a>
          ) : null}
          <button className="button ghost" type="button" onClick={() => setConfirmArchive(true)}>Arquivar</button>
        </div>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {customer.duplicatePhoneCustomerIds.length ? (
        <div className="alert" role="status">Este telefone também aparece em {customer.duplicatePhoneCustomerIds.length} outro(s) cadastro(s) — verifique possível duplicidade.</div>
      ) : null}

      <div className="alert" role="status">
        {nextUpAction ? (
          <>Próxima ação: <strong>{nextUpAction.title}</strong> — {formatDateTime(nextUpAction.dueAt)}</>
        ) : (
          "Nenhuma ação pendente para este cliente."
        )}
      </div>

      <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />

      {confirmArchive ? (
        <ConfirmDialog
          title="Arquivar cliente"
          message={`Arquivar ${customer.nome}? O histórico será preservado.`}
          confirmLabel="Arquivar"
          onConfirm={() => void handleConfirmArchive()}
          onCancel={() => setConfirmArchive(false)}
        />
      ) : null}
    </>
  );
}

function emptyToNull(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function formatAddressLine(address: Address): string {
  const street = [address.street, address.number].filter(Boolean).join(", ");
  return [street, address.neighborhood, address.city].filter(Boolean).join(" · ") || "Endereco progressivo";
}

function formatEquipmentTitle(equipment: Equipment): string {
  const title = [equipment.brand, equipment.model].filter(Boolean).join(" ");
  return title || equipment.environment || formatEquipmentType(equipment.type);
}

function formatCustomerLocation(customer: Customer): string {
  return [customer.bairro, customer.cidade].filter(Boolean).join(" - ") || "Localizacao ainda nao informada";
}
