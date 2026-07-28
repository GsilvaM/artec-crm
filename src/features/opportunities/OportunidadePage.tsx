import { type FormEvent, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, ClipboardList, MapPin, Plus, Snowflake, XCircle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { QuotesPanel } from "../../components/QuotesPanel";
import { AuvoSignalSummary } from "../../components/AuvoSignalSummary";
import { formatActivityType, formatAddressKind, formatDateTime, formatEquipmentType, formatMoney, formatOpportunityStatus, formatVisitStatus, opportunityStatusBadgeClass } from "../../domain/format";
import {
  approveOpportunity,
  archiveOpportunity,
  cancelVisit,
  createActivity,
  createAddress,
  createEquipment,
  createQuote,
  createVisit,
  completeVisit,
  loadAdminUsers,
  loadCustomerAddresses,
  loadLossReasons,
  loadNextAction,
  loadOpportunity,
  loadOpportunityActivities,
  loadOpportunityEquipment,
  loadOpportunityQuotes,
  loadPipelineStages,
  loadVisits,
  loseOpportunity,
  updateOpportunity,
  updateQuote,
  type Address,
  type Activity,
  type Equipment,
  type LossReason,
  type MembershipCandidate,
  type NextAction,
  type Opportunity,
  type PipelineStage,
  type Quote,
  type QuoteStatus,
  type Visit,
} from "../../domain/crm";
import { useActionOperation } from "../next-actions/useActionOperation";
import { ActionOperationForm } from "../next-actions/ActionOperationForm";

type OpportunityAddressForm = { label: string; kind: Address["kind"]; street: string; number: string; neighborhood: string; city: string; accessNotes: string };
type OpportunityEquipmentForm = { type: Equipment["type"]; brand: string; model: string; btus: string; voltage: string; environment: string; addressId: string; notes: string };
type OpportunityVisitForm = { objective: string; scheduledStartAt: string; scheduledEndAt: string; addressId: string; equipmentIds: string[]; accessNotes: string };

const initialAddressForm: OpportunityAddressForm = { label: "", kind: "service", street: "", number: "", neighborhood: "", city: "", accessNotes: "" };
const initialEquipmentForm: OpportunityEquipmentForm = { type: "split_hi_wall", brand: "", model: "", btus: "", voltage: "", environment: "", addressId: "", notes: "" };
const initialVisitForm: OpportunityVisitForm = { objective: "", scheduledStartAt: "", scheduledEndAt: "", addressId: "", equipmentIds: [], accessNotes: "" };

export function OportunidadePage({ currentUserId, canManageUsers }: { currentUserId: string; canManageUsers: boolean }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [currentNextAction, setCurrentNextAction] = useState<NextAction | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [lossReasons, setLossReasons] = useState<LossReason[]>([]);
  const [members, setMembers] = useState<MembershipCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"approve" | "lose" | null>(null);
  const [approveForm, setApproveForm] = useState({ valorAprovado: "", formaPagamento: "a vista", quantidadeParcelas: "1", previsaoExecucao: "" });
  const [lossReasonId, setLossReasonId] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [addressForm, setAddressForm] = useState<OpportunityAddressForm>(initialAddressForm);
  const [equipmentForm, setEquipmentForm] = useState<OpportunityEquipmentForm>(initialEquipmentForm);
  const [visitForm, setVisitForm] = useState<OpportunityVisitForm>(initialVisitForm);
  const [visitResultForms, setVisitResultForms] = useState<Record<string, { result: string; nextSteps: string; reason: string }>>({});
  const [confirmArchive, setConfirmArchive] = useState(false);

  async function refresh() {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [opportunityRecord, activityList, quoteList, stageList, lossReasonList] = await Promise.all([
        loadOpportunity(id),
        loadOpportunityActivities(id),
        loadOpportunityQuotes(id),
        loadPipelineStages(),
        loadLossReasons(),
      ]);
      setOpportunity(opportunityRecord);
      setActivities(activityList);
      setQuotes(quoteList);
      setStages(stageList);
      setLossReasons(lossReasonList);
      setLossReasonId((current) => current || lossReasonList[0]?.id || "");
      setCurrentNextAction(opportunityRecord.currentNextActionId ? await loadNextAction(opportunityRecord.currentNextActionId).catch(() => null) : null);
      const [addressList, equipmentList, visitList] = await Promise.all([
        loadCustomerAddresses(opportunityRecord.clienteId),
        loadOpportunityEquipment(opportunityRecord.id),
        loadVisits({ opportunityId: opportunityRecord.id }),
      ]);
      setAddresses(addressList);
      setEquipment(equipmentList);
      setVisits(visitList);
      if (canManageUsers) setMembers(await loadAdminUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a oportunidade.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const actionOperation = useActionOperation(currentUserId, refresh);

  if (isLoading || !opportunity) {
    return <LoadingPanels />;
  }

  async function handleStageChange(etapaId: string) {
    setError(null);
    try {
      await updateOpportunity(opportunity!.id, { etapaId });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível mover a oportunidade de etapa.");
    }
  }

  async function handleReassign(responsavelId: string) {
    setError(null);
    try {
      await updateOpportunity(opportunity!.id, { responsavelId });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível reatribuir a oportunidade.");
    }
  }

  async function handleApproveSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await approveOpportunity(opportunity!.id, {
        valorAprovado: Math.round(Number(approveForm.valorAprovado.replace(",", ".")) * 100),
        formaPagamento: approveForm.formaPagamento,
        quantidadeParcelas: Number(approveForm.quantidadeParcelas),
        previsaoExecucao: approveForm.previsaoExecucao,
      });
      setMode(null);
      showToast("Orçamento aprovado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível aprovar a oportunidade.");
    }
  }

  async function handleLoseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await loseOpportunity(opportunity!.id, lossReasonId);
      setMode(null);
      showToast("Oportunidade marcada como perdida.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível marcar a oportunidade como perdida.");
    }
  }

  async function handleConfirmArchive() {
    try {
      await archiveOpportunity(opportunity!.id);
      showToast(`${opportunity!.titulo} arquivada.`);
      navigate("/oportunidades");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível arquivar a oportunidade.", "error");
      setConfirmArchive(false);
    }
  }

  async function handleRegisterActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activityDescription.trim()) return;
    setError(null);
    try {
      await createActivity({ customerId: opportunity!.clienteId, opportunityId: opportunity!.id, type: "note", description: activityDescription.trim() });
      setActivityDescription("");
      showToast("Atividade registrada.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar a atividade.");
    }
  }

  async function handleCreateQuote(valorReais: string, resumo: string) {
    const valor = Math.round(Number(valorReais.replace(",", ".")) * 100);
    if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe um valor válido para o orçamento.");
    await createQuote(opportunity!.id, { valor, resumo: resumo.trim() || undefined });
    setQuotes(await loadOpportunityQuotes(opportunity!.id));
  }

  async function handleUpdateQuoteStatus(quote: Quote, status: QuoteStatus) {
    await updateQuote(quote.id, { status });
    setQuotes(await loadOpportunityQuotes(opportunity!.id));
  }

  async function handleCreateAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!addressForm.label.trim()) return;
    setError(null);
    try {
      await createAddress(opportunity!.clienteId, {
        label: addressForm.label.trim(),
        kind: addressForm.kind,
        street: emptyToNull(addressForm.street),
        number: emptyToNull(addressForm.number),
        neighborhood: emptyToNull(addressForm.neighborhood),
        city: emptyToNull(addressForm.city),
        accessNotes: emptyToNull(addressForm.accessNotes),
      });
      setAddressForm(initialAddressForm);
      showToast("Endereço criado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o endereço.");
    }
  }

  async function handleCreateEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!equipmentForm.brand.trim() && !equipmentForm.model.trim() && !equipmentForm.environment.trim()) return;
    setError(null);
    try {
      await createEquipment(opportunity!.clienteId, {
        opportunityId: opportunity!.id,
        type: equipmentForm.type,
        brand: emptyToNull(equipmentForm.brand),
        model: emptyToNull(equipmentForm.model),
        btus: equipmentForm.btus.trim() ? Number(equipmentForm.btus) : null,
        voltage: emptyToNull(equipmentForm.voltage),
        environment: emptyToNull(equipmentForm.environment),
        addressId: equipmentForm.addressId || null,
        notes: emptyToNull(equipmentForm.notes),
      });
      setEquipmentForm(initialEquipmentForm);
      showToast("Equipamento vinculado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o equipamento.");
    }
  }

  async function handleCreateVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!visitForm.objective.trim() || !visitForm.scheduledStartAt) return;
    setError(null);
    try {
      await createVisit({
        customerId: opportunity!.clienteId,
        opportunityId: opportunity!.id,
        objective: visitForm.objective.trim(),
        scheduledStartAt: visitForm.scheduledStartAt,
        scheduledEndAt: emptyToNull(visitForm.scheduledEndAt),
        addressId: visitForm.addressId || null,
        equipmentIds: visitForm.equipmentIds,
        accessNotes: emptyToNull(visitForm.accessNotes),
      });
      setVisitForm(initialVisitForm);
      showToast("Visita criada.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a visita.");
    }
  }

  async function handleCompleteVisit(visit: Visit) {
    const form = visitResultForms[visit.id];
    if (!form?.result.trim()) return;
    setError(null);
    try {
      await completeVisit(visit.id, { result: form.result.trim(), nextSteps: emptyToNull(form.nextSteps) });
      showToast("Visita concluída.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a visita.");
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
      setError(err instanceof Error ? err.message : "Não foi possível cancelar a visita.");
    }
  }

  const isOverdueAction = currentNextAction && currentNextAction.status === "pending" && new Date(currentNextAction.dueAt).getTime() < Date.now();
  const isActive = opportunity.status === "ativa";
  const openVisits = visits.filter((visit) => !["completed", "cancelled", "no_show"].includes(visit.status));
  const nextActionState = getNextActionState(opportunity, currentNextAction);
  const latestQuote = quotes[0] ?? null;
  const latestActivity = activities[0] ?? null;
  const decisionState = getOpportunityDecisionState(opportunity, currentNextAction, latestQuote, openVisits);
  const opportunitySignals = [
    { label: "Etapa", value: opportunity.etapaNome },
    { label: "Orçamento", value: latestQuote ? `${formatMoney(latestQuote.valor)} - ${formatQuoteStatus(latestQuote.status)}` : "Sem orçamento" },
    { label: "Visitas abertas", value: String(openVisits.length) },
    { label: "Última interação", value: latestActivity ? formatDateTime(latestActivity.occurredAt) : "Sem histórico" },
  ];

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">
            <Link to="/oportunidades">Oportunidades</Link> / {opportunity.titulo}
          </p>
          <h1>{opportunity.titulo}</h1>
        </div>
        <span className={`badge ${opportunityStatusBadgeClass(opportunity.status)}`}>{formatOpportunityStatus(opportunity.status)}</span>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      <section id="resumo-oportunidade" className="panel opportunity-control-panel" aria-label="Resumo da oportunidade">
        <div className={`opportunity-next-action-card ${nextActionState.tone}`}>
          <div className="opportunity-next-action-icon">
            <CalendarClock aria-hidden="true" />
          </div>
          <div className="opportunity-next-action-main">
            <span>{nextActionState.label}</span>
            <strong>{nextActionState.title}</strong>
            <p>{nextActionState.detail}</p>
          </div>
          <span className={`badge ${nextActionState.badgeClass}`}>{nextActionState.badge}</span>
        </div>

        <section className={`opportunity-decision-panel ${decisionState.tone}`} aria-label="Próxima decisão da oportunidade">
          <div>
            <span>{decisionState.label}</span>
            <strong>{decisionState.title}</strong>
            <p>{decisionState.detail}</p>
          </div>
          <a className="button secondary" href={decisionState.href}>{decisionState.actionLabel}</a>
        </section>

        <aside className="opportunity-health-panel" aria-label="Higiene da oportunidade">
          <header>
            <ClipboardList aria-hidden="true" />
            <h2>Higiene operacional</h2>
          </header>
          <ul>
            {opportunitySignals.map((signal) => (
              <li key={signal.label}>
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
              </li>
            ))}
          </ul>
        </aside>

        <dl className="detail-list">
          <div><dt>Cliente</dt><dd><Link to={`/clientes/${opportunity.clienteId}`}>{opportunity.clienteNome}</Link></dd></div>
          <div><dt>Demanda</dt><dd>{opportunity.tipoDemanda}</dd></div>
          <div>
            <dt>Etapa</dt>
            <dd>
              <select aria-label="Etapa da oportunidade" value={opportunity.etapaId} disabled={!isActive} onChange={(event) => void handleStageChange(event.target.value)}>
                {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.nome}</option>)}
              </select>
            </dd>
          </div>
          <div><dt>Situação</dt><dd>{opportunity.situacao}</dd></div>
          <div>
            <dt>Responsável</dt>
            <dd>
              {canManageUsers ? (
                <select aria-label="Responsável pela oportunidade" value={opportunity.responsavelId} onChange={(event) => void handleReassign(event.target.value)}>
                  {members.map((member) => <option key={member.userId} value={member.userId}>{member.email ?? member.userId.slice(0, 8)}</option>)}
                </select>
              ) : (
                `Usuário ${opportunity.responsavelId.slice(0, 8)}`
              )}
            </dd>
          </div>
          <div>
            <dt>Próxima ação</dt>
            <dd>
              {currentNextAction ? (
                <>
                  {currentNextAction.title} - {formatDateTime(currentNextAction.dueAt)}
                  {isOverdueAction ? <span className="badge badge-alert-danger">vencida</span> : null}
                </>
              ) : opportunity.proximaAcao ? (
                `${opportunity.proximaAcao} - ${formatDateTime(opportunity.proximaAcaoEm)}`
              ) : (
                <span className="badge badge-alert-danger">sem próxima ação</span>
              )}
            </dd>
          </div>
          <div><dt>Valor estimado</dt><dd>{opportunity.valorEstimado ? formatMoney(opportunity.valorEstimado) : "-"}</dd></div>
          <div><dt>Valor orçamento</dt><dd>{opportunity.valorOrcamento ? formatMoney(opportunity.valorOrcamento) : "-"}</dd></div>
          {opportunity.status === "ganha" ? <div><dt>Valor aprovado</dt><dd>{formatMoney(opportunity.valorAprovado ?? 0)}</dd></div> : null}
          {opportunity.status === "perdida" ? <div><dt>Motivo da perda</dt><dd>{opportunity.motivoPerdaNome ?? "-"}</dd></div> : null}
        </dl>

        {opportunity.auvoSignals ? (
          <div className="opportunity-auvo-context">
            <AuvoSignalSummary
              signals={opportunity.auvoSignals}
              compact
              title="Sinais Auvo no contexto comercial"
              description="Leitura operacional usada como apoio para prioridade, abordagem e próxima ação."
            />
          </div>
        ) : null}

        <div className="quick-actions">
          {currentNextAction ? (
            <>
              <button className="button secondary" type="button" onClick={() => void actionOperation.open({ id: currentNextAction.id, customerId: currentNextAction.customerId, customerName: currentNextAction.customerName, opportunityId: currentNextAction.opportunityId, category: currentNextAction.category, dueAt: currentNextAction.dueAt }, "complete")}>Concluir ação</button>
              <button className="button secondary" type="button" onClick={() => void actionOperation.open({ id: currentNextAction.id, customerId: currentNextAction.customerId, customerName: currentNextAction.customerName, opportunityId: currentNextAction.opportunityId, category: currentNextAction.category, dueAt: currentNextAction.dueAt }, "postpone")}>Reagendar</button>
            </>
          ) : null}
          {isActive ? (
            <>
              <button className="button primary" type="button" onClick={() => setMode("approve")}>Aprovar orçamento</button>
              <button className="button destructive" type="button" onClick={() => setMode("lose")}>Marcar como perdido</button>
            </>
          ) : null}
          <button className="button ghost" type="button" onClick={() => setConfirmArchive(true)}>Arquivar</button>
        </div>
      </section>

      {actionOperation.operation ? (
        <ActionOperationForm
          operation={actionOperation.operation}
          error={actionOperation.error}
          onChange={actionOperation.update}
          onSubmit={() => void actionOperation.submit()}
          onCancel={actionOperation.close}
        />
      ) : null}

      {mode === "approve" ? (
        <form className="panel compact-form" onSubmit={handleApproveSubmit}>
          <h3>Aprovar orçamento</h3>
          <label>Valor aprovado (R$)<input required type="number" min="0.01" step="0.01" value={approveForm.valorAprovado} onChange={(event) => setApproveForm({ ...approveForm, valorAprovado: event.target.value })} /></label>
          <label>Forma de pagamento
            <select value={approveForm.formaPagamento} onChange={(event) => {
              const formaPagamento = event.target.value;
              setApproveForm({ ...approveForm, formaPagamento, quantidadeParcelas: formaPagamento === "a vista" ? "1" : approveForm.quantidadeParcelas });
            }}>
              <option value="a vista">À vista</option>
              <option value="parcelado">Parcelado</option>
            </select>
          </label>
          {approveForm.formaPagamento !== "a vista" ? (
            <label>Quantidade de parcelas<input required type="number" min="1" step="1" value={approveForm.quantidadeParcelas} onChange={(event) => setApproveForm({ ...approveForm, quantidadeParcelas: event.target.value })} /></label>
          ) : null}
          <label>Previsão de execução<input required type="date" value={approveForm.previsaoExecucao} onChange={(event) => setApproveForm({ ...approveForm, previsaoExecucao: event.target.value })} /></label>
          <div className="form-actions">
            <button className="button primary" type="submit">Confirmar aprovação</button>
            <button className="button secondary" type="button" onClick={() => setMode(null)}>Cancelar</button>
          </div>
        </form>
      ) : null}

      {mode === "lose" ? (
        <form className="panel compact-form" onSubmit={handleLoseSubmit}>
          <h3>Marcar como perdido</h3>
          <label>Motivo
            <select required value={lossReasonId} onChange={(event) => setLossReasonId(event.target.value)}>
              {lossReasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.nome}</option>)}
            </select>
          </label>
          <div className="form-actions">
            <button className="button destructive" type="submit">Confirmar perda</button>
            <button className="button secondary" type="button" onClick={() => setMode(null)}>Cancelar</button>
          </div>
        </form>
      ) : null}

      <section id="estrutura-tecnica" className="opportunity-structure" aria-label="Estrutura técnica da oportunidade">
        <header>
          <div>
            <h2>Visita técnica e equipamentos</h2>
            <p>Endereço, aparelhos e agenda vinculados ao contexto comercial.</p>
          </div>
          <span className="badge badge-informative">{openVisits.length} visita(s) aberta(s)</span>
        </header>

        <div className="customer-structure-grid">
          <section className="customer-structure-section" aria-label="Endereços do cliente na oportunidade">
            <header>
              <span className="customer-structure-icon"><MapPin aria-hidden="true" size={18} /></span>
              <div>
                <h2>Endereços do cliente</h2>
                <p>{addresses.length} disponível(is)</p>
              </div>
            </header>
            <form className="structure-form" onSubmit={handleCreateAddress}>
              <label>Nome<input value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} placeholder="ex: Local da instalação" /></label>
              <label>Tipo
                <select value={addressForm.kind} onChange={(event) => setAddressForm({ ...addressForm, kind: event.target.value as Address["kind"] })}>
                  <option value="service">Atendimento</option>
                  <option value="installation">Instalação</option>
                  <option value="pickup">Retirada</option>
                  <option value="billing">Cobrança</option>
                  <option value="other">Outro</option>
                </select>
              </label>
              <label>Rua<input value={addressForm.street} onChange={(event) => setAddressForm({ ...addressForm, street: event.target.value })} /></label>
              <label>Numero<input value={addressForm.number} onChange={(event) => setAddressForm({ ...addressForm, number: event.target.value })} /></label>
              <label>Bairro<input value={addressForm.neighborhood} onChange={(event) => setAddressForm({ ...addressForm, neighborhood: event.target.value })} /></label>
              <label>Cidade<input value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} /></label>
              <label className="structure-form-wide">Acesso<input value={addressForm.accessNotes} onChange={(event) => setAddressForm({ ...addressForm, accessNotes: event.target.value })} /></label>
              <button className="button secondary" type="submit"><Plus aria-hidden="true" size={16} /> Endereço</button>
            </form>
            {addresses.length ? (
              <ul className="structure-list">
                {addresses.map((address) => (
                  <li key={address.id}>
                    <strong>{address.label}</strong>
                    <span>{formatAddressKind(address.kind)}{address.isPrimary ? " · Principal" : ""}</span>
                    <small>{formatAddressLine(address)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nenhum endereço" text="Cadastre o local de visita, retirada ou instalação." />
            )}
          </section>

          <section className="customer-structure-section" aria-label="Equipamentos da oportunidade">
            <header>
              <span className="customer-structure-icon"><Snowflake aria-hidden="true" size={18} /></span>
              <div>
                <h2>Equipamentos</h2>
                <p>{equipment.length} vinculado(s)</p>
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
              <label>Tensão<input value={equipmentForm.voltage} onChange={(event) => setEquipmentForm({ ...equipmentForm, voltage: event.target.value })} /></label>
              <label>Ambiente<input value={equipmentForm.environment} onChange={(event) => setEquipmentForm({ ...equipmentForm, environment: event.target.value })} /></label>
              <label>Endereço
                <select value={equipmentForm.addressId} onChange={(event) => setEquipmentForm({ ...equipmentForm, addressId: event.target.value })}>
                  <option value="">Sem endereço</option>
                  {addresses.map((address) => <option value={address.id} key={address.id}>{address.label}</option>)}
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
                    <small>{[item.environment, addresses.find((address) => address.id === item.addressId)?.label].filter(Boolean).join(" · ") || "Vinculado a esta oportunidade"}</small>
                    {item.notes ? <p>{item.notes}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nenhum equipamento" text="Vincule aparelhos a esta oportunidade." />
            )}
          </section>

          <section className="customer-structure-section customer-structure-section-wide" aria-label="Visitas da oportunidade">
            <header>
              <span className="customer-structure-icon"><CalendarClock aria-hidden="true" size={18} /></span>
              <div>
                <h2>Visitas</h2>
                <p>{visits.length} registrada(s)</p>
              </div>
            </header>
            <form className="structure-form structure-form-visits" onSubmit={handleCreateVisit}>
              <label>Objetivo<input value={visitForm.objective} onChange={(event) => setVisitForm({ ...visitForm, objective: event.target.value })} placeholder="ex: vistoria para orçamento" /></label>
              <label>Início<input type="datetime-local" value={visitForm.scheduledStartAt} onChange={(event) => setVisitForm({ ...visitForm, scheduledStartAt: event.target.value })} /></label>
              <label>Fim<input type="datetime-local" value={visitForm.scheduledEndAt} onChange={(event) => setVisitForm({ ...visitForm, scheduledEndAt: event.target.value })} /></label>
              <label>Endereço
                <select value={visitForm.addressId} onChange={(event) => setVisitForm({ ...visitForm, addressId: event.target.value })}>
                  <option value="">Sem endereço</option>
                  {addresses.map((address) => <option value={address.id} key={address.id}>{address.label}</option>)}
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
                        <small>{addresses.find((address) => address.id === visit.addressId)?.label ?? "Sem endereço"}</small>
                        {visit.result ? <p>{visit.result}</p> : null}
                      </div>
                      {!["completed", "cancelled", "no_show"].includes(visit.status) ? (
                        <div className="visit-result-controls">
                          <input value={resultForm.result} onChange={(event) => setVisitResultForms({ ...visitResultForms, [visit.id]: { ...resultForm, result: event.target.value } })} placeholder="Resultado da visita" />
                          <input value={resultForm.nextSteps} onChange={(event) => setVisitResultForms({ ...visitResultForms, [visit.id]: { ...resultForm, nextSteps: event.target.value } })} placeholder="Próximos passos" />
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
              <EmptyState title="Nenhuma visita" text="Agende uma visita técnica para tirar medidas, confirmar acesso ou validar instalação." />
            )}
          </section>
        </div>
      </section>

      <div id="orcamentos">
        <QuotesPanel opportunity={opportunity} quotes={quotes} onCreate={handleCreateQuote} onUpdateStatus={handleUpdateQuoteStatus} />
      </div>

      <section id="linha-do-tempo" className="data-section timeline-section">
        <h2>Linha do tempo</h2>
        <form className="admin-inline-form" onSubmit={handleRegisterActivity}>
          <label>Registrar atividade<input value={activityDescription} onChange={(event) => setActivityDescription(event.target.value)} placeholder="Descreva o que aconteceu" /></label>
          <button className="button secondary" type="submit">Registrar</button>
        </form>
        {activities.length ? (
          <ol className="timeline-list">
            {activities.map((activity) => (
              <li key={activity.id}>
                <strong>{formatActivityType(activity.type)}</strong>
                <span>{formatDateTime(activity.occurredAt)}</span>
                <p>{activity.description}</p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="Nenhuma atividade registrada" text="Registre a primeira interação com esta oportunidade." />
        )}
      </section>

      {confirmArchive ? (
        <ConfirmDialog
          title="Arquivar oportunidade"
          message={`Arquivar ${opportunity.titulo}? O histórico será preservado.`}
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
  return [street, address.neighborhood, address.city].filter(Boolean).join(" · ") || "Endereço progressivo";
}

function formatEquipmentTitle(equipment: Equipment): string {
  const title = [equipment.brand, equipment.model].filter(Boolean).join(" ");
  return title || equipment.environment || formatEquipmentType(equipment.type);
}

function getOpportunityDecisionState(
  opportunity: Opportunity,
  currentNextAction: NextAction | null,
  latestQuote: Quote | null,
  openVisits: Visit[],
): {
  label: string;
  title: string;
  detail: string;
  actionLabel: string;
  href: string;
  tone: string;
} {
  const title = currentNextAction?.title ?? opportunity.proximaAcao;
  const dueAt = currentNextAction?.dueAt ?? opportunity.proximaAcaoEm;
  const isActive = opportunity.status === "ativa";
  const dueTime = dueAt ? new Date(dueAt).getTime() : Number.NaN;

  if (isActive && (!title || !dueAt)) {
    return {
      label: "Decisão agora",
      title: "Definir follow-up",
      detail: "A oportunidade está ativa, mas sem compromisso claro para o cliente.",
      actionLabel: "Registrar atividade",
      href: "#linha-do-tempo",
      tone: "is-danger",
    };
  }

  if (isActive && Number.isFinite(dueTime) && dueTime < Date.now()) {
    return {
      label: "Decisão agora",
      title: "Resolver ação vencida",
      detail: `${title} estava previsto para ${formatDateTime(dueAt!)}.`,
      actionLabel: "Concluir ou reagendar",
      href: "#resumo-oportunidade",
      tone: "is-danger",
    };
  }

  if (openVisits.length > 0) {
    const nextVisit = [...openVisits].sort((left, right) => left.scheduledStartAt.localeCompare(right.scheduledStartAt))[0];
    return {
      label: "Próxima decisão",
      title: "Acompanhar visita técnica",
      detail: `${nextVisit.objective} - ${formatDateTime(nextVisit.scheduledStartAt)}.`,
      actionLabel: "Ver visitas",
      href: "#estrutura-tecnica",
      tone: "is-warning",
    };
  }

  if (latestQuote && ["enviado", "revisado"].includes(latestQuote.status)) {
    return {
      label: "Próxima decisão",
      title: "Cobrar retorno do orçamento",
      detail: `Versão ${latestQuote.versao} em ${formatQuoteStatus(latestQuote.status)} no valor de ${formatMoney(latestQuote.valor)}.`,
      actionLabel: "Ver orçamentos",
      href: "#orcamentos",
      tone: "is-today",
    };
  }

  if (latestQuote?.status === "aprovado" || opportunity.status === "ganha") {
    return {
      label: "Próxima decisão",
      title: "Preparar execução",
      detail: "Orçamento aprovado. Confirme pagamento, agenda e previsão de execução.",
      actionLabel: "Ver orçamentos",
      href: "#orcamentos",
      tone: "is-ok",
    };
  }

  return {
    label: "Próxima decisão",
    title: "Registrar próximo avanço",
    detail: "Atualize visita, orçamento ou atividade conforme a conversa com o cliente.",
    actionLabel: "Registrar atividade",
    href: "#linha-do-tempo",
    tone: "is-ok",
  };
}

function getNextActionState(opportunity: Opportunity, currentNextAction: NextAction | null): {
  label: string;
  title: string;
  detail: string;
  badge: string;
  badgeClass: string;
  tone: string;
} {
  const title = currentNextAction?.title ?? opportunity.proximaAcao;
  const dueAt = currentNextAction?.dueAt ?? opportunity.proximaAcaoEm;
  if (!title || !dueAt) {
    if (opportunity.status !== "ativa") {
      return {
        label: "Próxima ação",
        title: "Sem ação pendente",
        detail: `Oportunidade ${formatOpportunityStatus(opportunity.status).toLowerCase()}.`,
        badge: "fechada",
        badgeClass: "badge-neutral",
        tone: "is-ok",
      };
    }
    return {
      label: "Próxima ação",
      title: "Definir próxima ação",
      detail: "Esta oportunidade está ativa sem um compromisso comercial claro.",
      badge: "sem ação",
      badgeClass: "badge-alert-danger",
      tone: "is-danger",
    };
  }

  const dueDate = new Date(dueAt);
  const dueTime = dueDate.getTime();
  if (!Number.isFinite(dueTime)) {
    return {
      label: "Próxima ação",
      title,
      detail: "Prazo cadastrado precisa ser revisado.",
      badge: "revisar",
      badgeClass: "badge-alert-warning",
      tone: "is-warning",
    };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;
  const detail = formatDateTime(dueAt);

  if (dueTime < now.getTime()) {
    return { label: "Ação vencida", title, detail, badge: "vencida", badgeClass: "badge-alert-danger", tone: "is-danger" };
  }
  if (dueTime < startOfTomorrow) {
    return { label: "Ação para hoje", title, detail, badge: "hoje", badgeClass: "badge-informative", tone: "is-today" };
  }
  return { label: "Próxima ação", title, detail, badge: "agendada", badgeClass: "badge-positive", tone: "is-ok" };
}

function formatQuoteStatus(status: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    rascunho: "rascunho",
    enviado: "enviado",
    revisado: "revisado",
    aprovado: "aprovado",
    recusado: "recusado",
    expirado: "expirado",
  };
  return labels[status];
}
