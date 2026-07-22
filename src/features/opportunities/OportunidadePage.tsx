import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { QuotesPanel } from "../../components/QuotesPanel";
import { formatActivityType, formatDateTime, formatMoney, formatOpportunityStatus } from "../../domain/format";
import {
  approveOpportunity,
  archiveOpportunity,
  createActivity,
  createQuote,
  loadAdminUsers,
  loadLossReasons,
  loadNextAction,
  loadOpportunity,
  loadOpportunityActivities,
  loadOpportunityQuotes,
  loadPipelineStages,
  loseOpportunity,
  updateOpportunity,
  updateQuote,
  type Activity,
  type LossReason,
  type MembershipCandidate,
  type NextAction,
  type Opportunity,
  type PipelineStage,
  type Quote,
  type QuoteStatus,
} from "../../domain/crm";
import { useActionOperation } from "../next-actions/useActionOperation";
import { ActionOperationForm } from "../next-actions/ActionOperationForm";

export function OportunidadePage({ currentUserId, canManageUsers }: { currentUserId: string; canManageUsers: boolean }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [currentNextAction, setCurrentNextAction] = useState<NextAction | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [lossReasons, setLossReasons] = useState<LossReason[]>([]);
  const [members, setMembers] = useState<MembershipCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"approve" | "lose" | null>(null);
  const [approveForm, setApproveForm] = useState({ valorAprovado: "", formaPagamento: "a vista", quantidadeParcelas: "1", previsaoExecucao: "" });
  const [lossReasonId, setLossReasonId] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
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

  const isOverdueAction = currentNextAction && currentNextAction.status === "pending" && new Date(currentNextAction.dueAt).getTime() < Date.now();
  const isActive = opportunity.status === "ativa";

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">
            <Link to="/oportunidades">Oportunidades</Link> / {opportunity.titulo}
          </p>
          <h1>{opportunity.titulo}</h1>
        </div>
        <span className={`badge ${opportunity.status === "perdida" ? "danger-badge" : ""}`}>{formatOpportunityStatus(opportunity.status)}</span>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      <section className="panel" aria-label="Resumo da oportunidade">
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

      <QuotesPanel opportunity={opportunity} quotes={quotes} onCreate={handleCreateQuote} onUpdateStatus={handleUpdateQuoteStatus} />

      <section className="data-section timeline-section">
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
