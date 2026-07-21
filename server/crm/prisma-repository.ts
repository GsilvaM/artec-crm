import { ApiError } from "../errors.js";
import { Prisma } from "../generated/prisma/client.js";
import type { CrmPrismaClient } from "../database/prisma.js";
import type {
  Actor,
  ActivityRecord,
  ApproveOpportunityInput,
  AuvoIntegrationStatusRecord,
  AuvoWebhookEventFilters,
  AuvoWebhookEventListRecord,
  AuvoWebhookEventRecord,
  CancelNextActionInput,
  CommercialCenterFilters,
  CommercialCenterRecord,
  CompleteNextActionInput,
  CreateActivityInput,
  CreateCustomerInput,
  CreateLossReasonInput,
  CreateNextActionInput,
  CreateOpportunityInput,
  CreatePipelineStageInput,
  CrmDataRepository,
  CustomerRecord,
  LossReasonAdminRecord,
  LossReasonRecord,
  MembershipCandidateRecord,
  NotificationFilters,
  NotificationListRecord,
  NotificationRecord,
  NotificationReconcileResult,
  NextActionPriority,
  NextActionRecord,
  OpportunityRecord,
  PipelineStageRecord,
  PostponeNextActionInput,
  QuoteRecord,
  QuoteStatus,
  CreateQuoteInput,
  UpdateQuoteInput,
  ReceiveAuvoWebhookEventInput,
  ReceiveAuvoWebhookEventResult,
  SnoozeNotificationInput,
  UpdateActivityInput,
  UpdateCustomerInput,
  UpdateNextActionInput,
  UpdateOpportunityInput,
  UpdatePipelineStageInput,
  UpsertMembershipInput,
} from "./types.js";
import type { CrmRole } from "../auth/rbac.js";
import { createWebhookPayloadHash, normalizeAuvoWebhookStatus, sanitizeWebhookPayload } from "./auvo-webhook.js";
import { assertActiveOpportunityHasNextAction, normalizePhone } from "./validation.js";

type PrismaExecutor = Pick<
  CrmPrismaClient,
  "activity" | "customer" | "lossReason" | "nextAction" | "notification" | "opportunity" | "pipelineStage" | "userMembership"
>;

type CustomerWithCount = Awaited<ReturnType<CrmPrismaClient["customer"]["findFirst"]>> & {
  _count?: { opportunities: number };
};

type OpportunityWithRelations = NonNullable<
  Awaited<ReturnType<CrmPrismaClient["opportunity"]["findFirst"]>>
> & {
  cliente: { nome: string };
  etapa: { nome: string };
  motivoPerda: { nome: string } | null;
};

type ActivityEntity = NonNullable<Awaited<ReturnType<CrmPrismaClient["activity"]["findFirst"]>>>;

type NextActionWithRelations = NonNullable<Awaited<ReturnType<CrmPrismaClient["nextAction"]["findFirst"]>>> & {
  customer: { nome: string };
  opportunity: { titulo: string; situacao: string | null } | null;
};

type NotificationEntity = NonNullable<Awaited<ReturnType<CrmPrismaClient["notification"]["findFirst"]>>>;
type AuvoWebhookEventEntity = NonNullable<Awaited<ReturnType<CrmPrismaClient["auvoWebhookEvent"]["findFirst"]>>>;

type NotificationPayload = {
  userId: string;
  type: NotificationRecord["type"];
  severity: NotificationRecord["severity"];
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  customerId: string | null;
  opportunityId: string | null;
  nextActionId: string | null;
  actionUrl: string;
  dedupeKey: string;
};

const opportunityInclude = {
  cliente: { select: { nome: true } },
  etapa: { select: { nome: true } },
  motivoPerda: { select: { nome: true } },
} as const;

const nextActionInclude = {
  customer: { select: { nome: true } },
  opportunity: { select: { titulo: true, situacao: true } },
} as const;

const STALLED_DAYS_THRESHOLD = 3;
const DUE_SOON_HOURS = 24;
const RESERVED_TERMINAL_STAGE_NAMES = new Set(["Aprovado", "Perdido"]);

const QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  rascunho: ["enviado"],
  enviado: ["revisado", "aprovado", "recusado", "expirado"],
  revisado: ["aprovado", "recusado", "expirado"],
  aprovado: [],
  recusado: [],
  expirado: [],
};

function mapQuote(row: {
  id: string;
  oportunidadeId: string;
  versao: number;
  valor: number;
  resumo: string | null;
  status: string;
  enviadoEm: Date | null;
  respondidoEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): QuoteRecord {
  return {
    id: row.id,
    opportunityId: row.oportunidadeId,
    versao: row.versao,
    valor: row.valor,
    resumo: row.resumo,
    status: row.status as QuoteStatus,
    enviadoEm: row.enviadoEm?.toISOString() ?? null,
    respondidoEm: row.respondidoEm?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function translatePipelineStageWriteError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return new ApiError(409, "bad_request", "Ja existe uma etapa com esse nome ou ordem.");
  }
  return error;
}

export class PrismaCrmDataRepository implements CrmDataRepository {
  constructor(private readonly prisma: CrmPrismaClient) {}

  async listCustomers(_actor: Actor, filters: { search?: string; archived?: boolean }): Promise<CustomerRecord[]> {
    const customers = await this.prisma.customer.findMany({
      where: {
        archivedAt: filters.archived ? { not: null } : null,
        ...(filters.search
          ? {
              OR: [
                { nome: { contains: filters.search, mode: "insensitive" } },
                { empresa: { contains: filters.search, mode: "insensitive" } },
                { telefoneNormalizado: normalizePhone(filters.search) },
              ],
            }
          : {}),
      },
      include: { _count: { select: { opportunities: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return Promise.all(customers.map((customer) => this.mapCustomer(customer)));
  }

  async getCustomer(_actor: Actor, id: string): Promise<CustomerRecord | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { _count: { select: { opportunities: true } } },
    });
    return customer ? this.mapCustomer(customer) : null;
  }

  async createCustomer(actor: Actor, input: CreateCustomerInput): Promise<CustomerRecord> {
    const created = await this.prisma.customer.create({
      data: {
        tipoPessoa: input.tipoPessoa,
        nome: input.nome,
        nomeFantasia: input.nomeFantasia ?? null,
        telefone: input.telefone ?? null,
        telefoneNormalizado: normalizePhone(input.telefone),
        email: input.email ?? null,
        documento: input.documento ?? null,
        empresa: input.empresa ?? null,
        bairro: input.bairro ?? null,
        cidade: input.cidade ?? null,
        estado: input.estado ?? null,
        observacoes: input.observacoes ?? null,
        auvoContactId: input.auvoContactId ?? null,
        createdBy: actor.id,
        updatedBy: actor.id,
      },
      select: { id: true },
    });

    return (await this.getCustomer(actor, created.id)) as CustomerRecord;
  }

  async updateCustomer(actor: Actor, id: string, input: UpdateCustomerInput): Promise<CustomerRecord | null> {
    const existing = await this.prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return null;

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(input.tipoPessoa !== undefined ? { tipoPessoa: input.tipoPessoa } : {}),
        ...(input.nome !== undefined ? { nome: input.nome } : {}),
        ...(input.nomeFantasia !== undefined ? { nomeFantasia: input.nomeFantasia } : {}),
        ...(input.telefone !== undefined ? { telefone: input.telefone, telefoneNormalizado: normalizePhone(input.telefone) } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.documento !== undefined ? { documento: input.documento } : {}),
        ...(input.empresa !== undefined ? { empresa: input.empresa } : {}),
        ...(input.bairro !== undefined ? { bairro: input.bairro } : {}),
        ...(input.cidade !== undefined ? { cidade: input.cidade } : {}),
        ...(input.estado !== undefined ? { estado: input.estado } : {}),
        ...(input.observacoes !== undefined ? { observacoes: input.observacoes } : {}),
        ...(input.auvoContactId !== undefined ? { auvoContactId: input.auvoContactId } : {}),
        updatedBy: actor.id,
      },
      include: { _count: { select: { opportunities: true } } },
    });

    return this.mapCustomer(updated);
  }

  async setCustomerArchived(actor: Actor, id: string, archived: boolean): Promise<CustomerRecord | null> {
    const existing = await this.prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return null;
    const customer = await this.prisma.customer.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null, updatedBy: actor.id },
      include: { _count: { select: { opportunities: true } } },
    });
    return this.mapCustomer(customer);
  }

  async listOpportunities(actor: Actor, filters: { search?: string; status?: string; etapaId?: string; responsavelId?: string }): Promise<OpportunityRecord[]> {
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        archivedAt: null,
        ...(actor.role === "vendedor" ? { responsavelId: actor.id } : {}),
        ...(filters.search
          ? {
              OR: [
                { titulo: { contains: filters.search, mode: "insensitive" } },
                { cliente: { nome: { contains: filters.search, mode: "insensitive" } } },
              ],
            }
          : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.etapaId ? { etapaId: filters.etapaId } : {}),
        ...(filters.responsavelId ? { responsavelId: filters.responsavelId } : {}),
      },
      include: opportunityInclude,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return opportunities.map(mapOpportunity);
  }

  async getOpportunity(actor: Actor, id: string): Promise<OpportunityRecord | null> {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: {
        id,
        ...(actor.role === "vendedor" ? { responsavelId: actor.id } : {}),
      },
      include: opportunityInclude,
    });
    return opportunity ? mapOpportunity(opportunity) : null;
  }

  async createOpportunity(actor: Actor, input: CreateOpportunityInput): Promise<OpportunityRecord> {
    const status = input.status ?? "ativa";
    assertActiveOpportunityHasNextAction({ ...input, status });
    await this.assertCustomerCanReceiveOpportunity(input.clienteId);
    await this.assertActiveResponsibleUser(input.responsavelId);
    await this.assertCanAssignResponsible(actor, input.responsavelId);
    const etapaId = input.etapaId ?? (await this.getFirstStageId());
    await this.assertStageExists(etapaId);

    const createdId = await this.prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.create({
        data: {
          clienteId: input.clienteId,
          titulo: input.titulo,
          descricao: input.descricao ?? null,
          tipoDemanda: input.tipoDemanda,
          origem: input.origem ?? null,
          responsavelId: input.responsavelId,
          etapaId,
          situacao: input.situacao,
          valorEstimado: input.valorEstimado ?? null,
          valorOrcamento: input.valorOrcamento ?? null,
          proximaAcao: input.proximaAcao ?? null,
          proximaAcaoEm: input.proximaAcaoEm ? new Date(input.proximaAcaoEm) : null,
          status,
          createdBy: actor.id,
          updatedBy: actor.id,
        },
        select: { id: true },
      });

      if (status === "ativa") {
        const nextAction = await tx.nextAction.create({
          data: {
            customerId: input.clienteId,
            opportunityId: opportunity.id,
            responsibleUserId: input.responsavelId,
            title: input.proximaAcao as string,
            dueAt: new Date(input.proximaAcaoEm as string),
            priority: "normal",
            status: "pending",
            createdBy: actor.id,
            updatedBy: actor.id,
          },
          select: { id: true },
        });
        await tx.opportunity.update({
          where: { id: opportunity.id },
          data: { currentNextActionId: nextAction.id },
        });
      }

      if (input.responsavelId !== actor.id) {
        await this.createAssignmentNotification({
          userId: input.responsavelId,
          type: "opportunity_assigned",
          severity: "attention",
          title: "Oportunidade atribuida a voce",
          body: `${input.titulo} foi atribuida ao seu usuario.`,
          entityType: "opportunity",
          entityId: opportunity.id,
          customerId: input.clienteId,
          opportunityId: opportunity.id,
          nextActionId: null,
          actionUrl: `/app/opportunities/${opportunity.id}`,
          dedupeKey: `opportunity-assigned:${opportunity.id}:${input.responsavelId}`,
        }, actor);
      }

      return opportunity.id;
    });

    return (await this.getOpportunity(actor, createdId)) as OpportunityRecord;
  }

  async updateOpportunity(actor: Actor, id: string, input: UpdateOpportunityInput): Promise<OpportunityRecord | null> {
    const current = await this.getOpportunity(actor, id);
    if (!current) return null;
    assertCanEditOpportunity(current);
    if (input.status === "ganha" || input.status === "perdida" || input.status === "arquivada") {
      throw new ApiError(409, "bad_request", "Use o fluxo proprio para aprovar, perder ou arquivar a oportunidade.");
    }
    if (input.clienteId) await this.assertCustomerCanReceiveOpportunity(input.clienteId);
    if (input.responsavelId) {
      await this.assertActiveResponsibleUser(input.responsavelId);
      await this.assertCanAssignResponsible(actor, input.responsavelId);
    }
    if (input.etapaId) await this.assertStageExists(input.etapaId);
    const merged = {
      status: input.status ?? current.status,
      responsavelId: input.responsavelId ?? current.responsavelId,
      proximaAcao: input.proximaAcao === undefined ? current.proximaAcao : input.proximaAcao,
      proximaAcaoEm: input.proximaAcaoEm === undefined ? current.proximaAcaoEm : input.proximaAcaoEm,
    };
    assertActiveOpportunityHasNextAction(merged);

    await this.prisma.$transaction(async (tx) => {
      await tx.opportunity.update({
        where: { id },
        data: {
          ...(input.clienteId !== undefined ? { clienteId: input.clienteId } : {}),
          ...(input.titulo !== undefined ? { titulo: input.titulo } : {}),
          ...(input.descricao !== undefined ? { descricao: input.descricao } : {}),
          ...(input.tipoDemanda !== undefined ? { tipoDemanda: input.tipoDemanda } : {}),
          ...(input.origem !== undefined ? { origem: input.origem } : {}),
          ...(input.responsavelId !== undefined ? { responsavelId: input.responsavelId } : {}),
          ...(input.etapaId !== undefined ? { etapaId: input.etapaId ?? current.etapaId } : {}),
          ...(input.situacao !== undefined ? { situacao: input.situacao } : {}),
          ...(input.valorEstimado !== undefined ? { valorEstimado: input.valorEstimado } : {}),
          ...(input.valorOrcamento !== undefined ? { valorOrcamento: input.valorOrcamento } : {}),
          ...(input.proximaAcao !== undefined ? { proximaAcao: input.proximaAcao } : {}),
          ...(input.proximaAcaoEm !== undefined ? { proximaAcaoEm: input.proximaAcaoEm ? new Date(input.proximaAcaoEm) : null } : {}),
          updatedBy: actor.id,
        },
      });

      const nextActionTouched = merged.status === "ativa" && (input.proximaAcao !== undefined || input.proximaAcaoEm !== undefined || input.responsavelId !== undefined || input.clienteId !== undefined);
      if (nextActionTouched) {
        const finalCustomerId = input.clienteId ?? current.clienteId;
        const finalResponsibleUserId = merged.responsavelId as string;
        const finalTitle = merged.proximaAcao as string;
        const finalDueAt = new Date(merged.proximaAcaoEm as string);

        if (current.currentNextActionId) {
          await tx.nextAction.updateMany({
            where: { id: current.currentNextActionId, status: "pending" },
            data: {
              customerId: finalCustomerId,
              responsibleUserId: finalResponsibleUserId,
              title: finalTitle,
              dueAt: finalDueAt,
              updatedBy: actor.id,
            },
          });
          await this.setCurrentNextAction(actor, id, current.currentNextActionId, finalTitle, finalDueAt, tx);
        } else {
          const created = await tx.nextAction.create({
            data: {
              customerId: finalCustomerId,
              opportunityId: id,
              responsibleUserId: finalResponsibleUserId,
              title: finalTitle,
              dueAt: finalDueAt,
              priority: "normal",
              status: "pending",
              createdBy: actor.id,
              updatedBy: actor.id,
            },
            select: { id: true },
          });
          await this.setCurrentNextAction(actor, id, created.id, finalTitle, finalDueAt, tx);
        }
        await this.resolveOpportunityNotifications(id, tx);
      }

      if (input.responsavelId && input.responsavelId !== current.responsavelId) {
        await this.createAssignmentNotification({
          userId: input.responsavelId,
          type: "opportunity_assigned",
          severity: "attention",
          title: "Oportunidade atribuida a voce",
          body: `${current.titulo} foi atribuida ao seu usuario.`,
          entityType: "opportunity",
          entityId: id,
          customerId: input.clienteId ?? current.clienteId,
          opportunityId: id,
          nextActionId: current.currentNextActionId,
          actionUrl: `/app/opportunities/${id}`,
          dedupeKey: `opportunity-assigned:${id}:${input.responsavelId}`,
        }, actor);
      }
    });

    return this.getOpportunity(actor, id);
  }

  async approveOpportunity(actor: Actor, id: string, input: ApproveOpportunityInput): Promise<OpportunityRecord | null> {
    const current = await this.getOpportunity(actor, id);
    if (!current) return null;
    assertCanTransition(current, "ganha");
    const stageId = await this.getStageIdByName("Aprovado");
    const installments = input.formaPagamento.toLocaleLowerCase("pt-BR").includes("vista") ? 1 : input.quantidadeParcelas;

    await this.prisma.$transaction(async (tx) => {
      await tx.opportunity.update({
        where: { id },
        data: {
          status: "ganha",
          etapaId: stageId,
          valorAprovado: input.valorAprovado,
          formaPagamento: input.formaPagamento,
          quantidadeParcelas: installments,
          previsaoExecucao: toDateOnly(input.previsaoExecucao),
          dataAprovacao: new Date(),
          currentNextActionId: null,
          proximaAcao: null,
          proximaAcaoEm: null,
          updatedBy: actor.id,
        },
      });
      await tx.activity.create({
        data: {
          clienteId: current.clienteId,
          oportunidadeId: id,
          tipo: "approval",
          title: "Oportunidade aprovada",
          corpo: `Valor aprovado: ${input.valorAprovado}. Forma de pagamento: ${input.formaPagamento}.`,
          occurredAt: new Date(),
          createdBy: actor.id,
          updatedBy: actor.id,
          source: "system",
          metadata: {},
        },
      });
      await this.resolveOpportunityNotifications(id, tx);
    });

    return this.getOpportunity(actor, id);
  }

  async loseOpportunity(actor: Actor, id: string, input: { motivoPerdaId: string }): Promise<OpportunityRecord | null> {
    const current = await this.getOpportunity(actor, id);
    if (!current) return null;
    assertCanTransition(current, "perdida");
    await this.assertActiveLossReason(input.motivoPerdaId);
    const stageId = await this.getStageIdByName("Perdido");

    await this.prisma.$transaction(async (tx) => {
      await tx.opportunity.update({
        where: { id },
        data: {
          status: "perdida",
          etapaId: stageId,
          motivoPerdaId: input.motivoPerdaId,
          dataPerda: new Date(),
          currentNextActionId: null,
          proximaAcao: null,
          proximaAcaoEm: null,
          updatedBy: actor.id,
        },
      });
      await tx.activity.create({
        data: {
          clienteId: current.clienteId,
          oportunidadeId: id,
          tipo: "loss",
          title: "Oportunidade perdida",
          corpo: "Perda registrada com motivo.",
          occurredAt: new Date(),
          createdBy: actor.id,
          updatedBy: actor.id,
          source: "system",
          metadata: {},
        },
      });
      await this.resolveOpportunityNotifications(id, tx);
    });

    return this.getOpportunity(actor, id);
  }

  async setOpportunityArchived(actor: Actor, id: string, archived: boolean): Promise<OpportunityRecord | null> {
    const current = await this.getOpportunity(actor, id);
    if (!current) return null;
    if (archived && current.archivedAt) return current;
    if (!archived && !current.archivedAt) return current;
    await this.prisma.$transaction(async (tx) => {
      await tx.opportunity.update({
        where: { id },
        data: { archivedAt: archived ? new Date() : null, updatedBy: actor.id },
      });
      if (archived) await this.resolveOpportunityNotifications(id, tx);
    });
    return this.getOpportunity(actor, id);
  }

  async listActivities(actor: Actor, filters: { customerId?: string; opportunityId?: string }): Promise<ActivityRecord[]> {
    const activities = await this.prisma.activity.findMany({
      where: {
        archivedAt: null,
        ...(filters.customerId ? { clienteId: filters.customerId } : {}),
        ...(filters.opportunityId ? { oportunidadeId: filters.opportunityId } : {}),
        ...(actor.role === "vendedor"
          ? {
              OR: [
                { createdBy: actor.id },
                { opportunity: { responsavelId: actor.id } },
              ],
            }
          : {}),
      },
      orderBy: { occurredAt: "desc" },
    });
    return activities.map(mapActivity);
  }

  async createActivity(actor: Actor, input: CreateActivityInput): Promise<ActivityRecord> {
    await this.assertCustomerOpportunityMatch(input.customerId, input.opportunityId ?? null);
    if (input.opportunityId) await this.assertCanAccessOpportunity(actor, input.opportunityId);
    const activity = await this.prisma.activity.create({
      data: {
        clienteId: input.customerId,
        oportunidadeId: input.opportunityId ?? null,
        tipo: input.type,
        title: input.title ?? null,
        corpo: input.description,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
        createdBy: actor.id,
        updatedBy: actor.id,
        source: input.source ?? "manual",
          metadata: toPrismaJson(input.metadata),
      },
    });
    return mapActivity(activity);
  }

  async updateActivity(actor: Actor, id: string, input: UpdateActivityInput): Promise<ActivityRecord | null> {
    const current = await this.findActivity(actor, id);
    if (!current) return null;
    const activity = await this.prisma.activity.update({
      where: { id },
      data: {
        ...(input.type !== undefined ? { tipo: input.type } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { corpo: input.description } : {}),
        ...(input.occurredAt !== undefined ? { occurredAt: input.occurredAt ? new Date(input.occurredAt) : current.occurredAt } : {}),
        ...(input.metadata !== undefined ? { metadata: toPrismaJson(input.metadata) } : {}),
        updatedBy: actor.id,
      },
    });
    return mapActivity(activity);
  }

  async setActivityArchived(actor: Actor, id: string, archived: boolean): Promise<ActivityRecord | null> {
    const current = await this.findActivity(actor, id);
    if (!current) return null;
    const activity = await this.prisma.activity.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null, updatedBy: actor.id },
    });
    return mapActivity(activity);
  }

  async listNextActions(
    actor: Actor,
    filters: {
      responsibleUserId?: string;
      status?: "pending" | "completed" | "cancelled";
      category?: "commercial" | "warranty" | "support" | "after_sales";
      overdue?: boolean;
      today?: boolean;
      future?: boolean;
      dateFrom?: string;
      dateTo?: string;
      customerId?: string;
      opportunityId?: string;
      priority?: NextActionPriority;
    },
  ): Promise<NextActionRecord[]> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const actions = await this.prisma.nextAction.findMany({
      where: {
        ...(actor.role === "vendedor" ? { responsibleUserId: actor.id } : {}),
        ...(filters.responsibleUserId ? { responsibleUserId: filters.responsibleUserId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        archivedAt: null,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(filters.opportunityId ? { opportunityId: filters.opportunityId } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.overdue ? { status: "pending", dueAt: { lt: now } } : {}),
        ...(filters.today ? { status: "pending", dueAt: { gte: startOfToday, lt: startOfTomorrow } } : {}),
        ...(filters.future ? { status: "pending", dueAt: { gte: startOfTomorrow } } : {}),
        ...(filters.dateFrom || filters.dateTo
          ? {
              dueAt: {
                ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
                ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
              },
            }
          : {}),
      },
      include: nextActionInclude,
      orderBy: { dueAt: "asc" },
    });
    return actions.map(mapNextAction);
  }

  async getCommercialCenter(actor: Actor, filters: CommercialCenterFilters): Promise<CommercialCenterRecord> {
    const now = new Date();
    const startOfToday = startOfLocalDay(now);
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const from = filters.from ? new Date(filters.from) : new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = filters.to ? new Date(filters.to) : now;
    const responsibleScope =
      actor.role === "vendedor"
        ? { responsavelId: actor.id }
        : actor.role === "gestor" && filters.responsibleUserId
          ? { responsavelId: filters.responsibleUserId }
          : {};
    const actionResponsibleScope =
      actor.role === "vendedor"
        ? { responsibleUserId: actor.id }
        : actor.role === "gestor" && filters.responsibleUserId
          ? { responsibleUserId: filters.responsibleUserId }
          : {};
    const opportunityFilters = {
      archivedAt: null,
      ...responsibleScope,
      ...(filters.stageId ? { etapaId: filters.stageId } : {}),
      ...(filters.situation ? { situacao: filters.situation } : {}),
      ...(filters.demandType ? { tipoDemanda: filters.demandType } : {}),
    };

    const [pendingActions, activeOpportunities, periodOpportunities, newCustomers] = await Promise.all([
      this.prisma.nextAction.findMany({
        where: {
          archivedAt: null,
          status: "pending",
          ...actionResponsibleScope,
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.priority ? { priority: filters.priority } : {}),
        },
        include: nextActionInclude,
        orderBy: { dueAt: "asc" },
        take: 200,
      }),
      this.prisma.opportunity.findMany({
        where: { ...opportunityFilters, status: "ativa" },
        include: opportunityInclude,
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      this.prisma.opportunity.findMany({
        where: {
          archivedAt: null,
          ...responsibleScope,
          createdAt: { gte: from, lte: to },
        },
        include: opportunityInclude,
        take: 500,
      }),
      this.prisma.customer.count({
        where: {
          archivedAt: null,
          createdAt: { gte: from, lte: to },
        },
      }),
    ]);

    const actionItems = pendingActions.map((action) => mapCommercialAction(action, now));
    const pendingById = new Map(pendingActions.map((action) => [action.id, action]));
    const activeItems = activeOpportunities.map((opportunity) => mapCommercialOpportunity(opportunity, now));
    const stalledCutoff = new Date(now.getTime() - STALLED_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);
    const approved = periodOpportunities.filter((opportunity) => opportunity.status === "ganha");
    const lost = periodOpportunities.filter((opportunity) => opportunity.status === "perdida");
    const approvedValue = approved.reduce((sum, opportunity) => sum + (opportunity.valorAprovado ?? 0), 0);
    const budgetValue = periodOpportunities.reduce((sum, opportunity) => sum + (opportunity.valorOrcamento ?? 0), 0);
    const closedCount = approved.length + lost.length;

    return {
      generatedAt: now.toISOString(),
      filters,
      overdueActions: actionItems.filter((action) => new Date(action.dueAt) < startOfToday).sort(sortCommercialActions),
      todayActions: actionItems.filter((action) => {
        const dueAt = new Date(action.dueAt);
        return dueAt >= startOfToday && dueAt < startOfTomorrow;
      }),
      opportunitiesWithoutNextAction: activeOpportunities
        .filter((opportunity) => !opportunity.currentNextActionId || !pendingById.has(opportunity.currentNextActionId))
        .map((opportunity) => mapCommercialOpportunity(opportunity, now)),
      quotesAwaitingReturn: activeItems.filter((opportunity) => ["Orcamento enviado", "Negociacao"].includes(opportunity.stageName)),
      upcomingVisits: actionItems.filter((action) => /visita/i.test(`${action.title} ${action.opportunitySituation ?? ""}`) && new Date(action.dueAt) >= startOfToday),
      stalledOpportunities: activeOpportunities
        .filter((opportunity) => {
          if (opportunity.updatedAt > stalledCutoff) return false;
          if (opportunity.proximaAcaoEm && new Date(opportunity.proximaAcaoEm) > now) return false;
          return true;
        })
        .map((opportunity) => mapCommercialOpportunity(opportunity, now)),
      auvoInbox: {
        status: "homologation",
        pending: 0,
        message: "Nenhum atendimento recebido do Auvo. A integracao ainda esta em homologacao.",
      },
      summary: {
        newCustomers,
        newOpportunities: periodOpportunities.length,
        approvedOpportunities: approved.length,
        lostOpportunities: lost.length,
        budgetValue,
        approvedValue,
        simpleConversionRate: closedCount ? approved.length / closedCount : 0,
        averageApprovedTicket: approved.length ? Math.round(approvedValue / approved.length) : 0,
      },
    };
  }

  async getNextAction(actor: Actor, id: string): Promise<NextActionRecord | null> {
    const action = await this.prisma.nextAction.findFirst({
      where: {
        id,
        ...(actor.role === "vendedor" ? { responsibleUserId: actor.id } : {}),
      },
      include: nextActionInclude,
    });
    return action ? mapNextAction(action) : null;
  }

  async listNotifications(actor: Actor, filters: NotificationFilters): Promise<NotificationListRecord> {
    const now = new Date();
    const limit = filters.limit ?? 20;
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: actor.id,
        ...(filters.status === "active"
          ? { status: { in: ["unread", "read"] }, archivedAt: null, resolvedAt: null, OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }] }
          : filters.status
            ? { status: filters.status }
            : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.severity ? { severity: filters.severity } : {}),
        ...(filters.from || filters.to
          ? {
              createdAt: {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(filters.to) } : {}),
              },
            }
          : {}),
        ...(filters.cursor ? { id: { lt: filters.cursor } } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const page = notifications.slice(0, limit);
    return {
      notifications: page.map(mapNotification),
      nextCursor: notifications.length > limit ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async getUnreadNotificationsCount(actor: Actor): Promise<{ count: number }> {
    const now = new Date();
    const count = await this.prisma.notification.count({
      where: {
        userId: actor.id,
        status: "unread",
        archivedAt: null,
        resolvedAt: null,
        OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
      },
    });
    return { count };
  }

  async markNotificationRead(actor: Actor, id: string): Promise<NotificationRecord | null> {
    const updated = await this.prisma.notification.updateManyAndReturn({
      where: { id, userId: actor.id, archivedAt: null, resolvedAt: null },
      data: { status: "read", readAt: new Date(), updatedAt: new Date() },
    });
    return updated[0] ? mapNotification(updated[0]) : null;
  }

  async markAllNotificationsRead(actor: Actor): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId: actor.id, status: "unread", archivedAt: null, resolvedAt: null },
      data: { status: "read", readAt: new Date(), updatedAt: new Date() },
    });
    return { updated: result.count };
  }

  async archiveNotification(actor: Actor, id: string): Promise<NotificationRecord | null> {
    const updated = await this.prisma.notification.updateManyAndReturn({
      where: { id, userId: actor.id, resolvedAt: null },
      data: { status: "archived", archivedAt: new Date(), updatedAt: new Date() },
    });
    return updated[0] ? mapNotification(updated[0]) : null;
  }

  async snoozeNotification(actor: Actor, id: string, input: SnoozeNotificationInput): Promise<NotificationRecord | null> {
    const updated = await this.prisma.notification.updateManyAndReturn({
      where: { id, userId: actor.id, archivedAt: null, resolvedAt: null },
      data: { snoozedUntil: new Date(input.snoozedUntil), updatedAt: new Date() },
    });
    return updated[0] ? mapNotification(updated[0]) : null;
  }

  async reconcileNotifications(actor: Actor): Promise<NotificationReconcileResult> {
    if (actor.role !== "gestor") throw new ApiError(403, "forbidden", "Apenas gestor pode reconciliar notificacoes.");
    const now = new Date();
    const dueSoonUntil = new Date(now.getTime() + DUE_SOON_HOURS * 60 * 60 * 1000);
    const stalledCutoff = new Date(now.getTime() - STALLED_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);
    const desired = new Map<string, Parameters<typeof buildNotificationPayload>[0]>();

    const pendingActions = await this.prisma.nextAction.findMany({
      where: { status: "pending", archivedAt: null },
      include: nextActionInclude,
      take: 500,
    });

    for (const action of pendingActions) {
      if (action.dueAt < now) {
        desired.set(`overdue-next-action:${action.id}`, {
          userId: action.responsibleUserId,
          type: "overdue_next_action",
          severity: "urgent",
          title: "Proxima acao vencida",
          body: `${action.title} venceu em ${action.dueAt.toISOString()}.`,
          entityType: "next_action",
          entityId: action.id,
          customerId: action.customerId,
          opportunityId: action.opportunityId,
          nextActionId: action.id,
          actionUrl: `/app/next-actions/${action.id}`,
          dedupeKey: `overdue-next-action:${action.id}`,
        });
      } else if (action.dueAt <= dueSoonUntil) {
        desired.set(`due-soon-next-action:${action.id}`, {
          userId: action.responsibleUserId,
          type: "due_soon_next_action",
          severity: "attention",
          title: "Proxima acao chegando ao prazo",
          body: `${action.title} vence em ate ${DUE_SOON_HOURS} horas.`,
          entityType: "next_action",
          entityId: action.id,
          customerId: action.customerId,
          opportunityId: action.opportunityId,
          nextActionId: action.id,
          actionUrl: `/app/next-actions/${action.id}`,
          dedupeKey: `due-soon-next-action:${action.id}`,
        });
      }
    }

    const activeOpportunities = await this.prisma.opportunity.findMany({
      where: { status: "ativa", archivedAt: null },
      include: opportunityInclude,
      take: 500,
    });

    for (const opportunity of activeOpportunities) {
      const hasFutureAction = opportunity.proximaAcao && opportunity.proximaAcaoEm && opportunity.proximaAcaoEm >= now;
      if (!opportunity.currentNextActionId || !opportunity.proximaAcao || !opportunity.proximaAcaoEm) {
        desired.set(`missing-next-action:${opportunity.id}`, {
          userId: opportunity.responsavelId,
          type: "missing_next_action",
          severity: "urgent",
          title: "Oportunidade sem acompanhamento",
          body: `${opportunity.titulo} precisa de proxima acao valida.`,
          entityType: "opportunity",
          entityId: opportunity.id,
          customerId: opportunity.clienteId,
          opportunityId: opportunity.id,
          nextActionId: null,
          actionUrl: `/app/opportunities/${opportunity.id}`,
          dedupeKey: `missing-next-action:${opportunity.id}`,
        });
      } else if (!hasFutureAction && opportunity.updatedAt <= stalledCutoff) {
        desired.set(`stalled-opportunity:${opportunity.id}`, {
          userId: opportunity.responsavelId,
          type: "stalled_opportunity",
          severity: "attention",
          title: "Oportunidade parada",
          body: `${opportunity.titulo} esta sem movimentacao recente.`,
          entityType: "opportunity",
          entityId: opportunity.id,
          customerId: opportunity.clienteId,
          opportunityId: opportunity.id,
          nextActionId: opportunity.currentNextActionId,
          actionUrl: `/app/opportunities/${opportunity.id}`,
          dedupeKey: `stalled-opportunity:${opportunity.id}`,
        });
      }
    }

    let generated = 0;
    let updated = 0;
    for (const payload of desired.values()) {
      const result = await this.upsertOpenNotification(payload);
      if (result === "created") generated += 1;
      if (result === "updated") updated += 1;
    }

    const open = await this.prisma.notification.findMany({
      where: {
        status: { in: ["unread", "read"] },
        archivedAt: null,
        resolvedAt: null,
        type: { in: ["overdue_next_action", "due_soon_next_action", "missing_next_action", "stalled_opportunity"] },
      },
      select: { id: true, dedupeKey: true },
      take: 1000,
    });
    const staleIds = open.filter((notification) => notification.dedupeKey && !desired.has(notification.dedupeKey)).map((notification) => notification.id);
    const resolved = staleIds.length
      ? (await this.prisma.notification.updateMany({
          where: { id: { in: staleIds } },
          data: { status: "resolved", resolvedAt: new Date(), updatedAt: new Date() },
        })).count
      : 0;

    return { generated, updated, resolved };
  }

  async receiveAuvoWebhookEvent(input: ReceiveAuvoWebhookEventInput): Promise<ReceiveAuvoWebhookEventResult> {
    const payloadHash = createWebhookPayloadHash(input.payload);
    const dedupeKey = `payload-hash:${payloadHash}`;
    const existing = await this.prisma.auvoWebhookEvent.findUnique({ where: { dedupeKey } });
    if (existing) return { event: mapAuvoWebhookEvent(existing), duplicate: true };

    const eventType = inferEventType(input.payload);
    const outOfScope = isOutOfScopeAuvoEventType(eventType);

    const event = await this.prisma.auvoWebhookEvent.create({
      data: {
        provider: "auvo",
        externalEventId: inferExternalEventId(input.payload),
        eventType,
        dedupeKey,
        status: outOfScope ? "ignored" : "received",
        ignoredAt: outOfScope ? new Date() : null,
        lastError: outOfScope ? "Tipo de evento fora do escopo do MVP; payload nao armazenado." : null,
        sanitizedHeadersJson: input.headers,
        rawPayloadJson: outOfScope ? ({ eventType, outOfScope: true } as Prisma.InputJsonValue) : (input.payload as Prisma.InputJsonValue),
        payloadHash,
        sourceIpHash: input.sourceIpHash,
        contentLength: input.contentLength,
        schemaVersion: 1,
      },
    });

    return { event: mapAuvoWebhookEvent(event), duplicate: false };
  }

  async listAuvoWebhookEvents(_actor: Actor, filters: AuvoWebhookEventFilters): Promise<AuvoWebhookEventListRecord> {
    const limit = filters.limit ?? 20;
    const where: Prisma.AuvoWebhookEventWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.eventType ? { eventType: filters.eventType } : {}),
      ...(filters.from || filters.to
        ? {
            receivedAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
      ...(filters.cursor ? { id: { lt: filters.cursor } } : {}),
    };

    const events = await this.prisma.auvoWebhookEvent.findMany({
      where,
      orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const page = events.slice(0, limit);
    return {
      events: page.map(mapAuvoWebhookEvent),
      nextCursor: events.length > limit ? page.at(-1)?.id ?? null : null,
    };
  }

  async getAuvoWebhookEvent(_actor: Actor, id: string): Promise<AuvoWebhookEventRecord | null> {
    const event = await this.prisma.auvoWebhookEvent.findUnique({ where: { id } });
    return event ? mapAuvoWebhookEvent(event) : null;
  }

  async reprocessAuvoWebhookEvent(_actor: Actor, id: string): Promise<AuvoWebhookEventRecord | null> {
    const current = await this.prisma.auvoWebhookEvent.findUnique({ where: { id } });
    if (!current) return null;
    if (current.status === "processed") throw new ApiError(409, "bad_request", "Evento ja processado nao pode voltar para a fila.");

    const updated = await this.prisma.auvoWebhookEvent.update({
      where: { id },
      data: {
        status: "received",
        attemptCount: { increment: 1 },
        lastError: null,
        processingStartedAt: null,
        processedAt: null,
        ignoredAt: null,
        nextRetryAt: null,
        updatedAt: new Date(),
      },
    });
    return mapAuvoWebhookEvent(updated);
  }

  async ignoreAuvoWebhookEvent(_actor: Actor, id: string): Promise<AuvoWebhookEventRecord | null> {
    const current = await this.prisma.auvoWebhookEvent.findUnique({ where: { id } });
    if (!current) return null;
    if (current.status === "processed") throw new ApiError(409, "bad_request", "Evento ja processado nao pode ser ignorado.");

    const updated = await this.prisma.auvoWebhookEvent.update({
      where: { id },
      data: { status: "ignored", ignoredAt: new Date(), updatedAt: new Date() },
    });
    return mapAuvoWebhookEvent(updated);
  }

  async getAuvoIntegrationStatus(_actor: Actor, configured: boolean): Promise<AuvoIntegrationStatusRecord> {
    const [lastReceived, lastProcessed, pendingCount, failedCount, recentEvents] = await Promise.all([
      this.prisma.auvoWebhookEvent.findFirst({ orderBy: { receivedAt: "desc" } }),
      this.prisma.auvoWebhookEvent.findFirst({ where: { status: "processed" }, orderBy: { processedAt: "desc" } }),
      this.prisma.auvoWebhookEvent.count({ where: { status: { in: ["received", "processing"] } } }),
      this.prisma.auvoWebhookEvent.count({ where: { status: "failed" } }),
      this.prisma.auvoWebhookEvent.findMany({ orderBy: [{ receivedAt: "desc" }, { id: "desc" }], take: 5 }),
    ]);

    return {
      configured,
      lastReceivedAt: lastReceived?.receivedAt.toISOString() ?? null,
      lastProcessedAt: lastProcessed?.processedAt?.toISOString() ?? null,
      pendingCount,
      failedCount,
      recentEvents: recentEvents.map(mapAuvoWebhookEvent),
    };
  }

  async createNextAction(actor: Actor, input: CreateNextActionInput): Promise<NextActionRecord> {
    await this.assertCustomerOpportunityMatch(input.customerId, input.opportunityId ?? null);
    await this.assertActiveResponsibleUser(input.responsibleUserId);
    await this.assertCanWriteNextAction(actor, input.responsibleUserId, input.opportunityId ?? null);
    const id = await this.prisma.$transaction(async (tx) => {
      const action = await tx.nextAction.create({
        data: {
          customerId: input.customerId,
          opportunityId: input.opportunityId ?? null,
          responsibleUserId: input.responsibleUserId,
          category: input.category ?? "commercial",
          title: input.title,
          description: input.description ?? null,
          dueAt: new Date(input.dueAt),
          priority: input.priority ?? "normal",
          status: "pending",
          createdBy: actor.id,
          updatedBy: actor.id,
        },
        select: { id: true },
      });
      if (input.opportunityId) {
        const opportunity = await this.getOpportunity(actor, input.opportunityId);
        if (opportunity?.status === "ativa" && opportunity.archivedAt === null) {
          await this.setCurrentNextAction(actor, input.opportunityId, action.id, input.title, new Date(input.dueAt), tx);
          await this.resolveOpportunityNotifications(input.opportunityId, tx);
        }
      }
      return action.id;
    });
    if (input.responsibleUserId !== actor.id) {
      await this.createAssignmentNotification({
        userId: input.responsibleUserId,
        type: "next_action_reassigned",
        severity: "attention",
        title: "Proxima acao atribuida a voce",
        body: `${input.title} foi atribuida ao seu usuario.`,
        entityType: "next_action",
        entityId: id,
        customerId: input.customerId,
        opportunityId: input.opportunityId ?? null,
        nextActionId: id,
        actionUrl: `/app/next-actions/${id}`,
        dedupeKey: `next-action-reassigned:${id}:${input.responsibleUserId}`,
      }, actor);
    }
    return (await this.getNextAction(actor, id)) as NextActionRecord;
  }

  async updateNextAction(actor: Actor, id: string, input: UpdateNextActionInput): Promise<NextActionRecord | null> {
    const current = await this.getNextAction(actor, id);
    if (!current || current.status !== "pending") return null;
    const finalCustomerId = input.customerId ?? current.customerId;
    const finalOpportunityId = input.opportunityId === undefined ? current.opportunityId : input.opportunityId;
    const finalResponsibleUserId = input.responsibleUserId ?? current.responsibleUserId;
    await this.assertCustomerOpportunityMatch(finalCustomerId, finalOpportunityId ?? null);
    await this.assertActiveResponsibleUser(finalResponsibleUserId);
    await this.assertCanWriteNextAction(actor, finalResponsibleUserId, finalOpportunityId ?? null);
    if (current.opportunityId) await this.assertCanMoveCurrentAction(actor, current, finalOpportunityId ?? null);

    await this.prisma.$transaction(async (tx) => {
      await tx.nextAction.update({
        where: { id },
        data: {
          ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
          ...(input.opportunityId !== undefined ? { opportunityId: input.opportunityId } : {}),
          ...(input.responsibleUserId !== undefined ? { responsibleUserId: input.responsibleUserId } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.dueAt !== undefined ? { dueAt: new Date(input.dueAt) } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          updatedBy: actor.id,
        },
      });
      if (input.dueAt !== undefined || input.responsibleUserId !== undefined) {
        await this.resolveNextActionNotifications(id, tx);
      }
    });

    const updated = await this.getNextAction(actor, id);
    if (updated?.opportunityId) {
      const opportunity = await this.getOpportunity(actor, updated.opportunityId);
      if (opportunity?.status === "ativa" && opportunity.currentNextActionId === updated.id && opportunity.archivedAt === null) {
        await this.setCurrentNextAction(actor, updated.opportunityId, updated.id, updated.title, new Date(updated.dueAt));
      }
    }
    if (updated && input.responsibleUserId && input.responsibleUserId !== current.responsibleUserId && input.responsibleUserId !== actor.id) {
      await this.createAssignmentNotification({
        userId: input.responsibleUserId,
        type: "next_action_reassigned",
        severity: "attention",
        title: "Proxima acao reatribuida a voce",
        body: `${updated.title} foi reatribuida ao seu usuario.`,
        entityType: "next_action",
        entityId: updated.id,
        customerId: updated.customerId,
        opportunityId: updated.opportunityId,
        nextActionId: updated.id,
        actionUrl: `/app/next-actions/${updated.id}`,
        dedupeKey: `next-action-reassigned:${updated.id}:${input.responsibleUserId}`,
      }, actor);
    }
    return updated;
  }

  async completeNextAction(actor: Actor, id: string, input: CompleteNextActionInput): Promise<NextActionRecord | null> {
    return this.closePendingNextAction(actor, id, "completed", input);
  }

  async postponeNextAction(actor: Actor, id: string, input: PostponeNextActionInput): Promise<NextActionRecord | null> {
    const current = await this.getNextAction(actor, id);
    if (!current || current.status !== "pending") return null;
    await this.assertCanWriteNextAction(actor, current.responsibleUserId, current.opportunityId);
    await this.prisma.$transaction(async (tx) => {
      await tx.nextAction.update({
        where: { id },
        data: { postponedFrom: new Date(current.dueAt), dueAt: new Date(input.dueAt), updatedBy: actor.id },
      });
      if (current.opportunityId) await this.setCurrentNextAction(actor, current.opportunityId, current.id, current.title, new Date(input.dueAt), tx);
      await this.resolveNextActionNotifications(id, tx);
      await tx.activity.create({
        data: {
          clienteId: current.customerId,
          oportunidadeId: current.opportunityId,
          tipo: "follow_up",
          title: "Proxima acao reagendada",
          corpo: `Reagendada para ${input.dueAt}.`,
          occurredAt: new Date(),
          createdBy: actor.id,
          updatedBy: actor.id,
          source: "system",
          metadata: {},
        },
      });
    });
    return this.getNextAction(actor, id);
  }

  async cancelNextAction(actor: Actor, id: string, input: CancelNextActionInput): Promise<NextActionRecord | null> {
    return this.closePendingNextAction(actor, id, "cancelled", input);
  }

  async listPipelineStages(): Promise<PipelineStageRecord[]> {
    const stages = await this.prisma.pipelineStage.findMany({ orderBy: { ordem: "asc" } });
    return stages.map((stage) => ({ id: stage.id, nome: stage.nome, ordem: stage.ordem, isTerminal: stage.isTerminal }));
  }

  async listLossReasons(): Promise<LossReasonRecord[]> {
    return this.prisma.lossReason.findMany({
      where: { isActive: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
  }

  async createPipelineStage(_actor: Actor, input: CreatePipelineStageInput): Promise<PipelineStageRecord> {
    const nome = input.nome.trim();
    if (RESERVED_TERMINAL_STAGE_NAMES.has(nome)) {
      throw new ApiError(409, "bad_request", "Esse nome de etapa e reservado pelo fluxo de aprovar/perder.");
    }
    try {
      const stage = await this.prisma.pipelineStage.create({
        data: { nome, ordem: input.ordem, isTerminal: false },
      });
      return { id: stage.id, nome: stage.nome, ordem: stage.ordem, isTerminal: stage.isTerminal };
    } catch (error) {
      throw translatePipelineStageWriteError(error);
    }
  }

  async updatePipelineStage(_actor: Actor, id: string, input: UpdatePipelineStageInput): Promise<PipelineStageRecord | null> {
    const current = await this.prisma.pipelineStage.findUnique({ where: { id } });
    if (!current) return null;

    if (input.nome !== undefined) {
      const nextName = input.nome.trim();
      if (current.isTerminal && nextName !== current.nome) {
        throw new ApiError(409, "bad_request", "Etapas terminais nao podem ser renomeadas: o fluxo de aprovar/perder depende do nome exato das etapas terminais.");
      }
      if (!current.isTerminal && RESERVED_TERMINAL_STAGE_NAMES.has(nextName)) {
        throw new ApiError(409, "bad_request", "Esse nome de etapa e reservado pelo fluxo de aprovar/perder.");
      }
    }

    try {
      const stage = await this.prisma.pipelineStage.update({
        where: { id },
        data: {
          nome: input.nome !== undefined ? input.nome.trim() : undefined,
          ordem: input.ordem,
        },
      });
      return { id: stage.id, nome: stage.nome, ordem: stage.ordem, isTerminal: stage.isTerminal };
    } catch (error) {
      throw translatePipelineStageWriteError(error);
    }
  }

  async listLossReasonsAdmin(): Promise<LossReasonAdminRecord[]> {
    return this.prisma.lossReason.findMany({
      select: { id: true, nome: true, isActive: true },
      orderBy: { nome: "asc" },
    });
  }

  async createLossReason(_actor: Actor, input: CreateLossReasonInput): Promise<LossReasonAdminRecord> {
    const nome = input.nome.trim();
    const existing = await this.prisma.lossReason.findUnique({ where: { nome } });
    if (existing) {
      throw new ApiError(409, "bad_request", "Ja existe um motivo de perda com esse nome.");
    }
    const reason = await this.prisma.lossReason.create({ data: { nome, isActive: true } });
    return { id: reason.id, nome: reason.nome, isActive: reason.isActive };
  }

  async setLossReasonActive(_actor: Actor, id: string, isActive: boolean): Promise<LossReasonAdminRecord | null> {
    const current = await this.prisma.lossReason.findUnique({ where: { id } });
    if (!current) return null;
    const reason = await this.prisma.lossReason.update({ where: { id }, data: { isActive } });
    return { id: reason.id, nome: reason.nome, isActive: reason.isActive };
  }

  async listMembershipCandidates(): Promise<MembershipCandidateRecord[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ user_id: string; email: string | null; role: string | null; is_active: boolean | null }>
    >`
      SELECT u.id AS user_id, u.email AS email, m.role AS role, m.is_active AS is_active
      FROM auth.users u
      LEFT JOIN crm.user_memberships m ON m.user_id = u.id
      ORDER BY u.email ASC NULLS LAST
    `;

    return rows.map((row) => ({
      userId: row.user_id,
      email: row.email,
      hasMembership: row.role !== null,
      role: row.role as CrmRole | null,
      isActive: row.is_active,
    }));
  }

  async upsertMembership(actor: Actor, userId: string, input: UpsertMembershipInput): Promise<MembershipCandidateRecord> {
    if (actor.id === userId && !input.isActive) {
      throw new ApiError(409, "bad_request", "Voce nao pode desativar sua propria membership.");
    }

    const emailRows = await this.prisma.$queryRaw<Array<{ email: string | null }>>`
      SELECT email FROM auth.users WHERE id = ${userId}::uuid
    `;
    if (!emailRows.length) {
      throw new ApiError(422, "bad_request", "Usuario nao encontrado no Supabase Auth.");
    }

    await this.prisma.userMembership.upsert({
      where: { userId },
      create: { userId, role: input.role, isActive: input.isActive, createdBy: actor.id, updatedBy: actor.id },
      update: { role: input.role, isActive: input.isActive, updatedBy: actor.id },
    });

    return {
      userId,
      email: emailRows[0]?.email ?? null,
      hasMembership: true,
      role: input.role,
      isActive: input.isActive,
    };
  }

  async listQuotes(actor: Actor, opportunityId: string): Promise<QuoteRecord[]> {
    const opportunity = await this.getOpportunity(actor, opportunityId);
    if (!opportunity) return [];

    const quotes = await this.prisma.quote.findMany({
      where: { oportunidadeId: opportunityId },
      orderBy: { versao: "desc" },
    });
    return quotes.map(mapQuote);
  }

  async createQuote(actor: Actor, input: CreateQuoteInput): Promise<QuoteRecord> {
    const opportunity = await this.getOpportunity(actor, input.opportunityId);
    if (!opportunity) throw new ApiError(404, "not_found", "Oportunidade nao encontrada.");
    assertCanEditOpportunity(opportunity);

    const quote = await this.prisma.$transaction(async (tx) => {
      const latest = await tx.quote.findFirst({
        where: { oportunidadeId: input.opportunityId },
        orderBy: { versao: "desc" },
        select: { versao: true },
      });
      return tx.quote.create({
        data: {
          oportunidadeId: input.opportunityId,
          versao: (latest?.versao ?? 0) + 1,
          valor: input.valor,
          resumo: input.resumo ?? null,
          status: "rascunho",
          createdBy: actor.id,
        },
      });
    });

    return mapQuote(quote);
  }

  async updateQuote(actor: Actor, id: string, input: UpdateQuoteInput): Promise<QuoteRecord | null> {
    const current = await this.prisma.quote.findUnique({ where: { id } });
    if (!current) return null;

    const nextStatus = input.status ?? (current.status as QuoteStatus);
    if (input.status && input.status !== current.status) {
      const allowed = QUOTE_STATUS_TRANSITIONS[current.status as QuoteStatus] ?? [];
      if (!allowed.includes(input.status)) {
        throw new ApiError(409, "bad_request", `Nao e possivel mover o orcamento de "${current.status}" para "${input.status}".`);
      }
    }
    if ((input.valor !== undefined || input.resumo !== undefined) && current.status !== "rascunho") {
      throw new ApiError(409, "bad_request", "Somente orcamentos em rascunho podem ter valor ou resumo alterados.");
    }

    const now = new Date();
    const enviadoEm = nextStatus === "enviado" && current.status === "rascunho" ? now : current.enviadoEm;
    const respondidoEm =
      ["aprovado", "recusado", "expirado"].includes(nextStatus) && current.respondidoEm === null ? now : current.respondidoEm;

    const quote = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.quote.update({
        where: { id },
        data: {
          valor: input.valor,
          resumo: input.resumo,
          status: nextStatus,
          enviadoEm,
          respondidoEm,
          updatedBy: actor.id,
        },
      });

      if (nextStatus === "enviado" && current.status === "rascunho") {
        await tx.opportunity.update({
          where: { id: current.oportunidadeId },
          data: { valorOrcamento: updated.valor, dataOrcamento: now, updatedBy: actor.id },
        });
      }

      return updated;
    });

    return mapQuote(quote);
  }

  async close(): Promise<void> {
    return undefined;
  }

  private async mapCustomer(customer: NonNullable<CustomerWithCount>): Promise<CustomerRecord> {
    const duplicates = customer.telefoneNormalizado
      ? await this.prisma.customer.findMany({
          where: {
            telefoneNormalizado: customer.telefoneNormalizado,
            id: { not: customer.id },
          },
          select: { id: true },
        })
      : [];
    return {
      id: customer.id,
      tipoPessoa: customer.tipoPessoa as CustomerRecord["tipoPessoa"],
      nome: customer.nome,
      nomeFantasia: customer.nomeFantasia,
      telefone: customer.telefone,
      telefoneNormalizado: customer.telefoneNormalizado,
      email: customer.email,
      documento: customer.documento,
      empresa: customer.empresa,
      bairro: customer.bairro,
      cidade: customer.cidade,
      estado: customer.estado,
      observacoes: customer.observacoes,
      auvoContactId: customer.auvoContactId,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      createdBy: customer.createdBy,
      updatedBy: customer.updatedBy,
      archivedAt: customer.archivedAt?.toISOString() ?? null,
      opportunitiesCount: customer._count?.opportunities ?? 0,
      duplicatePhoneCustomerIds: duplicates.map((duplicate) => duplicate.id),
    };
  }

  private async findActivity(actor: Actor, id: string): Promise<ActivityRecord | null> {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id,
        ...(actor.role === "vendedor"
          ? {
              OR: [
                { createdBy: actor.id },
                { opportunity: { responsavelId: actor.id } },
              ],
            }
          : {}),
      },
    });
    return activity ? mapActivity(activity) : null;
  }

  private async assertCustomerOpportunityMatch(customerId: string, opportunityId: string | null): Promise<void> {
    await this.assertCustomerExists(customerId);
    if (!opportunityId) return;
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id: opportunityId, clienteId: customerId },
      select: { id: true },
    });
    if (!opportunity) throw new ApiError(400, "bad_request", "A oportunidade informada nao pertence ao cliente.");
  }

  private async assertCustomerExists(customerId: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });
    if (!customer) throw new ApiError(422, "bad_request", "Cliente informado nao existe.");
  }

  private async assertCanAccessOpportunity(actor: Actor, opportunityId: string | null): Promise<void> {
    if (!opportunityId || actor.role !== "vendedor") return;
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id: opportunityId, responsavelId: actor.id },
      select: { id: true },
    });
    if (!opportunity) throw new ApiError(403, "forbidden", "Usuario sem permissao para esta oportunidade.");
  }

  private async assertCustomerCanReceiveOpportunity(customerId: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, archivedAt: true },
    });
    if (!customer) throw new ApiError(422, "bad_request", "Cliente informado nao existe.");
    if (customer.archivedAt) {
      throw new ApiError(409, "bad_request", "Restaure o cliente antes de criar ou mover uma oportunidade.");
    }
  }

  private async assertStageExists(stageId: string): Promise<void> {
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id: stageId },
      select: { id: true, isTerminal: true },
    });
    if (!stage) throw new ApiError(422, "bad_request", "Etapa informada nao existe.");
    if (stage.isTerminal) {
      throw new ApiError(409, "bad_request", "Etapas terminais so podem ser atingidas pelo fluxo de aprovar ou perder a oportunidade.");
    }
  }

  private async assertActiveLossReason(lossReasonId: string): Promise<void> {
    const reason = await this.prisma.lossReason.findFirst({
      where: { id: lossReasonId, isActive: true },
      select: { id: true },
    });
    if (!reason) throw new ApiError(422, "bad_request", "Motivo de perda informado nao existe ou esta inativo.");
  }

  private async assertCanAssignResponsible(actor: Actor, responsibleUserId: string): Promise<void> {
    if (actor.role !== "vendedor") return;
    if (responsibleUserId !== actor.id) {
      throw new ApiError(403, "forbidden", "Vendedor nao pode atribuir oportunidade para outro responsavel.");
    }
  }

  private async assertCanWriteNextAction(actor: Actor, responsibleUserId: string, opportunityId: string | null): Promise<void> {
    if (actor.role === "gestor" || actor.role === "atendimento") return;
    if (responsibleUserId !== actor.id) throw new ApiError(403, "forbidden", "Vendedor nao pode alterar acoes de outro responsavel.");
    await this.assertCanAccessOpportunity(actor, opportunityId);
  }

  private async assertActiveResponsibleUser(userId: string): Promise<void> {
    const membership = await this.prisma.userMembership.findFirst({
      where: { userId, isActive: true },
      select: { userId: true },
    });
    if (!membership) throw new ApiError(422, "bad_request", "Informe um responsavel ativo no CRM.");
  }

  private async assertCanMoveCurrentAction(actor: Actor, action: NextActionRecord, nextOpportunityId: string | null): Promise<void> {
    if (!action.opportunityId || action.opportunityId === nextOpportunityId) return;
    const opportunity = await this.getOpportunity(actor, action.opportunityId);
    if (opportunity?.status === "ativa" && opportunity.currentNextActionId === action.id && opportunity.archivedAt === null) {
      throw new ApiError(409, "bad_request", "Nao altere a oportunidade da proxima acao atual. Crie outra acao antes.");
    }
  }

  private async setCurrentNextAction(
    actor: Actor,
    opportunityId: string,
    nextActionId: string | null,
    title: string | null,
    dueAt: Date | null,
    executor: PrismaExecutor = this.prisma,
  ): Promise<void> {
    await executor.opportunity.update({
      where: { id: opportunityId },
      data: {
        currentNextActionId: nextActionId,
        proximaAcao: title,
        proximaAcaoEm: dueAt,
        updatedBy: actor.id,
      },
    });
  }

  private async getFirstStageId(): Promise<string> {
    const stage = await this.prisma.pipelineStage.findFirst({ orderBy: { ordem: "asc" }, select: { id: true } });
    if (!stage) throw new Error("pipeline_stage_missing");
    return stage.id;
  }

  private async getStageIdByName(nome: string): Promise<string> {
    const stage = await this.prisma.pipelineStage.findFirst({ where: { nome }, select: { id: true } });
    if (!stage) throw new Error("pipeline_stage_missing");
    return stage.id;
  }

  private async upsertOpenNotification(payload: NotificationPayload): Promise<"created" | "updated"> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId: payload.userId,
        dedupeKey: payload.dedupeKey,
        status: { in: ["unread", "read"] },
        archivedAt: null,
        resolvedAt: null,
      },
      select: { id: true },
    });

    const data = buildNotificationPayload(payload);
    if (existing) {
      await this.prisma.notification.update({ where: { id: existing.id }, data });
      return "updated";
    }

    await this.prisma.notification.create({ data });
    return "created";
  }

  private async createAssignmentNotification(payload: NotificationPayload, actor: Actor): Promise<void> {
    if (payload.userId === actor.id) return;
    await this.upsertOpenNotification(payload);
  }

  private async resolveNextActionNotifications(nextActionId: string, tx: PrismaExecutor = this.prisma): Promise<void> {
    await tx.notification.updateMany({
      where: {
        nextActionId,
        status: { in: ["unread", "read"] },
        archivedAt: null,
        resolvedAt: null,
      },
      data: { status: "resolved", resolvedAt: new Date(), updatedAt: new Date() },
    });
  }

  private async resolveOpportunityNotifications(opportunityId: string, tx: PrismaExecutor = this.prisma): Promise<void> {
    await tx.notification.updateMany({
      where: {
        opportunityId,
        status: { in: ["unread", "read"] },
        archivedAt: null,
        resolvedAt: null,
        type: { in: ["missing_next_action", "stalled_opportunity", "opportunity_assigned"] },
      },
      data: { status: "resolved", resolvedAt: new Date(), updatedAt: new Date() },
    });
  }

  private async closePendingNextAction(actor: Actor, id: string, status: "completed" | "cancelled", input: CompleteNextActionInput | CancelNextActionInput): Promise<NextActionRecord | null> {
    const current = await this.getNextAction(actor, id);
    if (!current || current.status !== "pending") return null;
    await this.assertCanWriteNextAction(actor, current.responsibleUserId, current.opportunityId);
    const opportunity = current.opportunityId ? await this.getOpportunity(actor, current.opportunityId) : null;
    const needsReplacement = opportunity?.status === "ativa" && opportunity.archivedAt === null && opportunity.currentNextActionId === current.id;
    const replacement = "nextAction" in input ? input.nextAction : null;
    if (needsReplacement && !replacement) throw new ApiError(422, "bad_request", "Defina a proxima acao antes de concluir esta atividade.");

    await this.prisma.$transaction(async (tx) => {
      let nextActionId: string | null = null;
      let nextTitle: string | null = null;
      let nextDueAt: Date | null = null;

      if (replacement) {
        await this.assertCustomerOpportunityMatch(replacement.customerId, replacement.opportunityId ?? null);
        await this.assertActiveResponsibleUser(replacement.responsibleUserId);
        await this.assertCanWriteNextAction(actor, replacement.responsibleUserId, replacement.opportunityId ?? null);
        const created = await tx.nextAction.create({
          data: {
            customerId: replacement.customerId,
            opportunityId: replacement.opportunityId ?? null,
            responsibleUserId: replacement.responsibleUserId,
            category: replacement.category ?? "commercial",
            title: replacement.title,
            description: replacement.description ?? null,
            dueAt: new Date(replacement.dueAt),
            priority: replacement.priority ?? "normal",
            status: "pending",
            createdBy: actor.id,
            updatedBy: actor.id,
          },
          select: { id: true },
        });
        nextActionId = created.id;
        nextTitle = replacement.title;
        nextDueAt = new Date(replacement.dueAt);
      }

      if (current.opportunityId && opportunity?.currentNextActionId === current.id) {
        await this.setCurrentNextAction(actor, current.opportunityId, nextActionId, nextTitle, nextDueAt, tx);
      }
      await this.resolveNextActionNotifications(id, tx);
      if (current.opportunityId && nextActionId) await this.resolveOpportunityNotifications(current.opportunityId, tx);
      if (current.opportunityId && !nextActionId && status === "cancelled") await this.resolveOpportunityNotifications(current.opportunityId, tx);

      if (status === "completed") {
        await tx.nextAction.update({
          where: { id },
          data: {
            status: "completed",
            completedAt: new Date(),
            completedBy: actor.id,
            completionResult: (input as CompleteNextActionInput).completionResult,
            updatedBy: actor.id,
          },
        });
      } else {
        await tx.nextAction.update({
          where: { id },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelledBy: actor.id,
            cancellationReason: (input as CancelNextActionInput).cancellationReason,
            updatedBy: actor.id,
          },
        });
      }

      await tx.activity.create({
        data: {
          clienteId: current.customerId,
          oportunidadeId: current.opportunityId,
          tipo: "follow_up",
          title: status === "completed" ? "Proxima acao concluida" : "Proxima acao cancelada",
          corpo: status === "completed" ? (input as CompleteNextActionInput).completionResult : (input as CancelNextActionInput).cancellationReason,
          occurredAt: new Date(),
          createdBy: actor.id,
          updatedBy: actor.id,
          source: "manual",
          metadata: {},
        },
      });
    });

    return this.getNextAction(actor, id);
  }
}

function toPrismaJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue;
}

function buildNotificationPayload(payload: NotificationPayload): Prisma.NotificationUncheckedCreateInput {
  return {
    userId: payload.userId,
    type: payload.type,
    priority: severityToPriority(payload.severity),
    severity: payload.severity,
    title: payload.title,
    body: payload.body,
    entityType: payload.entityType,
    entityId: payload.entityId,
    customerId: payload.customerId,
    opportunityId: payload.opportunityId,
    nextActionId: payload.nextActionId,
    actionUrl: payload.actionUrl,
    dedupeKey: payload.dedupeKey,
    status: "unread",
    archivedAt: null,
    resolvedAt: null,
    snoozedUntil: null,
    metadata: {},
    updatedAt: new Date(),
  };
}

function severityToPriority(severity: NotificationRecord["severity"]): NotificationRecord["priority"] {
  if (severity === "urgent") return "alta";
  if (severity === "attention") return "media";
  return "informativa";
}

function mapNotification(row: NotificationEntity): NotificationRecord {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationRecord["type"],
    priority: row.priority as NotificationRecord["priority"],
    severity: row.severity as NotificationRecord["severity"],
    title: row.title,
    body: row.body ?? "",
    entityType: row.entityType,
    entityId: row.entityId,
    customerId: row.customerId,
    opportunityId: row.opportunityId,
    nextActionId: row.nextActionId,
    actionUrl: row.actionUrl,
    dedupeKey: row.dedupeKey ?? "",
    status: row.status as NotificationRecord["status"],
    readAt: row.readAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    snoozedUntil: row.snoozedUntil?.toISOString() ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAuvoWebhookEvent(row: AuvoWebhookEventEntity): AuvoWebhookEventRecord {
  const payload = row.rawPayloadJson as unknown;
  return {
    id: row.id,
    provider: "auvo",
    externalEventId: row.externalEventId,
    eventType: row.eventType,
    payloadHash: row.payloadHash,
    sanitizedHeaders: row.sanitizedHeadersJson as Record<string, string>,
    payload,
    sanitizedPayload: sanitizeWebhookPayload(payload),
    status: normalizeAuvoWebhookStatus(row.status),
    attemptCount: row.attemptCount,
    lastError: row.lastError,
    receivedAt: row.receivedAt.toISOString(),
    processingStartedAt: row.processingStartedAt?.toISOString() ?? null,
    processedAt: row.processedAt?.toISOString() ?? null,
    ignoredAt: row.ignoredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    sourceIpHash: row.sourceIpHash,
    contentLength: row.contentLength,
    schemaVersion: row.schemaVersion,
    nextRetryAt: row.nextRetryAt?.toISOString() ?? null,
  };
}

const OUT_OF_SCOPE_AUVO_EVENT_TYPE_PREFIXES = ["MESSAGE_", "SESSION_", "PAYMENT_", "CARD_", "PANEL_", "TEMPLATE_"];
const OUT_OF_SCOPE_AUVO_EVENT_TYPES_EXACT = new Set(["CONTACT_TAG_UPDATE"]);

export function isOutOfScopeAuvoEventType(eventType: string | null): boolean {
  if (!eventType) return false;
  const normalized = eventType.trim().toUpperCase();
  if (OUT_OF_SCOPE_AUVO_EVENT_TYPES_EXACT.has(normalized)) return true;
  return OUT_OF_SCOPE_AUVO_EVENT_TYPE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function inferEventType(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  return firstText(record.eventType, record.event_type, record.type, record.event);
}

function inferExternalEventId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  return firstText(record.eventId, record.event_id, record.id);
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 250);
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function mapOpportunity(row: OpportunityWithRelations): OpportunityRecord {
  return {
    id: row.id,
    clienteId: row.clienteId,
    clienteNome: row.cliente.nome,
    titulo: row.titulo,
    descricao: row.descricao,
    tipoDemanda: row.tipoDemanda,
    origem: row.origem,
    responsavelId: row.responsavelId,
    etapaId: row.etapaId,
    etapaNome: row.etapa.nome,
    situacao: row.situacao,
    valorEstimado: row.valorEstimado,
    valorOrcamento: row.valorOrcamento,
    valorAprovado: row.valorAprovado,
    formaPagamento: row.formaPagamento,
    quantidadeParcelas: row.quantidadeParcelas,
    previsaoExecucao: row.previsaoExecucao?.toISOString().slice(0, 10) ?? null,
    proximaAcao: row.proximaAcao,
    proximaAcaoEm: row.proximaAcaoEm?.toISOString() ?? null,
    dataEntrada: row.dataEntrada.toISOString(),
    dataOrcamento: row.dataOrcamento?.toISOString() ?? null,
    dataAprovacao: row.dataAprovacao?.toISOString() ?? null,
    dataPerda: row.dataPerda?.toISOString() ?? null,
    motivoPerdaId: row.motivoPerdaId,
    motivoPerdaNome: row.motivoPerda?.nome ?? null,
    status: row.status as OpportunityRecord["status"],
    currentNextActionId: row.currentNextActionId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

function mapActivity(row: ActivityEntity): ActivityRecord {
  return {
    id: row.id,
    customerId: row.clienteId,
    opportunityId: row.oportunidadeId,
    type: row.tipo as ActivityRecord["type"],
    title: row.title,
    description: row.corpo,
    occurredAt: row.occurredAt.toISOString(),
    createdBy: row.createdBy,
    source: row.source as ActivityRecord["source"],
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

function mapNextAction(row: NextActionWithRelations): NextActionRecord {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customer.nome,
    opportunityId: row.opportunityId,
    opportunityTitle: row.opportunity?.titulo ?? null,
    responsibleUserId: row.responsibleUserId,
    category: row.category as NextActionRecord["category"],
    title: row.title,
    description: row.description,
    dueAt: row.dueAt.toISOString(),
    priority: row.priority as NextActionRecord["priority"],
    status: row.status as NextActionRecord["status"],
    completedAt: row.completedAt?.toISOString() ?? null,
    completedBy: row.completedBy,
    completionResult: row.completionResult,
    postponedFrom: row.postponedFrom?.toISOString() ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    cancelledBy: row.cancelledBy,
    cancellationReason: row.cancellationReason,
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

function mapCommercialAction(row: NextActionWithRelations, now: Date) {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customer.nome,
    opportunityId: row.opportunityId,
    opportunityTitle: row.opportunity?.titulo ?? null,
    opportunitySituation: row.opportunity?.situacao ?? null,
    category: row.category as NextActionRecord["category"],
    title: row.title,
    responsibleUserId: row.responsibleUserId,
    dueAt: row.dueAt.toISOString(),
    overdueHours: Math.max(0, Math.floor((now.getTime() - row.dueAt.getTime()) / (60 * 60 * 1000))),
    priority: row.priority as NextActionRecord["priority"],
  };
}

function mapCommercialOpportunity(row: OpportunityWithRelations, now: Date) {
  return {
    id: row.id,
    customerId: row.clienteId,
    customerName: row.cliente.nome,
    title: row.titulo,
    stageName: row.etapa.nome,
    situation: row.situacao,
    responsibleUserId: row.responsavelId,
    budgetValue: row.valorOrcamento,
    budgetSentAt: row.dataOrcamento?.toISOString() ?? null,
    nextActionTitle: row.proximaAcao,
    nextActionDueAt: row.proximaAcaoEm?.toISOString() ?? null,
    daysOpen: Math.max(0, Math.floor((now.getTime() - row.dataEntrada.getTime()) / (24 * 60 * 60 * 1000))),
  };
}

function sortCommercialActions(left: ReturnType<typeof mapCommercialAction>, right: ReturnType<typeof mapCommercialAction>): number {
  if (right.overdueHours !== left.overdueHours) return right.overdueHours - left.overdueHours;
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  const priorityDiff = priorityOrder[left.priority] - priorityOrder[right.priority];
  if (priorityDiff) return priorityDiff;
  return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function assertCanTransition(current: OpportunityRecord, nextStatus: "ganha" | "perdida"): void {
  if (current.archivedAt) throw new ApiError(409, "bad_request", "Oportunidade arquivada nao pode mudar de status.");
  if (current.status === "ganha" && nextStatus === "perdida") throw new ApiError(409, "bad_request", "Oportunidade aprovada nao pode ser marcada como perdida.");
  if (current.status === "perdida" && nextStatus === "ganha") throw new ApiError(409, "bad_request", "Oportunidade perdida nao pode ser aprovada.");
  if (current.status === nextStatus) throw new ApiError(409, "bad_request", "Esta transicao ja foi registrada.");
}

function assertCanEditOpportunity(current: OpportunityRecord): void {
  if (current.archivedAt || current.status === "arquivada") {
    throw new ApiError(409, "bad_request", "Oportunidade arquivada nao pode ser editada.");
  }
  if (current.status === "ganha") {
    throw new ApiError(409, "bad_request", "Oportunidade aprovada nao pode ser editada por fluxo comum.");
  }
  if (current.status === "perdida") {
    throw new ApiError(409, "bad_request", "Oportunidade perdida nao pode ser editada por fluxo comum.");
  }
}
