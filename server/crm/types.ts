import type { CrmRole } from "../auth/rbac.js";

export type Actor = {
  id: string;
  role: CrmRole;
};

export type CustomerRecord = {
  id: string;
  tipoPessoa: "fisica" | "juridica";
  nome: string;
  nomeFantasia: string | null;
  telefone: string | null;
  telefoneNormalizado: string | null;
  email: string | null;
  documento: string | null;
  empresa: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  auvoContactId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
  archivedAt: string | null;
  opportunitiesCount: number;
  duplicatePhoneCustomerIds: string[];
};

export type OpportunityRecord = {
  id: string;
  clienteId: string;
  clienteNome: string;
  titulo: string;
  descricao: string | null;
  tipoDemanda: string;
  origem: string | null;
  responsavelId: string;
  etapaId: string;
  etapaNome: string;
  situacao: string;
  valorEstimado: number | null;
  valorOrcamento: number | null;
  valorAprovado: number | null;
  formaPagamento: string | null;
  quantidadeParcelas: number | null;
  previsaoExecucao: string | null;
  proximaAcao: string | null;
  proximaAcaoEm: string | null;
  dataEntrada: string;
  dataOrcamento: string | null;
  dataAprovacao: string | null;
  dataPerda: string | null;
  motivoPerdaId: string | null;
  motivoPerdaNome: string | null;
  status: "rascunho" | "ativa" | "ganha" | "perdida" | "arquivada";
  currentNextActionId: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type ActivityType =
  | "note"
  | "message"
  | "call"
  | "visit"
  | "meeting"
  | "follow_up"
  | "quote_sent"
  | "stage_change"
  | "owner_change"
  | "approval"
  | "loss"
  | "warranty"
  | "support"
  | "after_sales"
  | "system";

export type ActivityRecord = {
  id: string;
  customerId: string;
  opportunityId: string | null;
  type: ActivityType;
  title: string | null;
  description: string;
  occurredAt: string;
  createdBy: string;
  source: "manual" | "system";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type NextActionStatus = "pending" | "completed" | "cancelled";
export type NextActionPriority = "low" | "normal" | "high";
export type NextActionCategory = "commercial" | "warranty" | "support" | "after_sales";

export type NextActionRecord = {
  id: string;
  customerId: string;
  customerName: string;
  opportunityId: string | null;
  opportunityTitle: string | null;
  responsibleUserId: string;
  category: NextActionCategory;
  title: string;
  description: string | null;
  dueAt: string;
  priority: NextActionPriority;
  status: NextActionStatus;
  completedAt: string | null;
  completedBy: string | null;
  completionResult: string | null;
  postponedFrom: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  archivedAt: string | null;
};

export type CommercialCenterFilters = {
  from?: string;
  to?: string;
  responsibleUserId?: string;
  stageId?: string;
  situation?: string;
  demandType?: string;
  category?: NextActionCategory;
  priority?: NextActionPriority;
};

export type CommercialCenterActionItem = {
  id: string;
  customerId: string;
  customerName: string;
  opportunityId: string | null;
  opportunityTitle: string | null;
  opportunitySituation: string | null;
  category: NextActionCategory;
  title: string;
  responsibleUserId: string;
  dueAt: string;
  overdueHours: number;
  priority: NextActionPriority;
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

export type CommercialCenterSummary = {
  newCustomers: number;
  newOpportunities: number;
  approvedOpportunities: number;
  lostOpportunities: number;
  budgetValue: number;
  approvedValue: number;
  simpleConversionRate: number;
  averageApprovedTicket: number;
};

export type CommercialCenterRecord = {
  generatedAt: string;
  filters: CommercialCenterFilters;
  overdueActions: CommercialCenterActionItem[];
  todayActions: CommercialCenterActionItem[];
  opportunitiesWithoutNextAction: CommercialCenterOpportunityItem[];
  quotesAwaitingReturn: CommercialCenterOpportunityItem[];
  upcomingVisits: CommercialCenterActionItem[];
  stalledOpportunities: CommercialCenterOpportunityItem[];
  auvoInbox: {
    status: "homologation";
    pending: number;
    message: string;
  };
  summary: CommercialCenterSummary;
};

export type NotificationStatus = "unread" | "read" | "archived" | "resolved";
export type NotificationSeverity = "info" | "attention" | "urgent";
export type NotificationType =
  | "overdue_next_action"
  | "due_soon_next_action"
  | "opportunity_assigned"
  | "next_action_reassigned"
  | "missing_next_action"
  | "stalled_opportunity"
  | "internal_error";

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationType;
  priority: "alta" | "media" | "informativa";
  severity: NotificationSeverity;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  customerId: string | null;
  opportunityId: string | null;
  nextActionId: string | null;
  actionUrl: string | null;
  dedupeKey: string;
  status: NotificationStatus;
  readAt: string | null;
  archivedAt: string | null;
  snoozedUntil: string | null;
  resolvedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type NotificationFilters = {
  status?: NotificationStatus | "active";
  type?: NotificationType;
  severity?: NotificationSeverity;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
};

export type NotificationListRecord = {
  notifications: NotificationRecord[];
  nextCursor: string | null;
};

export type NotificationReconcileResult = {
  generated: number;
  updated: number;
  resolved: number;
};

export type SnoozeNotificationInput = {
  snoozedUntil: string;
};

export type PipelineStageRecord = {
  id: string;
  nome: string;
  ordem: number;
  isTerminal: boolean;
};

export type LossReasonRecord = {
  id: string;
  nome: string;
};

export type CreateCustomerInput = {
  tipoPessoa: CustomerRecord["tipoPessoa"];
  nome: string;
  nomeFantasia?: string | null;
  telefone?: string | null;
  email?: string | null;
  documento?: string | null;
  empresa?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  observacoes?: string | null;
  auvoContactId?: string | null;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export type CreateOpportunityInput = {
  clienteId: string;
  titulo: string;
  descricao?: string | null;
  tipoDemanda: string;
  origem?: string | null;
  responsavelId: string;
  etapaId?: string | null;
  situacao: string;
  valorEstimado?: number | null;
  valorOrcamento?: number | null;
  proximaAcao?: string | null;
  proximaAcaoEm?: string | null;
  status?: OpportunityRecord["status"];
};

export type CreateActivityInput = {
  customerId: string;
  opportunityId?: string | null;
  type: ActivityType;
  title?: string | null;
  description: string;
  occurredAt?: string | null;
  source?: "manual" | "system";
  metadata?: Record<string, unknown>;
};

export type UpdateActivityInput = Partial<Omit<CreateActivityInput, "customerId" | "opportunityId" | "source">>;

export type CreateNextActionInput = {
  customerId: string;
  opportunityId?: string | null;
  responsibleUserId: string;
  category?: NextActionCategory;
  title: string;
  description?: string | null;
  dueAt: string;
  priority?: NextActionPriority;
};

export type UpdateNextActionInput = Partial<CreateNextActionInput>;

export type CompleteNextActionInput = {
  completionResult: string;
  nextAction?: CreateNextActionInput | null;
};

export type PostponeNextActionInput = {
  dueAt: string;
};

export type CancelNextActionInput = {
  cancellationReason: string;
  nextAction?: CreateNextActionInput | null;
};

export type UpdateOpportunityInput = Partial<CreateOpportunityInput> & {
  valorAprovado?: number | null;
  formaPagamento?: string | null;
  quantidadeParcelas?: number | null;
  previsaoExecucao?: string | null;
  dataAprovacao?: string | null;
  dataPerda?: string | null;
  motivoPerdaId?: string | null;
};

export type ApproveOpportunityInput = {
  valorAprovado: number;
  formaPagamento: string;
  quantidadeParcelas: number;
  previsaoExecucao: string;
};

export type LoseOpportunityInput = {
  motivoPerdaId: string;
};

export type CrmDataRepository = {
  listCustomers(actor: Actor, filters: { search?: string; archived?: boolean }): Promise<CustomerRecord[]>;
  getCustomer(actor: Actor, id: string): Promise<CustomerRecord | null>;
  createCustomer(actor: Actor, input: CreateCustomerInput): Promise<CustomerRecord>;
  updateCustomer(actor: Actor, id: string, input: UpdateCustomerInput): Promise<CustomerRecord | null>;
  setCustomerArchived(actor: Actor, id: string, archived: boolean): Promise<CustomerRecord | null>;
  listOpportunities(actor: Actor, filters: { search?: string; status?: string; etapaId?: string; responsavelId?: string }): Promise<OpportunityRecord[]>;
  getOpportunity(actor: Actor, id: string): Promise<OpportunityRecord | null>;
  createOpportunity(actor: Actor, input: CreateOpportunityInput): Promise<OpportunityRecord>;
  updateOpportunity(actor: Actor, id: string, input: UpdateOpportunityInput): Promise<OpportunityRecord | null>;
  approveOpportunity(actor: Actor, id: string, input: ApproveOpportunityInput): Promise<OpportunityRecord | null>;
  loseOpportunity(actor: Actor, id: string, input: LoseOpportunityInput): Promise<OpportunityRecord | null>;
  setOpportunityArchived(actor: Actor, id: string, archived: boolean): Promise<OpportunityRecord | null>;
  listActivities(actor: Actor, filters: { customerId?: string; opportunityId?: string }): Promise<ActivityRecord[]>;
  createActivity(actor: Actor, input: CreateActivityInput): Promise<ActivityRecord>;
  updateActivity(actor: Actor, id: string, input: UpdateActivityInput): Promise<ActivityRecord | null>;
  setActivityArchived(actor: Actor, id: string, archived: boolean): Promise<ActivityRecord | null>;
  listNextActions(
    actor: Actor,
    filters: {
      responsibleUserId?: string;
      status?: NextActionStatus;
      category?: NextActionCategory;
      overdue?: boolean;
      today?: boolean;
      future?: boolean;
      dateFrom?: string;
      dateTo?: string;
      customerId?: string;
      opportunityId?: string;
      priority?: NextActionPriority;
    },
  ): Promise<NextActionRecord[]>;
  getCommercialCenter(actor: Actor, filters: CommercialCenterFilters): Promise<CommercialCenterRecord>;
  listNotifications(actor: Actor, filters: NotificationFilters): Promise<NotificationListRecord>;
  getUnreadNotificationsCount(actor: Actor): Promise<{ count: number }>;
  markNotificationRead(actor: Actor, id: string): Promise<NotificationRecord | null>;
  markAllNotificationsRead(actor: Actor): Promise<{ updated: number }>;
  archiveNotification(actor: Actor, id: string): Promise<NotificationRecord | null>;
  snoozeNotification(actor: Actor, id: string, input: SnoozeNotificationInput): Promise<NotificationRecord | null>;
  reconcileNotifications(actor: Actor): Promise<NotificationReconcileResult>;
  getNextAction(actor: Actor, id: string): Promise<NextActionRecord | null>;
  createNextAction(actor: Actor, input: CreateNextActionInput): Promise<NextActionRecord>;
  updateNextAction(actor: Actor, id: string, input: UpdateNextActionInput): Promise<NextActionRecord | null>;
  completeNextAction(actor: Actor, id: string, input: CompleteNextActionInput): Promise<NextActionRecord | null>;
  postponeNextAction(actor: Actor, id: string, input: PostponeNextActionInput): Promise<NextActionRecord | null>;
  cancelNextAction(actor: Actor, id: string, input: CancelNextActionInput): Promise<NextActionRecord | null>;
  listPipelineStages(actor: Actor): Promise<PipelineStageRecord[]>;
  listLossReasons(actor: Actor): Promise<LossReasonRecord[]>;
  close(): Promise<void>;
};
