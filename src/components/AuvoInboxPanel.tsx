import { type FormEvent, useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { formatDateTime } from "../domain/format";
import {
  loadAuvoInboxItems,
  resolveAuvoInboxItem,
  type AuvoInboxItem,
  type AuvoInboxStatus,
  type Customer,
  type ResolveAuvoInboxItemPayload,
} from "../domain/crm";

type ActionMode = "create_opportunity" | "link_opportunity" | "warranty" | "support" | "after_sales" | "customer_only" | "not_commercial" | "duplicate";

const STATUS_LABELS: Record<AuvoInboxStatus, string> = {
  novo: "Novo",
  em_analise: "Em analise",
  aguardando_dados: "Aguardando dados",
  processado: "Processado",
  descartado: "Descartado",
  erro_integracao: "Erro de integracao",
};

const ACTION_LABELS: Record<ActionMode, string> = {
  create_opportunity: "Criar oportunidade",
  link_opportunity: "Vincular a oportunidade existente",
  warranty: "Registrar garantia",
  support: "Registrar suporte",
  after_sales: "Registrar pos-venda",
  customer_only: "Cadastrar somente cliente",
  not_commercial: "Marcar nao comercial",
  duplicate: "Marcar duplicado",
};

export function AuvoInboxPanel({ customers, currentUserId }: { customers: Customer[]; currentUserId: string }) {
  const [items, setItems] = useState<AuvoInboxItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<AuvoInboxStatus | "">("novo");
  const [error, setError] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [mode, setMode] = useState<ActionMode | "">("");
  const [form, setForm] = useState({
    clienteId: "",
    opportunityId: "",
    titulo: "",
    tipoDemanda: "instalacao",
    situacao: "em andamento",
    proximaAcao: "",
    proximaAcaoEm: "",
    description: "",
    reason: "",
  });

  useEffect(() => {
    void refresh();
  }, [statusFilter]);

  async function refresh() {
    setError(null);
    try {
      setItems(await loadAuvoInboxItems(statusFilter || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar a Caixa de Entrada.");
    }
  }

  function openAction(item: AuvoInboxItem, actionMode: ActionMode) {
    setActiveItemId(item.id);
    setMode(actionMode);
    setForm({
      clienteId: item.suggestedCustomerId ?? "",
      opportunityId: "",
      titulo: item.title,
      tipoDemanda: "instalacao",
      situacao: "em andamento",
      proximaAcao: "",
      proximaAcaoEm: "",
      description: "",
      reason: "",
    });
  }

  function closeAction() {
    setActiveItemId(null);
    setMode("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeItemId || !mode) return;
    setError(null);

    let payload: ResolveAuvoInboxItemPayload;
    if (mode === "create_opportunity") {
      payload = {
        action: "create_opportunity",
        clienteId: form.clienteId,
        titulo: form.titulo,
        tipoDemanda: form.tipoDemanda,
        situacao: form.situacao,
        proximaAcao: form.proximaAcao,
        proximaAcaoEm: form.proximaAcaoEm,
        responsavelId: currentUserId,
      };
    } else if (mode === "link_opportunity") {
      payload = { action: "link_opportunity", opportunityId: form.opportunityId };
    } else if (mode === "warranty" || mode === "support" || mode === "after_sales") {
      payload = { action: mode, clienteId: form.clienteId, description: form.description };
    } else if (mode === "customer_only") {
      payload = { action: "customer_only", clienteId: form.clienteId };
    } else {
      payload = { action: mode, reason: form.reason || undefined };
    }

    try {
      await resolveAuvoInboxItem(activeItemId, payload);
      closeAction();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel resolver este item.");
    }
  }

  return (
    <section className="panel auvo-inbox-panel" aria-label="Caixa de Entrada Auvo">
      <header>
        <div>
          <p className="eyebrow">Caixa de Entrada Auvo</p>
          <h2>Triagem de atendimentos</h2>
        </div>
        <div className="filter-actions">
          {(["novo", "em_analise", "processado", "descartado"] as const).map((status) => (
            <button key={status} className={`button ${statusFilter === status ? "secondary" : "ghost"}`} type="button" onClick={() => setStatusFilter(status)}>
              {STATUS_LABELS[status]}
            </button>
          ))}
          <button className={`button ${statusFilter === "" ? "secondary" : "ghost"}`} type="button" onClick={() => setStatusFilter("")}>Todos</button>
        </div>
      </header>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {items.length ? (
        <ul className="auvo-inbox-list">
          {items.map((item) => {
            const isOpen = activeItemId === item.id;
            const isResolved = item.status === "processado" || item.status === "descartado";
            const suggestedCustomer = customers.find((customer) => customer.id === item.suggestedCustomerId);
            return (
              <li key={item.id} className="auvo-inbox-item">
                <div className="auvo-inbox-item-header">
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.channelType ?? "canal desconhecido"} - {formatDateTime(item.createdAt)}</span>
                  </div>
                  <span className="badge">{STATUS_LABELS[item.status]}</span>
                </div>
                <dl className="auvo-inbox-facts">
                  {item.phoneNormalized ? <div><dt>Telefone</dt><dd>{item.phoneNormalized}</dd></div> : null}
                  {suggestedCustomer ? <div><dt>Cliente sugerido</dt><dd>{suggestedCustomer.nome}</dd></div> : <div><dt>Cliente sugerido</dt><dd>Nenhum encontrado</dd></div>}
                  {item.resolution ? <div><dt>Resolucao</dt><dd>{item.resolution}</dd></div> : null}
                  {item.discardReason ? <div><dt>Motivo</dt><dd>{item.discardReason}</dd></div> : null}
                </dl>

                {!isResolved ? (
                  <div className="quick-actions">
                    {(Object.keys(ACTION_LABELS) as ActionMode[]).map((actionMode) => (
                      <button key={actionMode} className="button ghost" type="button" onClick={() => openAction(item, actionMode)}>
                        {ACTION_LABELS[actionMode]}
                      </button>
                    ))}
                  </div>
                ) : null}

                {isOpen && mode ? (
                  <form className="auvo-inbox-form" onSubmit={handleSubmit}>
                    <h4>{ACTION_LABELS[mode]}</h4>
                    {mode === "create_opportunity" || mode === "warranty" || mode === "support" || mode === "after_sales" || mode === "customer_only" ? (
                      <label>Cliente
                        <select required value={form.clienteId} onChange={(event) => setForm({ ...form, clienteId: event.target.value })}>
                          <option value="">Selecione</option>
                          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.nome}</option>)}
                        </select>
                      </label>
                    ) : null}
                    {mode === "create_opportunity" ? (
                      <>
                        <label>Titulo<input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /></label>
                        <label>Tipo de demanda<input required value={form.tipoDemanda} onChange={(event) => setForm({ ...form, tipoDemanda: event.target.value })} /></label>
                        <label>Situacao<input required value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} /></label>
                        <label>Proxima acao<input required value={form.proximaAcao} onChange={(event) => setForm({ ...form, proximaAcao: event.target.value })} /></label>
                        <label>Data da proxima acao<input required type="datetime-local" value={form.proximaAcaoEm} onChange={(event) => setForm({ ...form, proximaAcaoEm: event.target.value })} /></label>
                      </>
                    ) : null}
                    {mode === "link_opportunity" ? (
                      <label>ID da oportunidade<input required value={form.opportunityId} onChange={(event) => setForm({ ...form, opportunityId: event.target.value })} /></label>
                    ) : null}
                    {mode === "warranty" || mode === "support" || mode === "after_sales" ? (
                      <label>Descricao<input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
                    ) : null}
                    {mode === "not_commercial" || mode === "duplicate" ? (
                      <label>Motivo (opcional)<input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label>
                    ) : null}
                    <div className="form-actions">
                      <button className="button primary" type="submit">Confirmar</button>
                      <button className="button secondary" type="button" onClick={closeAction}>Cancelar</button>
                    </div>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="quotes-empty">
          <Inbox aria-hidden="true" size={16} /> Nenhum item nesta visualizacao.
        </p>
      )}
    </section>
  );
}
