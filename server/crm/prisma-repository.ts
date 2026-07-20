import { ApiError } from "../errors.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { CrmPrismaClient } from "../database/prisma.js";
import type {
  Actor,
  ActivityRecord,
  ApproveOpportunityInput,
  CancelNextActionInput,
  CompleteNextActionInput,
  CreateActivityInput,
  CreateCustomerInput,
  CreateNextActionInput,
  CreateOpportunityInput,
  CrmDataRepository,
  CustomerRecord,
  LossReasonRecord,
  NextActionPriority,
  NextActionRecord,
  OpportunityRecord,
  PipelineStageRecord,
  PostponeNextActionInput,
  UpdateActivityInput,
  UpdateCustomerInput,
  UpdateNextActionInput,
  UpdateOpportunityInput,
} from "./types.js";
import { assertActiveOpportunityHasNextAction, normalizePhone } from "./validation.js";

type PrismaExecutor = Pick<
  CrmPrismaClient,
  "activity" | "customer" | "lossReason" | "nextAction" | "opportunity" | "pipelineStage" | "userMembership"
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
  opportunity: { titulo: string } | null;
};

const opportunityInclude = {
  cliente: { select: { nome: true } },
  etapa: { select: { nome: true } },
  motivoPerda: { select: { nome: true } },
} as const;

const nextActionInclude = {
  customer: { select: { nome: true } },
  opportunity: { select: { titulo: true } },
} as const;

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
    });

    return this.getOpportunity(actor, id);
  }

  async setOpportunityArchived(actor: Actor, id: string, archived: boolean): Promise<OpportunityRecord | null> {
    const current = await this.getOpportunity(actor, id);
    if (!current) return null;
    if (archived && current.archivedAt) return current;
    if (!archived && !current.archivedAt) return current;
    await this.prisma.opportunity.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null, updatedBy: actor.id },
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
        }
      }
      return action.id;
    });
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

    await this.prisma.nextAction.update({
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

    const updated = await this.getNextAction(actor, id);
    if (updated?.opportunityId) {
      const opportunity = await this.getOpportunity(actor, updated.opportunityId);
      if (opportunity?.status === "ativa" && opportunity.currentNextActionId === updated.id && opportunity.archivedAt === null) {
        await this.setCurrentNextAction(actor, updated.opportunityId, updated.id, updated.title, new Date(updated.dueAt));
      }
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
      select: { id: true },
    });
    if (!stage) throw new ApiError(422, "bad_request", "Etapa informada nao existe.");
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
