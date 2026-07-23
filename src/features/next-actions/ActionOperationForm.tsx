import { type FormEvent, useEffect, useRef } from "react";
import { useEscapeKey, useOverlayScrollLockAndFocusRestore } from "../../components/ui/useOverlayBehavior";
import type { NextAction } from "../../domain/crm";
import type { ActionOperationState } from "./useActionOperation";

function formatOperationTitle(mode: ActionOperationState["mode"]): string {
  if (mode === "complete") return "Concluir próxima ação";
  if (mode === "postpone") return "Reagendar próxima ação";
  return "Cancelar próxima ação";
}

// No mobile este formulario vira uma folha inferior (bottom sheet: canto
// superior arredondado + indicador "grabber"), inspirada nos tokens de forma
// de dispositivo do kit de referencia (design-system/spacing-shape/
// device-shape-iphone.tokens.json: Sheet Top Radius, Grabber Width/Height) —
// proporcoes adaptadas para um controle web, nao copiadas 1:1 do iOS.
export function ActionOperationForm({ operation, error, onChange, onSubmit, onCancel }: {
  operation: ActionOperationState;
  error: string | null;
  onChange: (patch: Partial<ActionOperationState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  // So vira bottom sheet real (com backdrop) abaixo de 767px — no desktop e um
  // painel inline sem overlay (ver .action-operation-backdrop em styles.css),
  // entao so trava o scroll do body quando de fato cobre a tela.
  const isBottomSheet = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  useOverlayScrollLockAndFocusRestore(isBottomSheet);
  useEscapeKey(true, onCancel);

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <>
      <div className="action-operation-backdrop" role="presentation" onClick={onCancel} />
      <form ref={formRef} className="panel compact-form action-operation" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">{operation.action.customerName}</p>
          <h3>{formatOperationTitle(operation.mode)}</h3>
        </div>
        {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}
        {operation.mode === "complete" ? (
          <label>Resultado<input required value={operation.completionResult} onChange={(event) => onChange({ completionResult: event.target.value })} /></label>
        ) : null}
        {operation.mode === "postpone" ? (
          <label>Novo vencimento<input required type="datetime-local" value={operation.dueAt} onChange={(event) => onChange({ dueAt: event.target.value })} /></label>
        ) : null}
        {operation.mode === "cancel" ? (
          <label>Motivo do cancelamento<input required value={operation.cancellationReason} onChange={(event) => onChange({ cancellationReason: event.target.value })} /></label>
        ) : null}
        {operation.requiresReplacement && operation.mode !== "postpone" ? (
          <fieldset className="replacement-fields">
            <legend>Nova próxima ação obrigatória</legend>
            <label>Ação<input required value={operation.nextTitle} onChange={(event) => onChange({ nextTitle: event.target.value })} /></label>
            <label>Vencimento<input required type="datetime-local" value={operation.nextDueAt} onChange={(event) => onChange({ nextDueAt: event.target.value })} /></label>
            <label>Categoria
              <select value={operation.nextCategory} onChange={(event) => onChange({ nextCategory: event.target.value as NextAction["category"] })}>
                <option value="commercial">Comercial</option>
                <option value="warranty">Garantia</option>
                <option value="support">Suporte</option>
                <option value="after_sales">Pós-venda</option>
              </select>
            </label>
            <label>Prioridade
              <select value={operation.nextPriority} onChange={(event) => onChange({ nextPriority: event.target.value as NextAction["priority"] })}>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="low">Baixa</option>
              </select>
            </label>
          </fieldset>
        ) : null}
        <div className="form-actions">
          <button className="button primary" type="submit">Salvar</button>
          <button className="button secondary" type="button" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </>
  );
}
