import { getSupabaseClient } from "./auth";

export type Customer = {
  id: string;
  tipoPessoa: "fisica" | "juridica";
  nome: string;
  telefone: string | null;
  telefoneNormalizado: string | null;
  email: string | null;
  empresa: string | null;
  bairro: string | null;
  cidade: string | null;
  archivedAt: string | null;
  opportunitiesCount: number;
  duplicatePhoneCustomerIds: string[];
};

export type Opportunity = {
  id: string;
  clienteId: string;
  clienteNome: string;
  titulo: string;
  tipoDemanda: string;
  origem: string | null;
  responsavelId: string;
  etapaId: string;
  etapaNome: string;
  situacao: string;
  valorEstimado: number | null;
  valorAprovado: number | null;
  formaPagamento: string | null;
  quantidadeParcelas: number | null;
  previsaoExecucao: string | null;
  proximaAcao: string | null;
  proximaAcaoEm: string | null;
  status: "rascunho" | "ativa" | "ganha" | "perdida" | "arquivada";
  currentNextActionId: string | null;
};

export type Activity = {
  id: string;
  customerId: string;
  opportunityId: string | null;
  type: "note" | "message" | "call" | "visit" | "meeting" | "follow_up" | "quote_sent" | "stage_change" | "owner_change" | "approval" | "loss" | "warranty" | "support" | "after_sales" | "system";
  title: string | null;
  description: string;
  occurredAt: string;
  createdBy: string;
  source: "manual" | "system";
};

export type NextAction = {
  id: string;
  customerId: string;
  customerName: string;
  opportunityId: string | null;
  opportunityTitle: string | null;
  responsibleUserId: string;
  category: "commercial" | "warranty" | "support" | "after_sales";
  title: string;
  description: string | null;
  dueAt: string;
  priority: "low" | "normal" | "high";
  status: "pending" | "completed" | "cancelled";
  completedAt: string | null;
  completionResult: string | null;
  postponedFrom: string | null;
  cancellationReason: string | null;
  archivedAt: string | null;
};

export type PipelineStage = {
  id: string;
  nome: string;
  ordem: number;
  isTerminal: boolean;
};

export type LossReason = {
  id: string;
  nome: string;
};

export type CrmSnapshot = {
  customers: Customer[];
  opportunities: Opportunity[];
  stages: PipelineStage[];
  lossReasons: LossReason[];
  nextActions: NextAction[];
};

export type CreateCustomerPayload = {
  tipoPessoa: "fisica" | "juridica";
  nome: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  bairro?: string;
  cidade?: string;
};

export type CreateOpportunityPayload = {
  clienteId: string;
  titulo: string;
  tipoDemanda: string;
  origem?: string;
  responsavelId: string;
  etapaId?: string;
  situacao: string;
  valorEstimado?: number | null;
  proximaAcao: string;
  proximaAcaoEm: string;
};

export async function loadCrmSnapshot(search = ""): Promise<CrmSnapshot> {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const [customers, opportunities, stages, lossReasons] = await Promise.all([
    apiGet<{ customers: Customer[] }>(`/api/customers${query}`),
    apiGet<{ opportunities: Opportunity[] }>(`/api/opportunities${query}`),
    apiGet<{ stages: PipelineStage[] }>("/api/pipeline-stages"),
    apiGet<{ lossReasons: LossReason[] }>("/api/loss-reasons"),
  ]);

  return {
    customers: customers.customers,
    opportunities: opportunities.opportunities,
    stages: stages.stages,
    lossReasons: lossReasons.lossReasons,
    nextActions: (await apiGet<{ nextActions: NextAction[] }>("/api/next-actions")).nextActions,
  };
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  const response = await apiSend<{ customer: Customer }>("/api/customers", "POST", payload);
  return response.customer;
}

export async function updateCustomer(id: string, payload: Partial<CreateCustomerPayload>): Promise<Customer> {
  const response = await apiSend<{ customer: Customer }>(`/api/customers/${id}`, "PATCH", payload);
  return response.customer;
}

export async function createOpportunity(payload: CreateOpportunityPayload): Promise<Opportunity> {
  const response = await apiSend<{ opportunity: Opportunity }>("/api/opportunities", "POST", payload);
  return response.opportunity;
}

export async function updateOpportunity(id: string, payload: Partial<CreateOpportunityPayload>): Promise<Opportunity> {
  const response = await apiSend<{ opportunity: Opportunity }>(`/api/opportunities/${id}`, "PATCH", payload);
  return response.opportunity;
}

export async function archiveCustomer(id: string): Promise<Customer> {
  const response = await apiSend<{ customer: Customer }>(`/api/customers/${id}/archive`, "POST");
  return response.customer;
}

export async function archiveOpportunity(id: string): Promise<Opportunity> {
  const response = await apiSend<{ opportunity: Opportunity }>(`/api/opportunities/${id}/archive`, "POST");
  return response.opportunity;
}

export async function loadCustomerActivities(customerId: string): Promise<Activity[]> {
  return (await apiGet<{ activities: Activity[] }>(`/api/customers/${customerId}/activities`)).activities;
}

export async function loadOpportunityActivities(opportunityId: string): Promise<Activity[]> {
  return (await apiGet<{ activities: Activity[] }>(`/api/opportunities/${opportunityId}/activities`)).activities;
}

export async function createActivity(payload: { customerId: string; opportunityId?: string | null; type: Activity["type"]; title?: string | null; description: string }): Promise<Activity> {
  return (await apiSend<{ activity: Activity }>("/api/activities", "POST", payload)).activity;
}

export async function createNextAction(payload: { customerId: string; opportunityId?: string | null; responsibleUserId: string; category?: NextAction["category"]; title: string; dueAt: string; priority?: NextAction["priority"] }): Promise<NextAction> {
  return (await apiSend<{ nextAction: NextAction }>("/api/next-actions", "POST", payload)).nextAction;
}

export async function completeNextAction(id: string, payload: { completionResult: string; nextAction?: { customerId: string; opportunityId?: string | null; responsibleUserId: string; category?: NextAction["category"]; title: string; dueAt: string; priority?: NextAction["priority"] } | null }): Promise<NextAction> {
  return (await apiSend<{ nextAction: NextAction }>(`/api/next-actions/${id}/complete`, "POST", payload)).nextAction;
}

export async function postponeNextAction(id: string, dueAt: string): Promise<NextAction> {
  return (await apiSend<{ nextAction: NextAction }>(`/api/next-actions/${id}/postpone`, "POST", { dueAt })).nextAction;
}

export async function cancelNextAction(id: string, cancellationReason: string, nextAction?: { customerId: string; opportunityId?: string | null; responsibleUserId: string; category?: NextAction["category"]; title: string; dueAt: string; priority?: NextAction["priority"] } | null): Promise<NextAction> {
  return (await apiSend<{ nextAction: NextAction }>(`/api/next-actions/${id}/cancel`, "POST", { cancellationReason, nextAction })).nextAction;
}

export async function approveOpportunity(id: string, payload: { valorAprovado: number; formaPagamento: string; quantidadeParcelas: number; previsaoExecucao: string }): Promise<Opportunity> {
  const response = await apiSend<{ opportunity: Opportunity }>(`/api/opportunities/${id}/approve`, "POST", payload);
  return response.opportunity;
}

export async function loseOpportunity(id: string, motivoPerdaId: string): Promise<Opportunity> {
  const response = await apiSend<{ opportunity: Opportunity }>(`/api/opportunities/${id}/lose`, "POST", { motivoPerdaId });
  return response.opportunity;
}

async function apiGet<T>(path: string): Promise<T> {
  return apiSend<T>(path, "GET");
}

async function apiSend<T>(path: string, method: "GET" | "POST" | "PATCH", body?: unknown): Promise<T> {
  const token = await readAccessToken();
  const response = await fetch(`${import.meta.env.VITE_CRM_API_URL ?? ""}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json()) as T | { error?: { message?: string } };

  if (!response.ok) {
    const apiError = payload as { error?: { message?: string } };
    throw new Error(apiError.error?.message ?? "Erro na API do CRM.");
  }

  return payload as T;
}

async function readAccessToken(): Promise<string> {
  const supabase = getSupabaseClient();
  const session = await supabase?.auth.getSession();
  const token = session?.data.session?.access_token;

  if (!token) {
    throw new Error("Sessao expirada. Entre novamente no CRM.");
  }

  return token;
}
