import { useState } from "react";
import { cancelNextAction, completeNextAction, loadOpportunity, postponeNextAction, type NextAction } from "../../domain/crm";

export type ActionOperationMode = "complete" | "postpone" | "cancel";

export type ActionOperationTarget = {
  id: string;
  customerId: string;
  customerName: string;
  opportunityId: string | null;
  category: NextAction["category"];
  dueAt: string;
};

export type ActionOperationState = {
  action: ActionOperationTarget;
  mode: ActionOperationMode;
  completionResult: string;
  dueAt: string;
  cancellationReason: string;
  nextTitle: string;
  nextDueAt: string;
  nextCategory: NextAction["category"];
  nextPriority: NextAction["priority"];
  requiresReplacement: boolean;
};

function toDateTimeLocalValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function defaultReplacementDueAt(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return toDateTimeLocalValue(date.toISOString());
}

function defaultReplacementTitle(mode: ActionOperationMode, category: NextAction["category"]): string {
  if (mode === "cancel") return "Definir novo encaminhamento";
  if (category === "warranty") return "Retornar sobre garantia";
  if (category === "support") return "Retornar suporte ao cliente";
  if (category === "after_sales") return "Acompanhar pós-venda";
  return "Dar continuidade ao atendimento";
}

async function checkNeedsReplacement(action: ActionOperationTarget): Promise<boolean> {
  if (!action.opportunityId) return false;
  const opportunity = await loadOpportunity(action.opportunityId);
  return opportunity.status === "ativa" && opportunity.currentNextActionId === action.id;
}

export function useActionOperation(currentUserId: string, onSuccess: () => void | Promise<void>) {
  const [operation, setOperation] = useState<ActionOperationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function open(action: ActionOperationTarget, mode: ActionOperationMode) {
    setError(null);
    setOperation({
      action,
      mode,
      completionResult: "",
      dueAt: toDateTimeLocalValue(action.dueAt),
      cancellationReason: "",
      nextTitle: "",
      nextDueAt: "",
      nextCategory: action.category,
      nextPriority: "normal",
      requiresReplacement: false,
    });
    const requiresReplacement = await checkNeedsReplacement(action).catch(() => false);
    setOperation((current) => {
      if (!current || current.action.id !== action.id) return current;
      if (!requiresReplacement || mode === "postpone") return { ...current, requiresReplacement };
      return {
        ...current,
        requiresReplacement,
        nextTitle: current.nextTitle || defaultReplacementTitle(mode, action.category),
        nextDueAt: current.nextDueAt || defaultReplacementDueAt(),
      };
    });
  }

  function update(patch: Partial<ActionOperationState>) {
    setOperation((current) => (current ? { ...current, ...patch } : current));
  }

  function close() {
    setOperation(null);
    setError(null);
  }

  async function submit() {
    if (!operation) return;
    setError(null);
    const { action, mode, requiresReplacement } = operation;
    const nextAction = requiresReplacement
      ? {
          customerId: action.customerId,
          opportunityId: action.opportunityId,
          responsibleUserId: currentUserId,
          category: operation.nextCategory,
          title: operation.nextTitle,
          dueAt: operation.nextDueAt,
          priority: operation.nextPriority,
        }
      : null;

    if (requiresReplacement && mode !== "postpone" && (!operation.nextTitle.trim() || !operation.nextDueAt)) {
      setError("Defina a próxima ação antes de concluir esta atividade.");
      return;
    }

    try {
      if (mode === "complete") {
        await completeNextAction(action.id, { completionResult: operation.completionResult, nextAction });
      } else if (mode === "postpone") {
        await postponeNextAction(action.id, operation.dueAt);
      } else {
        await cancelNextAction(action.id, operation.cancellationReason, nextAction);
      }
      close();
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a próxima ação.");
    }
  }

  return { operation, error, open, update, close, submit };
}
