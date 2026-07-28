import { type FormEvent, useEffect, useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/input";
import { Modal } from "./ui/Modal";
import {
  createCustomer,
  createOpportunity,
  loadCustomersPage,
  SITUACAO_SUGGESTIONS,
  TIPO_DEMANDA_OPTIONS,
  type Customer,
  type Opportunity,
} from "../domain/crm";

type CustomerMode = "existing" | "new";

const DEFAULT_FORM = {
  clienteId: "",
  titulo: "",
  tipoDemanda: "instalacao",
  situacao: "Em andamento",
  proximaAcao: "",
  proximaAcaoEm: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerCity: "",
};

export function QuickOpportunityModal({ currentUserId, preselectedCustomerId, onClose, onCreated }: {
  currentUserId: string;
  preselectedCustomerId?: string;
  onClose: () => void;
  onCreated?: (opportunity: Opportunity) => void | Promise<void>;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [mode, setMode] = useState<CustomerMode>(preselectedCustomerId ? "existing" : "new");
  const [form, setForm] = useState({ ...DEFAULT_FORM, clienteId: preselectedCustomerId ?? "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadCustomersPage()
      .then((page) => {
        if (!active) return;
        const activeCustomers = page.customers.filter((customer) => !customer.archivedAt);
        setCustomers(activeCustomers);
        setForm((current) => ({ ...current, clienteId: current.clienteId || activeCustomers[0]?.id || "" }));
        if (activeCustomers.length && !preselectedCustomerId) setMode("existing");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar clientes."))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [preselectedCustomerId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const clienteId = mode === "new"
        ? (await createCustomer({
            tipoPessoa: "fisica",
            nome: form.customerName.trim(),
            telefone: form.customerPhone.trim(),
            email: form.customerEmail.trim(),
            cidade: form.customerCity.trim(),
          })).id
        : form.clienteId;

      if (!clienteId) throw new Error("Selecione ou cadastre um cliente antes de criar a oportunidade.");

      const opportunity = await createOpportunity({
        clienteId,
        titulo: form.titulo.trim(),
        tipoDemanda: form.tipoDemanda,
        responsavelId: currentUserId,
        situacao: form.situacao.trim(),
        proximaAcao: form.proximaAcao.trim(),
        proximaAcaoEm: form.proximaAcaoEm,
      });
      await onCreated?.(opportunity);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a oportunidade.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title="Nova oportunidade"
      subtitle="Crie o negócio com responsável, cliente e próxima ação em um único fluxo."
      icon={<Plus size={20} />}
      onClose={onClose}
      footer={(
        <>
          <Button variant="primary" type="submit" form="quick-opportunity-form" disabled={isSaving || isLoading}>
            {isSaving ? "Salvando..." : "Salvar oportunidade"}
          </Button>
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
        </>
      )}
    >
      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}
      <form id="quick-opportunity-form" className="quick-opportunity-modal-form" onSubmit={handleSubmit}>
        <fieldset>
          <legend>Cliente</legend>
          <div className="design-segmented quick-opportunity-customer-mode" role="group" aria-label="Origem do cliente">
            <button type="button" className={mode === "existing" ? "active" : ""} disabled={!customers.length} onClick={() => setMode("existing")}>Cliente existente</button>
            <button type="button" className={mode === "new" ? "active" : ""} onClick={() => setMode("new")}><UserPlus size={14} aria-hidden="true" /> Novo cliente</button>
          </div>
          {mode === "existing" ? (
            <label>
              Cliente
              <select required value={form.clienteId} onChange={(event) => setForm({ ...form, clienteId: event.target.value })}>
                <option value="">Selecione</option>
                {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.nome}</option>)}
              </select>
            </label>
          ) : (
            <div className="quick-opportunity-modal-grid">
              <label>Nome do cliente<Input required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></label>
              <label>Telefone<Input value={form.customerPhone} onChange={(event) => setForm({ ...form, customerPhone: event.target.value })} /></label>
              <label>E-mail<Input type="email" value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} /></label>
              <label>Cidade<Input value={form.customerCity} onChange={(event) => setForm({ ...form, customerCity: event.target.value })} /></label>
            </div>
          )}
        </fieldset>
        <fieldset>
          <legend>Oportunidade</legend>
          <div className="quick-opportunity-modal-grid">
            <label>Título<Input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /></label>
            <label>Tipo de demanda
              <select required value={form.tipoDemanda} onChange={(event) => setForm({ ...form, tipoDemanda: event.target.value })}>
                {TIPO_DEMANDA_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>Situação<Input required list="quick-opportunity-situacoes" value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} /></label>
            <label>Próxima ação<Input required value={form.proximaAcao} onChange={(event) => setForm({ ...form, proximaAcao: event.target.value })} /></label>
            <label>Data da próxima ação<Input required type="datetime-local" value={form.proximaAcaoEm} onChange={(event) => setForm({ ...form, proximaAcaoEm: event.target.value })} /></label>
          </div>
          <datalist id="quick-opportunity-situacoes">
            {SITUACAO_SUGGESTIONS.map((suggestion) => <option value={suggestion} key={suggestion} />)}
          </datalist>
        </fieldset>
      </form>
    </Modal>
  );
}
