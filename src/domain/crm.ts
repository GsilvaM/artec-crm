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

export type QuoteStatus = "rascunho" | "enviado" | "revisado" | "aprovado" | "recusado" | "expirado";

export type Quote = {
  id: string;
  opportunityId: string;
  versao: number;
  valor: number;
  resumo: string | null;
  status: QuoteStatus;
  enviadoEm: string | null;
  respondidoEm: string | null;
  createdAt: string;
  updatedAt: string;
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

export type LossReasonAdmin = LossReason & {
  isActive: boolean;
};

export type CrmRole = "gestor" | "vendedor" | "atendimento";

export type MembershipCandidate = {
  userId: string;
  email: string | null;
  hasMembership: boolean;
  role: CrmRole | null;
  isActive: boolean | null;
};

export type AuvoInboxStatus = "novo" | "em_analise" | "aguardando_dados" | "processado" | "descartado" | "erro_integracao";

export type AuvoInboxItem = {
  id: string;
  externalServiceId: string;
  status: AuvoInboxStatus;
  suggestedCustomerId: string | null;
  title: string;
  contactName: string | null;
  phoneNormalized: string | null;
  auvoContactId: string | null;
  email: string | null;
  channelType: string | null;
  resolution: string | null;
  resolvedOpportunityId: string | null;
  resolvedCustomerId: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  discardReason: string | null;
  lastEventId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResolveAuvoInboxItemPayload =
  | { action: "create_opportunity"; clienteId: string; titulo: string; tipoDemanda: string; origem?: string; situacao: string; proximaAcao: string; proximaAcaoEm: string; responsavelId: string }
  | { action: "link_opportunity"; opportunityId: string }
  | { action: "warranty" | "support" | "after_sales"; clienteId: string; description: string }
  | { action: "customer_only"; clienteId: string }
  | { action: "not_commercial" | "duplicate"; reason?: string };

export type GlobalSearchResult = {
  customers: Customer[];
  opportunities: Opportunity[];
};

export type CommercialReportFilters = {
  from?: string;
  to?: string;
  responsibleUserId?: string;
  origem?: string;
  tipoDemanda?: string;
  stageId?: string;
};

export type CommercialReport = {
  generatedAt: string;
  newLeads: number;
  opportunitiesCreated: number;
  opportunitiesByStage: { stageId: string; stageName: string; count: number }[];
  budgetValue: number;
  approvedValue: number;
  approvedCount: number;
  averageApprovedTicket: number;
  conversionRate: number;
  conversionByOrigin: { origem: string; created: number; approved: number; conversionRate: number }[];
  lossReasons: { reason: string; count: number }[];
  averageDaysToQuote: number | null;
  averageDaysToApproval: number | null;
  averageDaysToLoss: number | null;
  overdueFollowUps: number;
  completedFollowUps: number;
};

export type CrmSnapshot = {
  customers: Customer[];
  customersNextCursor: string | null;
  opportunities: Opportunity[];
  opportunitiesNextCursor: string | null;
  stages: PipelineStage[];
  lossReasons: LossReason[];
  nextActions: NextAction[];
  commercialCenter: CommercialCenter;
};

export type CommercialCenterActionItem = {
  id: string;
  customerId: string;
  customerName: string;
  opportunityId: string | null;
  opportunityTitle: string | null;
  opportunitySituation: string | null;
  category: NextAction["category"];
  title: string;
  responsibleUserId: string;
  dueAt: string;
  overdueHours: number;
  priority: NextAction["priority"];
};

export type CommercialCenterOpportunityItem = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  stageName: string;
  situation: string;
  responsibleUserId: string;
  budgetValue: number | null;
  budgetSentAt: string | null;
  nextActionTitle: string | null;
  nextActionDueAt: string | null;
  daysOpen: number;
};

export type CommercialCenter = {
  generatedAt: string;
  overdueActions: CommercialCenterActionItem[];
  todayActions: CommercialCenterActionItem[];
  opportunitiesWithoutNextAction: CommercialCenterOpportunityItem[];
  quotesAwaitingReturn: CommercialCenterOpportunityItem[];
  upcomingVisits: CommercialCenterActionItem[];
  stalledOpportunities: CommercialCenterOpportunityItem[];
  auvoInbox: { status: "homologation"; pending: number; message: string };
  summary: {
    newCustomers: number;
    newOpportunities: number;
    approvedOpportunities: number;
    lostOpportunities: number;
    budgetValue: number;
    approvedValue: number;
    simpleConversionRate: number;
    averageApprovedTicket: number;
  };
};

export type CommercialCenterFilters = {
  from?: string;
  to?: string;
  responsibleUserId?: string;
  stageId?: string;
  situation?: string;
  demandType?: string;
  category?: NextAction["category"];
  priority?: NextAction["priority"];
};

export type Notification = {
  id: string;
  userId: string;
  type: "overdue_next_action" | "due_soon_next_action" | "opportunity_assigned" | "next_action_reassigned" | "missing_next_action" | "stalled_opportunity" | "internal_error";
  severity: "info" | "attention" | "urgent";
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  customerId: string | null;
  opportunityId: string | null;
  nextActionId: string | null;
  actionUrl: string | null;
  status: "unread" | "read" | "archived" | "resolved";
  readAt: string | null;
  archivedAt: string | null;
  snoozedUntil: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationFilters = {
  status?: Notification["status"] | "active";
  type?: Notification["type"];
  severity?: Notification["severity"];
  from?: string;
  to?: string;
  limit?: string;
  cursor?: string;
};

export type AuvoWebhookStatus = "received" | "processing" | "processed" | "ignored" | "failed";

export type AuvoWebhookEvent = {
  id: string;
  provider: "auvo";
  externalEventId: string | null;
  eventType: string | null;
  payloadHash: string;
  sanitizedHeaders: Record<string, string>;
  sanitizedPayload: unknown;
  status: AuvoWebhookStatus;
  attemptCount: number;
  lastError: string | null;
  receivedAt: string;
  processedAt: string | null;
  ignoredAt: string | null;
  contentLength: number | null;
};

export type AuvoIntegrationStatus = {
  configured: boolean;
  lastReceivedAt: string | null;
  lastProcessedAt: string | null;
  pendingCount: number;
  failedCount: number;
  recentEvents: AuvoWebhookEvent[];
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

function toQueryString(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const normalized = value?.trim();
    if (normalized) query.set(key, normalized);
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

export async function loadCrmSnapshot(search = "", commercialFilters: CommercialCenterFilters = {}): Promise<CrmSnapshot> {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const commercialQuery = toQueryString(commercialFilters);
  const [customers, opportunities, stages, lossReasons, commercialCenter] = await Promise.all([
    apiGet<{ customers: Customer[]; nextCursor: string | null }>(`/api/customers${query}`),
    apiGet<{ opportunities: Opportunity[]; nextCursor: string | null }>(`/api/opportunities${query}`),
    apiGet<{ stages: PipelineStage[] }>("/api/pipeline-stages"),
    apiGet<{ lossReasons: LossReason[] }>("/api/loss-reasons"),
    apiGet<{ commercialCenter: CommercialCenter }>(`/api/commercial-center${commercialQuery}`),
  ]);

  return {
    customers: customers.customers,
    customersNextCursor: customers.nextCursor,
    opportunities: opportunities.opportunities,
    opportunitiesNextCursor: opportunities.nextCursor,
    stages: stages.stages,
    lossReasons: lossReasons.lossReasons,
    nextActions: (await apiGet<{ nextActions: NextAction[] }>("/api/next-actions")).nextActions,
    commercialCenter: commercialCenter.commercialCenter,
  };
}

export async function loadMoreCustomers(cursor: string, search = ""): Promise<{ customers: Customer[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ cursor });
  if (search.trim()) params.set("search", search.trim());
  return apiGet<{ customers: Customer[]; nextCursor: string | null }>(`/api/customers?${params.toString()}`);
}

export async function loadMoreOpportunities(cursor: string, search = ""): Promise<{ opportunities: Opportunity[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ cursor });
  if (search.trim()) params.set("search", search.trim());
  return apiGet<{ opportunities: Opportunity[]; nextCursor: string | null }>(`/api/opportunities?${params.toString()}`);
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

export async function loadOpportunity(id: string): Promise<Opportunity> {
  return (await apiGet<{ opportunity: Opportunity }>(`/api/opportunities/${id}`)).opportunity;
}

export async function loadCommercialCenter(filters: CommercialCenterFilters = {}): Promise<CommercialCenter> {
  const query = toQueryString(filters as Record<string, string | undefined>);
  return (await apiGet<{ commercialCenter: CommercialCenter }>(`/api/commercial-center${query}`)).commercialCenter;
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

export type NextActionFilters = {
  responsibleUserId?: string;
  status?: NextAction["status"];
  category?: NextAction["category"];
  priority?: NextAction["priority"];
  overdue?: boolean;
  today?: boolean;
  future?: boolean;
};

export async function loadNextActions(filters: NextActionFilters = {}): Promise<NextAction[]> {
  const query = toQueryString({
    responsibleUserId: filters.responsibleUserId,
    status: filters.status,
    category: filters.category,
    priority: filters.priority,
    overdue: filters.overdue ? "true" : undefined,
    today: filters.today ? "true" : undefined,
    future: filters.future ? "true" : undefined,
  });
  return (await apiGet<{ nextActions: NextAction[] }>(`/api/next-actions${query}`)).nextActions;
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

export async function loadNotifications(filters: NotificationFilters = {}): Promise<{ notifications: Notification[]; nextCursor: string | null }> {
  return apiGet<{ notifications: Notification[]; nextCursor: string | null }>(`/api/notifications${toQueryString(filters)}`);
}

export async function loadUnreadNotificationsCount(): Promise<number> {
  return (await apiGet<{ count: number }>("/api/notifications/unread-count")).count;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  return (await apiSend<{ notification: Notification }>(`/api/notifications/${id}/read`, "POST")).notification;
}

export async function markAllNotificationsRead(): Promise<number> {
  return (await apiSend<{ updated: number }>("/api/notifications/read-all", "POST")).updated;
}

export async function archiveNotification(id: string): Promise<Notification> {
  return (await apiSend<{ notification: Notification }>(`/api/notifications/${id}/archive`, "POST")).notification;
}

export async function snoozeNotification(id: string, snoozedUntil: string): Promise<Notification> {
  return (await apiSend<{ notification: Notification }>(`/api/notifications/${id}/snooze`, "POST", { snoozedUntil })).notification;
}

export async function loadAuvoIntegrationStatus(): Promise<AuvoIntegrationStatus> {
  return apiGet<AuvoIntegrationStatus>("/api/integrations/auvo/status");
}

export async function loadAuvoWebhookEvents(filters: { status?: AuvoWebhookStatus; eventType?: string; limit?: string; cursor?: string } = {}): Promise<{ events: AuvoWebhookEvent[]; nextCursor: string | null }> {
  return apiGet<{ events: AuvoWebhookEvent[]; nextCursor: string | null }>(`/api/integrations/auvo/events${toQueryString(filters)}`);
}

export async function loadAuvoWebhookEvent(id: string): Promise<AuvoWebhookEvent> {
  return (await apiGet<{ event: AuvoWebhookEvent }>(`/api/integrations/auvo/events/${id}`)).event;
}

export async function reprocessAuvoWebhookEvent(id: string): Promise<AuvoWebhookEvent> {
  return (await apiSend<{ event: AuvoWebhookEvent }>(`/api/integrations/auvo/events/${id}/reprocess`, "POST")).event;
}

export async function ignoreAuvoWebhookEvent(id: string): Promise<AuvoWebhookEvent> {
  return (await apiSend<{ event: AuvoWebhookEvent }>(`/api/integrations/auvo/events/${id}/ignore`, "POST")).event;
}

export async function loadPipelineStages(): Promise<PipelineStage[]> {
  return (await apiGet<{ stages: PipelineStage[] }>("/api/pipeline-stages")).stages;
}

export async function createPipelineStage(payload: { nome: string; ordem: number }): Promise<PipelineStage> {
  return (await apiSend<{ stage: PipelineStage }>("/api/admin/pipeline-stages", "POST", payload)).stage;
}

export async function updatePipelineStage(id: string, payload: { nome?: string; ordem?: number }): Promise<PipelineStage> {
  return (await apiSend<{ stage: PipelineStage }>(`/api/admin/pipeline-stages/${id}`, "PATCH", payload)).stage;
}

export async function loadAdminLossReasons(): Promise<LossReasonAdmin[]> {
  return (await apiGet<{ lossReasons: LossReasonAdmin[] }>("/api/admin/loss-reasons")).lossReasons;
}

export async function createLossReason(payload: { nome: string }): Promise<LossReasonAdmin> {
  return (await apiSend<{ lossReason: LossReasonAdmin }>("/api/admin/loss-reasons", "POST", payload)).lossReason;
}

export async function setLossReasonActive(id: string, isActive: boolean): Promise<LossReasonAdmin> {
  return (await apiSend<{ lossReason: LossReasonAdmin }>(`/api/admin/loss-reasons/${id}`, "PATCH", { isActive })).lossReason;
}

export async function loadAdminUsers(): Promise<MembershipCandidate[]> {
  return (await apiGet<{ users: MembershipCandidate[] }>("/api/admin/users")).users;
}

export async function upsertMembership(userId: string, payload: { role: CrmRole; isActive: boolean }): Promise<MembershipCandidate> {
  return (await apiSend<{ membership: MembershipCandidate }>(`/api/admin/users/${userId}/membership`, "POST", payload)).membership;
}

export async function loadAuvoInboxItems(status?: AuvoInboxStatus): Promise<AuvoInboxItem[]> {
  return (await apiGet<{ items: AuvoInboxItem[] }>(`/api/auvo-inbox${toQueryString({ status })}`)).items;
}

export async function resolveAuvoInboxItem(id: string, payload: ResolveAuvoInboxItemPayload): Promise<AuvoInboxItem> {
  return (await apiSend<{ item: AuvoInboxItem }>(`/api/auvo-inbox/${id}/resolve`, "POST", payload)).item;
}

export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  return (await apiGet<{ results: GlobalSearchResult }>(`/api/search${toQueryString({ q: query })}`)).results;
}

export async function loadCommercialReport(filters: CommercialReportFilters = {}): Promise<CommercialReport> {
  return (await apiGet<{ report: CommercialReport }>(`/api/reports/commercial${toQueryString(filters)}`)).report;
}

export async function loadOpportunityQuotes(opportunityId: string): Promise<Quote[]> {
  return (await apiGet<{ quotes: Quote[] }>(`/api/opportunities/${opportunityId}/quotes`)).quotes;
}

export async function createQuote(opportunityId: string, payload: { valor: number; resumo?: string }): Promise<Quote> {
  return (await apiSend<{ quote: Quote }>(`/api/opportunities/${opportunityId}/quotes`, "POST", payload)).quote;
}

export async function updateQuote(id: string, payload: { valor?: number; resumo?: string; status?: QuoteStatus }): Promise<Quote> {
  return (await apiSend<{ quote: Quote }>(`/api/quotes/${id}`, "PATCH", payload)).quote;
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
