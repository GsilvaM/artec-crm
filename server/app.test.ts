import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildServer } from "./app.js";
import type { DatabaseHealth } from "./database/health.js";
import { ApiError } from "./errors.js";
import type { AuthVerifier, Membership, MembershipRepository, VerifiedTokenUser } from "./auth/types.js";
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
  CreateNextActionInput,
  CreateOpportunityInput,
  CrmDataRepository,
  CustomerRecord,
  LossReasonRecord,
  NotificationFilters,
  NotificationListRecord,
  NotificationRecord,
  NotificationReconcileResult,
  NextActionRecord,
  OpportunityRecord,
  PipelineStageRecord,
  PostponeNextActionInput,
  ReceiveAuvoWebhookEventInput,
  ReceiveAuvoWebhookEventResult,
  SnoozeNotificationInput,
  UpdateActivityInput,
  UpdateCustomerInput,
  UpdateNextActionInput,
  UpdateOpportunityInput,
} from "./crm/types.js";
import { createWebhookPayloadHash, sanitizeWebhookPayload } from "./crm/auvo-webhook.js";
import { assertActiveOpportunityHasNextAction, normalizePhone } from "./crm/validation.js";

const now = "2026-07-20T10:00:00.000Z";
const actorId = "11111111-1111-4111-8111-111111111111";
const customerId = "22222222-2222-4222-8222-222222222222";
const opportunityId = "33333333-3333-4333-8333-333333333333";
const stageId = "44444444-4444-4444-8444-444444444444";
const lostStageId = "55555555-5555-4555-8555-555555555555";
const lossReasonId = "66666666-6666-4666-8666-666666666666";
const auvoSecret = "local-auvo-secret";

function createTestServer(options: {
  verifiedUser?: VerifiedTokenUser;
  verifyError?: Error;
  membership?: Membership | null;
  crmRepository?: CrmDataRepository;
}) {
  const authVerifier: AuthVerifier = {
    async verify() {
      if (options.verifyError) throw options.verifyError;
      return options.verifiedUser ?? { id: actorId, email: "gestor@artec.local" };
    },
  };
  const membershipRepository: MembershipRepository = {
    async findByUserId(userId) {
      if (options.membership === undefined) {
        return { userId, role: "gestor", isActive: true };
      }

      return options.membership;
    },
    async close() {
      return undefined;
    },
  };

  return buildServer({
    config: {
      corsOrigins: ["http://localhost:3100"],
      CRM_LOG_LEVEL: "silent",
      AUVO_WEBHOOK_SECRET: auvoSecret,
    },
    authVerifier,
    membershipRepository,
    crmRepository: options.crmRepository ?? new FakeCrmRepository(),
    databaseHealth: new FakeDatabaseHealth(),
  });
}

describe("CRM API auth and RBAC", () => {
  it("exposes production health without auth", async () => {
    const app = createTestServer({});
    const response = await app.inject({ method: "GET", url: "/api/health" });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok", service: "artec-crm-api", database: "connected" });
  });

  it("rejects /api/me without bearer token", async () => {
    const app = createTestServer({});
    const response = await app.inject({ method: "GET", url: "/api/me" });
    await app.close();

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("unauthorized");
  });

  it("rejects invalid Supabase token", async () => {
    const app = createTestServer({ verifyError: new Error("invalid_token") });
    const response = await app.inject({ method: "GET", url: "/api/me", headers: { authorization: "Bearer invalid" } });
    await app.close();

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("unauthorized");
  });

  it("rejects authenticated users without CRM membership", async () => {
    const app = createTestServer({ membership: null });
    const response = await app.inject({ method: "GET", url: "/api/me", headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("membership_missing");
  });

  it("rejects inactive memberships", async () => {
    const app = createTestServer({
      membership: { userId: actorId, role: "vendedor", isActive: false },
    });
    const response = await app.inject({ method: "GET", url: "/api/me", headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("membership_inactive");
  });

  it("returns only the safe current user payload for active membership", async () => {
    const app = createTestServer({
      membership: { userId: actorId, role: "atendimento", isActive: true },
    });
    const response = await app.inject({ method: "GET", url: "/api/me", headers: { authorization: "Bearer valid" } });
    await app.close();
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      id: actorId,
      email: "gestor@artec.local",
      role: "atendimento",
      membershipStatus: "active",
      permissions: [
        "self:read",
        "customers:read",
        "customers:write",
        "opportunities:read",
        "opportunities:write",
        "activities:read",
        "activities:write",
        "next_actions:read",
        "next_actions:write",
        "notifications:read",
        "notifications:write",
      ],
    });
  });
});

describe("CRM customers and opportunities API", () => {
  it("creates customers with normalized phone and duplicate warning", async () => {
    const app = createTestServer({});
    await app.inject({
      method: "POST",
      url: "/api/customers",
      headers: { authorization: "Bearer valid" },
      payload: { tipoPessoa: "fisica", nome: "Maria Silva", telefone: "(11) 99999-0000" },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/customers",
      headers: { authorization: "Bearer valid" },
      payload: { tipoPessoa: "fisica", nome: "Maria Obra", telefone: "11 99999-0000" },
    });
    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.json().customer.telefoneNormalizado).toBe("5511999990000");
    expect(response.json().customer.duplicatePhoneCustomerIds).toHaveLength(1);
  });

  it("rejects active opportunities without next action", async () => {
    const app = createTestServer({});
    const response = await app.inject({
      method: "POST",
      url: "/api/opportunities",
      headers: { authorization: "Bearer valid" },
      payload: {
        clienteId: customerId,
        titulo: "Instalacao sala",
        tipoDemanda: "instalacao",
        responsavelId: actorId,
        situacao: "em andamento",
        status: "ativa",
      },
    });
    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json().error.message).toBe("Defina a proxima acao e a data antes de manter esta oportunidade ativa.");
  });

  it("creates and approves opportunities through protected routes", async () => {
    const app = createTestServer({});
    const created = await app.inject({
      method: "POST",
      url: "/api/opportunities",
      headers: { authorization: "Bearer valid" },
      payload: {
        clienteId: customerId,
        titulo: "Instalacao suite",
        tipoDemanda: "instalacao",
        responsavelId: actorId,
        situacao: "em andamento",
        proximaAcao: "Enviar proposta",
        proximaAcaoEm: "2026-07-21T13:00:00.000Z",
        status: "ativa",
      },
    });
    const id = created.json().opportunity.id;

    const approved = await app.inject({
      method: "POST",
      url: `/api/opportunities/${id}/approve`,
      headers: { authorization: "Bearer valid" },
      payload: {
        valorAprovado: 500000,
        formaPagamento: "parcelado",
        quantidadeParcelas: 5,
        previsaoExecucao: "2026-08-05",
      },
    });

    const lost = await app.inject({
      method: "POST",
      url: `/api/opportunities/${id}/lose`,
      headers: { authorization: "Bearer valid" },
      payload: { motivoPerdaId: lossReasonId },
    });
    await app.close();

    expect(created.statusCode).toBe(201);
    expect(approved.json().opportunity.status).toBe("ganha");
    expect(approved.json().opportunity.valorAprovado).toBe(500000);
    expect(lost.statusCode).toBe(409);
    expect(lost.json().error.message).toBe("Oportunidade aprovada nao pode ser marcada como perdida.");
  });

  it("rejects opportunities for archived customers", async () => {
    const repository = new FakeCrmRepository();
    const app = createTestServer({ crmRepository: repository });
    await repository.setCustomerArchived({ id: actorId, role: "gestor" }, customerId, true);

    const response = await app.inject({
      method: "POST",
      url: "/api/opportunities",
      headers: { authorization: "Bearer valid" },
      payload: makeCreateOpportunityInput(),
    });
    await app.close();

    expect(response.statusCode).toBe(409);
    expect(response.json().error.message).toBe("Restaure o cliente antes de criar ou mover uma oportunidade.");
  });

  it("rejects opportunities with invalid stage or loss reason", async () => {
    const app = createTestServer({});
    const invalidStage = await app.inject({
      method: "POST",
      url: "/api/opportunities",
      headers: { authorization: "Bearer valid" },
      payload: { ...makeCreateOpportunityInput(), etapaId: "88888888-8888-4888-8888-888888888888" },
    });
    const created = await app.inject({
      method: "POST",
      url: "/api/opportunities",
      headers: { authorization: "Bearer valid" },
      payload: makeCreateOpportunityInput(),
    });
    const invalidLossReason = await app.inject({
      method: "POST",
      url: `/api/opportunities/${created.json().opportunity.id}/lose`,
      headers: { authorization: "Bearer valid" },
      payload: { motivoPerdaId: "99999999-9999-4999-8999-999999999999" },
    });
    await app.close();

    expect(invalidStage.statusCode).toBe(422);
    expect(invalidStage.json().error.message).toBe("Etapa informada nao existe.");
    expect(invalidLossReason.statusCode).toBe(422);
    expect(invalidLossReason.json().error.message).toBe("Motivo de perda informado nao existe ou esta inativo.");
  });

  it("prevents sellers from assigning opportunities to another responsible user", async () => {
    const app = createTestServer({ membership: { userId: actorId, role: "vendedor", isActive: true } });
    const response = await app.inject({
      method: "POST",
      url: "/api/opportunities",
      headers: { authorization: "Bearer valid" },
      payload: { ...makeCreateOpportunityInput(), responsavelId: "77777777-7777-4777-8777-777777777777" },
    });
    await app.close();

    expect(response.statusCode).toBe(403);
    expect(response.json().error.message).toBe("Vendedor nao pode atribuir oportunidade para outro responsavel.");
  });

  it("keeps non-members out of customer routes", async () => {
    const app = createTestServer({ membership: null });
    const response = await app.inject({
      method: "GET",
      url: "/api/customers",
      headers: { authorization: "Bearer valid" },
    });
    await app.close();

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("membership_missing");
  });

  it("rejects malformed route ids before repository access", async () => {
    const app = createTestServer({});
    const response = await app.inject({
      method: "GET",
      url: "/api/opportunities/undefined",
      headers: { authorization: "Bearer valid" },
    });
    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json().error.message).toBe("ID invalido.");
  });
});

describe("CRM activities and next actions API", () => {
  it("creates customer activity without opportunity and warranty/support without creating opportunities", async () => {
    const repository = new FakeCrmRepository();
    const app = createTestServer({ crmRepository: repository });
    const warranty = await app.inject({
      method: "POST",
      url: "/api/activities",
      headers: { authorization: "Bearer valid" },
      payload: { customerId, type: "warranty", description: "Garantia registrada para troca de peça." },
    });
    const support = await app.inject({
      method: "POST",
      url: "/api/activities",
      headers: { authorization: "Bearer valid" },
      payload: { customerId, type: "support", description: "Suporte para verificar ruído relatado." },
    });
    const opportunities = await app.inject({ method: "GET", url: "/api/opportunities", headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(warranty.statusCode).toBe(201);
    expect(support.statusCode).toBe(201);
    expect(opportunities.json().opportunities).toHaveLength(0);
  });

  it("creates activity linked to opportunity", async () => {
    const repository = new FakeCrmRepository();
    await repository.createOpportunity({ id: actorId, role: "gestor" }, makeCreateOpportunityInput());
    const app = createTestServer({ crmRepository: repository });
    const response = await app.inject({
      method: "POST",
      url: "/api/activities",
      headers: { authorization: "Bearer valid" },
      payload: { customerId, opportunityId: repository.firstOpportunityId(), type: "call", description: "Ligacao realizada com o cliente." },
    });
    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.json().activity.opportunityId).toBe(repository.firstOpportunityId());
    expect(response.json().activity.createdBy).toBe(actorId);
  });

  it("rejects activity when opportunity belongs to another customer", async () => {
    const repository = new FakeCrmRepository();
    const otherCustomer = await repository.createCustomer({ id: actorId, role: "gestor" }, { tipoPessoa: "fisica", nome: "Outro Cliente" });
    const app = createTestServer({ crmRepository: repository });
    const response = await app.inject({
      method: "POST",
      url: "/api/activities",
      headers: { authorization: "Bearer valid" },
      payload: {
        customerId: otherCustomer.id,
        opportunityId,
        type: "note",
        description: "Tentativa com cliente divergente.",
      },
    });
    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json().error.message).toBe("A oportunidade informada nao pertence ao cliente.");
  });

  it("rejects invalid activity payloads", async () => {
    const app = createTestServer({});
    const response = await app.inject({
      method: "POST",
      url: "/api/activities",
      headers: { authorization: "Bearer valid" },
      payload: { customerId, type: "note", description: "" },
    });
    await app.close();

    expect(response.statusCode).toBe(400);
  });

  it("rejects next action for invalid responsible user", async () => {
    const app = createTestServer({});
    const response = await app.inject({
      method: "POST",
      url: "/api/next-actions",
      headers: { authorization: "Bearer valid" },
      payload: {
        customerId,
        responsibleUserId: "88888888-8888-4888-8888-888888888888",
        title: "Retornar ao cliente",
        dueAt: "2026-07-21T13:00:00.000Z",
      },
    });
    await app.close();

    expect(response.statusCode).toBe(422);
    expect(response.json().error.message).toBe("Informe um responsavel ativo no CRM.");
  });

  it("creates, postpones, cancels and lists next actions by category and date filters", async () => {
    const repository = new FakeCrmRepository();
    const app = createTestServer({ crmRepository: repository });
    const created = await app.inject({
      method: "POST",
      url: "/api/next-actions",
      headers: { authorization: "Bearer valid" },
      payload: { customerId, responsibleUserId: actorId, category: "support", title: "Retornar ao cliente", dueAt: "2026-07-20T13:00:00.000Z", priority: "high" },
    });
    const id = created.json().nextAction.id;
    const postponed = await app.inject({
      method: "POST",
      url: `/api/next-actions/${id}/postpone`,
      headers: { authorization: "Bearer valid" },
      payload: { dueAt: "2026-07-21T13:00:00.000Z" },
    });
    const cancelled = await app.inject({
      method: "POST",
      url: `/api/next-actions/${id}/cancel`,
      headers: { authorization: "Bearer valid" },
      payload: { cancellationReason: "Cliente pediu para pausar." },
    });
    const list = await app.inject({ method: "GET", url: "/api/next-actions?status=cancelled", headers: { authorization: "Bearer valid" } });
    const supportList = await app.inject({ method: "GET", url: "/api/next-actions?category=support&status=cancelled", headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(created.statusCode).toBe(201);
    expect(created.json().nextAction.category).toBe("support");
    expect(postponed.json().nextAction.postponedFrom).toBe("2026-07-20T13:00:00.000Z");
    expect(cancelled.json().nextAction.status).toBe("cancelled");
    expect(list.json().nextActions).toHaveLength(1);
    expect(supportList.json().nextActions).toHaveLength(1);
  });

  it("rejects next action when opportunity belongs to another customer", async () => {
    const repository = new FakeCrmRepository();
    const otherCustomer = await repository.createCustomer({ id: actorId, role: "gestor" }, { tipoPessoa: "fisica", nome: "Outro Cliente" });
    const app = createTestServer({ crmRepository: repository });
    const response = await app.inject({
      method: "POST",
      url: "/api/next-actions",
      headers: { authorization: "Bearer valid" },
      payload: {
        customerId: otherCustomer.id,
        opportunityId,
        responsibleUserId: actorId,
        title: "Acompanhar divergencia",
        dueAt: "2026-07-21T13:00:00.000Z",
      },
    });
    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json().error.message).toBe("A oportunidade informada nao pertence ao cliente.");
  });

  it("prevents completing current active opportunity action without replacement", async () => {
    const repository = new FakeCrmRepository();
    const opportunity = await repository.createOpportunity({ id: actorId, role: "gestor" }, makeCreateOpportunityInput());
    const app = createTestServer({ crmRepository: repository });
    const response = await app.inject({
      method: "POST",
      url: `/api/next-actions/${opportunity.currentNextActionId}/complete`,
      headers: { authorization: "Bearer valid" },
      payload: { completionResult: "Cliente respondeu." },
    });
    await app.close();

    expect(response.statusCode).toBe(422);
    expect(response.json().error.message).toBe("Defina a proxima acao antes de concluir esta atividade.");
  });

  it("completes current action with replacement and generates follow-up activity", async () => {
    const repository = new FakeCrmRepository();
    const opportunity = await repository.createOpportunity({ id: actorId, role: "gestor" }, makeCreateOpportunityInput());
    const app = createTestServer({ crmRepository: repository });
    const response = await app.inject({
      method: "POST",
      url: `/api/next-actions/${opportunity.currentNextActionId}/complete`,
      headers: { authorization: "Bearer valid" },
      payload: {
        completionResult: "Cliente pediu retorno amanha.",
        nextAction: { customerId, opportunityId: opportunity.id, responsibleUserId: actorId, title: "Retornar novamente", dueAt: "2026-07-22T13:00:00.000Z" },
      },
    });
    const activities = await app.inject({ method: "GET", url: `/api/opportunities/${opportunity.id}/activities`, headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json().nextAction.status).toBe("completed");
    expect(activities.json().activities.some((activity: ActivityRecord) => activity.type === "follow_up")).toBe(true);
  });

  it("keeps opportunity current next action synchronized when edited through opportunity route", async () => {
    const repository = new FakeCrmRepository();
    const opportunity = await repository.createOpportunity({ id: actorId, role: "gestor" }, makeCreateOpportunityInput());
    const app = createTestServer({ crmRepository: repository });
    const response = await app.inject({
      method: "PATCH",
      url: `/api/opportunities/${opportunity.id}`,
      headers: { authorization: "Bearer valid" },
      payload: {
        proximaAcao: "Confirmar visita",
        proximaAcaoEm: "2026-07-23T13:00:00.000Z",
      },
    });
    const action = await app.inject({
      method: "GET",
      url: `/api/next-actions/${opportunity.currentNextActionId}`,
      headers: { authorization: "Bearer valid" },
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json().opportunity.proximaAcao).toBe("Confirmar visita");
    expect(action.json().nextAction.title).toBe("Confirmar visita");
    expect(action.json().nextAction.dueAt).toBe("2026-07-23T13:00:00.000Z");
  });

  it("allows closing a pending action without replacement when opportunity status does not require follow-up", async () => {
    const repository = new FakeCrmRepository();
    const opportunity = await repository.createOpportunity({ id: actorId, role: "gestor" }, makeCreateOpportunityInput());
    const pendingActionId = opportunity.currentNextActionId;
    await repository.approveOpportunity({ id: actorId, role: "gestor" }, opportunity.id, {
      valorAprovado: 500000,
      formaPagamento: "a vista",
      quantidadeParcelas: 3,
      previsaoExecucao: "2026-08-05",
    });
    const app = createTestServer({ crmRepository: repository });
    const response = await app.inject({
      method: "POST",
      url: `/api/next-actions/${pendingActionId}/complete`,
      headers: { authorization: "Bearer valid" },
      payload: { completionResult: "Fluxo comercial encerrado." },
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json().nextAction.status).toBe("completed");
  });

  it("respects vendedor scope for next actions", async () => {
    const repository = new FakeCrmRepository();
    const otherUserId = "77777777-7777-4777-8777-777777777777";
    const action = await repository.createNextAction({ id: actorId, role: "gestor" }, { customerId, responsibleUserId: otherUserId, title: "Acao de outro vendedor", dueAt: "2026-07-21T13:00:00.000Z" });
    const app = createTestServer({ membership: { userId: actorId, role: "vendedor", isActive: true }, crmRepository: repository });
    const response = await app.inject({
      method: "POST",
      url: `/api/next-actions/${action.id}/complete`,
      headers: { authorization: "Bearer valid" },
      payload: { completionResult: "Tentativa indevida." },
    });
    await app.close();

    expect(response.statusCode).toBe(404);
  });

  it("prevents seller from replacing an owned action with another responsible user", async () => {
    const repository = new FakeCrmRepository();
    const opportunity = await repository.createOpportunity({ id: actorId, role: "gestor" }, makeCreateOpportunityInput());
    const app = createTestServer({ membership: { userId: actorId, role: "vendedor", isActive: true }, crmRepository: repository });
    const response = await app.inject({
      method: "POST",
      url: `/api/next-actions/${opportunity.currentNextActionId}/complete`,
      headers: { authorization: "Bearer valid" },
      payload: {
        completionResult: "Cliente pediu outro contato.",
        nextAction: {
          customerId,
          opportunityId: opportunity.id,
          responsibleUserId: "77777777-7777-4777-8777-777777777777",
          title: "Outro vendedor retorna",
          dueAt: "2026-07-22T13:00:00.000Z",
        },
      },
    });
    await app.close();

    expect(response.statusCode).toBe(403);
  });

  it("lets gestor list all next actions while seller sees only owned records", async () => {
    const repository = new FakeCrmRepository();
    await repository.createNextAction({ id: actorId, role: "gestor" }, { customerId, responsibleUserId: actorId, title: "Acao propria", dueAt: "2026-07-21T13:00:00.000Z" });
    await repository.createNextAction({ id: actorId, role: "gestor" }, { customerId, responsibleUserId: "77777777-7777-4777-8777-777777777777", title: "Acao de outro", dueAt: "2026-07-21T14:00:00.000Z" });
    const managerApp = createTestServer({ crmRepository: repository });
    const sellerApp = createTestServer({ membership: { userId: actorId, role: "vendedor", isActive: true }, crmRepository: repository });
    const managerResponse = await managerApp.inject({ method: "GET", url: "/api/next-actions", headers: { authorization: "Bearer valid" } });
    const sellerResponse = await sellerApp.inject({ method: "GET", url: "/api/next-actions", headers: { authorization: "Bearer valid" } });
    await managerApp.close();
    await sellerApp.close();

    expect(managerResponse.json().nextActions).toHaveLength(2);
    expect(sellerResponse.json().nextActions).toHaveLength(1);
  });

  it("returns commercial center work blocks and summary", async () => {
    const repository = new FakeCrmRepository();
    await repository.createOpportunity({ id: actorId, role: "gestor" }, { ...makeCreateOpportunityInput(), proximaAcao: "Visita tecnica", proximaAcaoEm: "2026-07-20T13:00:00.000Z" });
    await repository.createNextAction({ id: actorId, role: "gestor" }, { customerId, responsibleUserId: actorId, category: "support", title: "Acao vencida", dueAt: "2026-07-19T13:00:00.000Z", priority: "high" });
    const app = createTestServer({ crmRepository: repository });
    const response = await app.inject({ method: "GET", url: "/api/commercial-center?category=support", headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json().commercialCenter.overdueActions).toHaveLength(1);
    expect(response.json().commercialCenter.todayActions).toHaveLength(0);
    expect(response.json().commercialCenter.auvoInbox.status).toBe("homologation");
    expect(response.json().commercialCenter.summary.newOpportunities).toBeGreaterThan(0);
  });

  it("keeps seller scope in commercial center", async () => {
    const repository = new FakeCrmRepository();
    await repository.createNextAction({ id: actorId, role: "gestor" }, { customerId, responsibleUserId: actorId, title: "Acao propria", dueAt: "2026-07-19T13:00:00.000Z" });
    await repository.createNextAction({ id: actorId, role: "gestor" }, { customerId, responsibleUserId: "77777777-7777-4777-8777-777777777777", title: "Acao de outro", dueAt: "2026-07-19T14:00:00.000Z" });
    const app = createTestServer({ membership: { userId: actorId, role: "vendedor", isActive: true }, crmRepository: repository });
    const response = await app.inject({ method: "GET", url: "/api/commercial-center", headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json().commercialCenter.overdueActions).toHaveLength(1);
    expect(response.json().commercialCenter.overdueActions[0].responsibleUserId).toBe(actorId);
  });

  it("applies combined commercial center filters", async () => {
    const repository = new FakeCrmRepository();
    await repository.createOpportunity({ id: actorId, role: "gestor" }, {
      ...makeCreateOpportunityInput(),
      tipoDemanda: "manutencao",
      situacao: "aguardando cliente",
      proximaAcao: "Follow-up importante",
      proximaAcaoEm: "2026-07-20T13:00:00.000Z",
    });
    await repository.createNextAction({ id: actorId, role: "gestor" }, {
      customerId,
      responsibleUserId: actorId,
      category: "commercial",
      title: "Follow-up importante",
      dueAt: "2026-07-20T13:00:00.000Z",
      priority: "high",
    });
    await repository.createNextAction({ id: actorId, role: "gestor" }, {
      customerId,
      responsibleUserId: actorId,
      category: "support",
      title: "Suporte fora do filtro",
      dueAt: "2026-07-20T14:00:00.000Z",
      priority: "normal",
    });
    const app = createTestServer({ crmRepository: repository });
    const response = await app.inject({
      method: "GET",
      url: `/api/commercial-center?from=2026-07-01&to=2026-07-31&responsibleUserId=${actorId}&situation=aguardando%20cliente&demandType=manutencao&category=commercial&priority=high`,
      headers: { authorization: "Bearer valid" },
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json().commercialCenter.todayActions).toHaveLength(1);
    expect(response.json().commercialCenter.todayActions[0].priority).toBe("high");
    expect(response.json().commercialCenter.summary.newOpportunities).toBe(1);
  });

  it("rejects invalid commercial center query values", async () => {
    const app = createTestServer({});
    const response = await app.inject({ method: "GET", url: "/api/commercial-center?category=invalid", headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(response.statusCode).toBe(400);
  });

  it("keeps atendimento limited to allowed commercial center context", async () => {
    const repository = new FakeCrmRepository();
    await repository.createNextAction({ id: actorId, role: "gestor" }, { customerId, responsibleUserId: actorId, category: "support", title: "Suporte hoje", dueAt: "2026-07-20T13:00:00.000Z" });
    const app = createTestServer({ membership: { userId: actorId, role: "atendimento", isActive: true }, crmRepository: repository });
    const response = await app.inject({ method: "GET", url: "/api/commercial-center?category=support", headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json().commercialCenter.todayActions).toHaveLength(1);
    expect(response.json().commercialCenter.auvoInbox.pending).toBe(0);
  });

  it("lists, counts, reads, snoozes and archives own notifications", async () => {
    const repository = new FakeCrmRepository();
    const notification = repository.seedNotification({ userId: actorId, status: "unread" });
    repository.seedNotification({ userId: "77777777-7777-4777-8777-777777777777", status: "unread" });
    const app = createTestServer({ crmRepository: repository });

    const list = await app.inject({ method: "GET", url: "/api/notifications?status=active", headers: { authorization: "Bearer valid" } });
    const count = await app.inject({ method: "GET", url: "/api/notifications/unread-count", headers: { authorization: "Bearer valid" } });
    const read = await app.inject({ method: "POST", url: `/api/notifications/${notification.id}/read`, headers: { authorization: "Bearer valid" } });
    const snooze = await app.inject({ method: "POST", url: `/api/notifications/${notification.id}/snooze`, headers: { authorization: "Bearer valid" }, payload: { snoozedUntil: "2026-07-21T10:00:00.000Z" } });
    const archive = await app.inject({ method: "POST", url: `/api/notifications/${notification.id}/archive`, headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(list.statusCode).toBe(200);
    expect(list.json().notifications).toHaveLength(1);
    expect(count.json().count).toBe(1);
    expect(read.json().notification.status).toBe("read");
    expect(snooze.json().notification.snoozedUntil).toBe("2026-07-21T10:00:00.000Z");
    expect(archive.json().notification.status).toBe("archived");
  });

  it("does not allow accessing another user's notification", async () => {
    const repository = new FakeCrmRepository();
    const notification = repository.seedNotification({ userId: "77777777-7777-4777-8777-777777777777", status: "unread" });
    const app = createTestServer({ crmRepository: repository });
    const response = await app.inject({ method: "POST", url: `/api/notifications/${notification.id}/read`, headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(response.statusCode).toBe(404);
  });

  it("keeps notification reconcile restricted to gestor", async () => {
    const repository = new FakeCrmRepository();
    const sellerApp = createTestServer({ membership: { userId: actorId, role: "vendedor", isActive: true }, crmRepository: repository });
    const denied = await sellerApp.inject({ method: "POST", url: "/api/notifications/reconcile", headers: { authorization: "Bearer valid" } });
    await sellerApp.close();

    const managerApp = createTestServer({ crmRepository: repository });
    const allowed = await managerApp.inject({ method: "POST", url: "/api/notifications/reconcile", headers: { authorization: "Bearer valid" } });
    await managerApp.close();

    expect(denied.statusCode).toBe(403);
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json()).toEqual({ generated: 0, updated: 0, resolved: 0 });
  });

  it("receives valid Auvo webhooks, stores sanitized headers and deduplicates by hash", async () => {
    const repository = new FakeCrmRepository();
    const app = createTestServer({ crmRepository: repository });
    const payload = { eventType: "attendance.created", id: "evt-1", nested: { token: "sensitive" } };
    const first = await app.inject({
      method: "POST",
      url: `/api/webhooks/auvo/${auvoSecret}`,
      headers: {
        "content-type": "application/json",
        "user-agent": "auvo-homologation",
        authorization: "Bearer must-not-store",
        cookie: "session=must-not-store",
      },
      payload,
    });
    const duplicate = await app.inject({
      method: "POST",
      url: `/api/webhooks/auvo/${auvoSecret}`,
      headers: { "content-type": "application/json" },
      payload: { id: "evt-1", nested: { token: "sensitive" }, eventType: "attendance.created" },
    });
    await app.close();

    expect(first.statusCode).toBe(202);
    expect(first.json()).toMatchObject({ status: "received", duplicate: false });
    expect(duplicate.statusCode).toBe(202);
    expect(duplicate.json()).toMatchObject({ status: "duplicate", duplicate: true });
    expect(repository.auvoEvents).toHaveLength(1);
    expect(repository.auvoEvents[0]?.payloadHash).toBe(createWebhookPayloadHash(payload));
    expect(repository.auvoEvents[0]?.sanitizedHeaders.authorization).toBeUndefined();
    expect(repository.auvoEvents[0]?.sanitizedHeaders.cookie).toBeUndefined();
    expect(repository.auvoEvents[0]?.sanitizedPayload).toMatchObject({ nested: { token: "[redacted]" } });
    expect(repository.customers).toHaveLength(1);
    expect(repository.opportunities).toHaveLength(0);
    expect(repository.notifications).toHaveLength(0);
  });

  it("rejects unsafe Auvo webhook requests without leaking secrets", async () => {
    const app = createTestServer({});
    const wrongSecret = await app.inject({ method: "POST", url: "/api/webhooks/auvo/wrong-secret", headers: { "content-type": "application/json" }, payload: { ok: true } });
    const wrongType = await app.inject({ method: "POST", url: `/api/webhooks/auvo/${auvoSecret}`, headers: { "content-type": "text/plain" }, payload: "plain" });
    const wrongMethod = await app.inject({ method: "GET", url: `/api/webhooks/auvo/${auvoSecret}` });
    const oversized = await app.inject({
      method: "POST",
      url: `/api/webhooks/auvo/${auvoSecret}`,
      headers: { "content-type": "application/json", "content-length": String(300 * 1024) },
      payload: { ok: true },
    });
    await app.close();

    expect(wrongSecret.statusCode).toBe(403);
    expect(JSON.stringify(wrongSecret.json())).not.toContain("wrong-secret");
    expect(wrongType.statusCode).toBe(415);
    expect(wrongMethod.statusCode).toBe(405);
    expect(oversized.statusCode).toBe(413);
  });

  it("keeps Auvo admin APIs restricted to gestor and supports detail, filters, reprocess and ignore", async () => {
    const repository = new FakeCrmRepository();
    const event = (await repository.receiveAuvoWebhookEvent({
      payload: { eventType: "contact.updated", password: "sensitive" },
      headers: { "content-type": "application/json" },
      sourceIpHash: "ip-hash",
      contentLength: 42,
    })).event;
    const sellerApp = createTestServer({ membership: { userId: actorId, role: "vendedor", isActive: true }, crmRepository: repository });
    const denied = await sellerApp.inject({ method: "GET", url: "/api/integrations/auvo/events", headers: { authorization: "Bearer valid" } });
    await sellerApp.close();

    const managerApp = createTestServer({ crmRepository: repository });
    const status = await managerApp.inject({ method: "GET", url: "/api/integrations/auvo/status", headers: { authorization: "Bearer valid" } });
    const list = await managerApp.inject({ method: "GET", url: "/api/integrations/auvo/events?status=received&eventType=contact.updated&limit=1", headers: { authorization: "Bearer valid" } });
    const detail = await managerApp.inject({ method: "GET", url: `/api/integrations/auvo/events/${event.id}`, headers: { authorization: "Bearer valid" } });
    const reprocess = await managerApp.inject({ method: "POST", url: `/api/integrations/auvo/events/${event.id}/reprocess`, headers: { authorization: "Bearer valid" } });
    const ignore = await managerApp.inject({ method: "POST", url: `/api/integrations/auvo/events/${event.id}/ignore`, headers: { authorization: "Bearer valid" } });
    await managerApp.close();

    expect(denied.statusCode).toBe(403);
    expect(status.statusCode).toBe(200);
    expect(status.json()).toMatchObject({ configured: true, pendingCount: 1, failedCount: 0 });
    expect(list.json().events).toHaveLength(1);
    expect(detail.json().event.sanitizedPayload.password).toBe("[redacted]");
    expect(reprocess.json().event.attemptCount).toBe(1);
    expect(ignore.json().event.status).toBe("ignored");
  });
});

class FakeCrmRepository implements CrmDataRepository {
  private activeUsers = new Set([actorId, "77777777-7777-4777-8777-777777777777"]);
  customers: CustomerRecord[] = [
    makeCustomer({ id: customerId, nome: "Cliente Base" }),
  ];
  opportunities: OpportunityRecord[] = [];
  private activities: ActivityRecord[] = [];
  private nextActions: NextActionRecord[] = [];
  notifications: NotificationRecord[] = [];
  auvoEvents: AuvoWebhookEventRecord[] = [];
  private stages: PipelineStageRecord[] = [
    { id: stageId, nome: "Novo lead", ordem: 1, isTerminal: false },
    { id: "30000000-0000-0000-0000-000000000007", nome: "Aprovado", ordem: 7, isTerminal: true },
    { id: lostStageId, nome: "Perdido", ordem: 9, isTerminal: true },
  ];
  private lossReasons: LossReasonRecord[] = [{ id: lossReasonId, nome: "sem retorno" }];

  seedNotification(overrides: Partial<NotificationRecord>): NotificationRecord {
    const notification = makeNotification(overrides);
    this.notifications.push(notification);
    return notification;
  }

  async listCustomers(): Promise<CustomerRecord[]> {
    return this.customers.map((customer) => this.withDuplicatePhones(customer));
  }

  async getCustomer(_actor: Actor, id: string): Promise<CustomerRecord | null> {
    return this.customers.find((customer) => customer.id === id) ?? null;
  }

  async createCustomer(actor: Actor, input: CreateCustomerInput): Promise<CustomerRecord> {
    const customer = makeCustomer({
      id: randomUUID(),
      nome: input.nome,
      tipoPessoa: input.tipoPessoa,
      telefone: input.telefone ?? null,
      telefoneNormalizado: normalizePhone(input.telefone),
      createdBy: actor.id,
      updatedBy: actor.id,
    });
    this.customers.push(customer);
    return this.withDuplicatePhones(customer);
  }

  async updateCustomer(_actor: Actor, id: string, input: UpdateCustomerInput): Promise<CustomerRecord | null> {
    const customer = this.customers.find((item) => item.id === id);
    if (!customer) return null;
    Object.assign(customer, input);
    return this.withDuplicatePhones(customer);
  }

  async setCustomerArchived(_actor: Actor, id: string, archived: boolean): Promise<CustomerRecord | null> {
    const customer = this.customers.find((item) => item.id === id);
    if (!customer) return null;
    customer.archivedAt = archived ? now : null;
    return customer;
  }

  async listOpportunities(actor: Actor, filters: { search?: string; status?: string; etapaId?: string; responsavelId?: string; situation?: string; demandType?: string; from?: string; to?: string }): Promise<OpportunityRecord[]> {
    return this.opportunities.filter((opportunity) => {
      if (actor.role === "vendedor" && opportunity.responsavelId !== actor.id) return false;
      if (filters.status && opportunity.status !== filters.status) return false;
      if (filters.etapaId && opportunity.etapaId !== filters.etapaId) return false;
      if (filters.responsavelId && opportunity.responsavelId !== filters.responsavelId) return false;
      if (filters.situation && opportunity.situacao !== filters.situation) return false;
      if (filters.demandType && opportunity.tipoDemanda !== filters.demandType) return false;
      if (filters.from && opportunity.createdAt.slice(0, 10) < filters.from) return false;
      if (filters.to && opportunity.createdAt.slice(0, 10) > filters.to) return false;
      return true;
    });
  }

  async getOpportunity(_actor: Actor, id: string): Promise<OpportunityRecord | null> {
    return this.opportunities.find((opportunity) => opportunity.id === id) ?? null;
  }

  async createOpportunity(actor: Actor, input: CreateOpportunityInput): Promise<OpportunityRecord> {
    assertActiveOpportunityHasNextAction({ ...input, status: input.status ?? "ativa" });
    this.assertCustomerCanReceiveOpportunity(input.clienteId);
    this.assertActiveUser(input.responsavelId);
    this.assertCanAssignResponsible(actor, input.responsavelId);
    if (input.etapaId) this.assertStageExists(input.etapaId);
    const nextActionId = randomUUID();
    const opportunity = makeOpportunity({
      id: randomUUID(),
      clienteId: input.clienteId,
      titulo: input.titulo,
      tipoDemanda: input.tipoDemanda,
      responsavelId: input.responsavelId,
      situacao: input.situacao,
      proximaAcao: input.proximaAcao ?? null,
      proximaAcaoEm: input.proximaAcaoEm ?? null,
      currentNextActionId: nextActionId,
      createdBy: actor.id,
    });
    this.opportunities.push(opportunity);
    this.nextActions.push(makeNextAction({ id: nextActionId, opportunityId: opportunity.id, opportunityTitle: opportunity.titulo, title: opportunity.proximaAcao ?? "Proxima acao", dueAt: opportunity.proximaAcaoEm ?? now }));
    return opportunity;
  }

  async updateOpportunity(actor: Actor, id: string, input: UpdateOpportunityInput): Promise<OpportunityRecord | null> {
    const opportunity = this.opportunities.find((item) => item.id === id);
    if (!opportunity) return null;
    this.assertEditableOpportunity(opportunity);
    if (input.clienteId) this.assertCustomerCanReceiveOpportunity(input.clienteId);
    if (input.responsavelId) {
      this.assertActiveUser(input.responsavelId);
      this.assertCanAssignResponsible(actor, input.responsavelId);
    }
    if (input.etapaId) this.assertStageExists(input.etapaId);
    if (input.status === "ganha" || input.status === "perdida" || input.status === "arquivada") {
      throw new ApiError(409, "bad_request", "Use o fluxo proprio para aprovar, perder ou arquivar a oportunidade.");
    }
    Object.assign(opportunity, input);
    if (opportunity.status === "ativa" && opportunity.currentNextActionId && (input.proximaAcao !== undefined || input.proximaAcaoEm !== undefined || input.responsavelId !== undefined || input.clienteId !== undefined)) {
      const action = this.nextActions.find((item) => item.id === opportunity.currentNextActionId);
      if (action) {
        action.customerId = opportunity.clienteId;
        action.responsibleUserId = opportunity.responsavelId;
        action.title = opportunity.proximaAcao ?? action.title;
        action.dueAt = opportunity.proximaAcaoEm ?? action.dueAt;
      }
    }
    return opportunity;
  }

  async approveOpportunity(_actor: Actor, id: string, input: ApproveOpportunityInput): Promise<OpportunityRecord | null> {
    const opportunity = this.opportunities.find((item) => item.id === id);
    if (!opportunity) return null;
    this.assertTransition(opportunity, "ganha");
    opportunity.status = "ganha";
    opportunity.etapaNome = "Aprovado";
    opportunity.valorAprovado = input.valorAprovado;
    opportunity.formaPagamento = input.formaPagamento;
    opportunity.quantidadeParcelas = input.formaPagamento.toLocaleLowerCase("pt-BR").includes("vista") ? 1 : input.quantidadeParcelas;
    opportunity.previsaoExecucao = input.previsaoExecucao;
    opportunity.dataAprovacao = now;
    opportunity.currentNextActionId = null;
    opportunity.proximaAcao = null;
    opportunity.proximaAcaoEm = null;
    return opportunity;
  }

  async loseOpportunity(_actor: Actor, id: string, input: { motivoPerdaId: string }): Promise<OpportunityRecord | null> {
    const opportunity = this.opportunities.find((item) => item.id === id);
    if (!opportunity) return null;
    this.assertTransition(opportunity, "perdida");
    this.assertActiveLossReason(input.motivoPerdaId);
    opportunity.status = "perdida";
    opportunity.etapaNome = "Perdido";
    opportunity.motivoPerdaId = input.motivoPerdaId;
    opportunity.motivoPerdaNome = "sem retorno";
    opportunity.dataPerda = now;
    opportunity.currentNextActionId = null;
    opportunity.proximaAcao = null;
    opportunity.proximaAcaoEm = null;
    return opportunity;
  }

  async setOpportunityArchived(_actor: Actor, id: string, archived: boolean): Promise<OpportunityRecord | null> {
    const opportunity = this.opportunities.find((item) => item.id === id);
    if (!opportunity) return null;
    opportunity.archivedAt = archived ? now : null;
    return opportunity;
  }

  async listActivities(actor: Actor, filters: { customerId?: string; opportunityId?: string }): Promise<ActivityRecord[]> {
    return this.activities.filter((activity) => {
      if (filters.customerId && activity.customerId !== filters.customerId) return false;
      if (filters.opportunityId && activity.opportunityId !== filters.opportunityId) return false;
      if (actor.role === "vendedor") {
        const opportunity = this.opportunities.find((item) => item.id === activity.opportunityId);
        return activity.createdBy === actor.id || opportunity?.responsavelId === actor.id;
      }
      return true;
    });
  }

  async createActivity(actor: Actor, input: CreateActivityInput): Promise<ActivityRecord> {
    this.assertCustomerOpportunityMatch(input.customerId, input.opportunityId ?? null);
    const activity = makeActivity({
      id: randomUUID(),
      customerId: input.customerId,
      opportunityId: input.opportunityId ?? null,
      type: input.type,
      title: input.title ?? null,
      description: input.description,
      createdBy: actor.id,
      source: input.source ?? "manual",
    });
    this.activities.push(activity);
    return activity;
  }

  async updateActivity(_actor: Actor, id: string, input: UpdateActivityInput): Promise<ActivityRecord | null> {
    const activity = this.activities.find((item) => item.id === id);
    if (!activity) return null;
    Object.assign(activity, input);
    return activity;
  }

  async setActivityArchived(_actor: Actor, id: string, archived: boolean): Promise<ActivityRecord | null> {
    const activity = this.activities.find((item) => item.id === id);
    if (!activity) return null;
    activity.archivedAt = archived ? now : null;
    return activity;
  }

  async listNextActions(actor: Actor, filters: { responsibleUserId?: string; status?: "pending" | "completed" | "cancelled"; category?: "commercial" | "warranty" | "support" | "after_sales"; overdue?: boolean; today?: boolean; future?: boolean; customerId?: string; opportunityId?: string; priority?: "low" | "normal" | "high" }): Promise<NextActionRecord[]> {
    return this.nextActions.filter((action) => {
      if (actor.role === "vendedor" && action.responsibleUserId !== actor.id) return false;
      if (filters.responsibleUserId && action.responsibleUserId !== filters.responsibleUserId) return false;
      if (filters.status && action.status !== filters.status) return false;
      if (filters.category && action.category !== filters.category) return false;
      if (filters.customerId && action.customerId !== filters.customerId) return false;
      if (filters.opportunityId && action.opportunityId !== filters.opportunityId) return false;
      if (filters.priority && action.priority !== filters.priority) return false;
      if (filters.overdue && !(action.status === "pending" && action.dueAt < now)) return false;
      if (filters.today && !action.dueAt.startsWith("2026-07-20")) return false;
      if (filters.future && !(action.status === "pending" && action.dueAt >= "2026-07-21T00:00:00.000Z")) return false;
      return true;
    });
  }

  async getCommercialCenter(actor: Actor, filters: CommercialCenterFilters): Promise<CommercialCenterRecord> {
    const actions = await this.listNextActions(actor, { status: "pending", responsibleUserId: filters.responsibleUserId, category: filters.category, priority: filters.priority });
    const opportunities = await this.listOpportunities(actor, {
      status: "ativa",
      etapaId: filters.stageId,
      responsavelId: filters.responsibleUserId,
      situation: filters.situation,
      demandType: filters.demandType,
      from: filters.from,
      to: filters.to,
    });
    const actionItems = actions.map((action) => ({
      id: action.id,
      customerId: action.customerId,
      customerName: action.customerName,
      opportunityId: action.opportunityId,
      opportunityTitle: action.opportunityTitle,
      opportunitySituation: opportunities.find((opportunity) => opportunity.id === action.opportunityId)?.situacao ?? null,
      category: action.category,
      title: action.title,
      responsibleUserId: action.responsibleUserId,
      dueAt: action.dueAt,
      overdueHours: Math.max(0, Math.floor((new Date(now).getTime() - new Date(action.dueAt).getTime()) / (60 * 60 * 1000))),
      priority: action.priority,
    }));
    const opportunityItems = opportunities.map((opportunity) => ({
      id: opportunity.id,
      customerId: opportunity.clienteId,
      customerName: opportunity.clienteNome,
      title: opportunity.titulo,
      stageName: opportunity.etapaNome,
      situation: opportunity.situacao,
      responsibleUserId: opportunity.responsavelId,
      budgetValue: opportunity.valorOrcamento,
      budgetSentAt: opportunity.dataOrcamento,
      nextActionTitle: opportunity.proximaAcao,
      nextActionDueAt: opportunity.proximaAcaoEm,
      daysOpen: 1,
    }));

    return {
      generatedAt: now,
      filters,
      overdueActions: actionItems.filter((action) => action.dueAt < "2026-07-20T00:00:00.000Z"),
      todayActions: actionItems.filter((action) => action.dueAt.startsWith("2026-07-20")),
      opportunitiesWithoutNextAction: opportunityItems.filter((opportunity) => !opportunity.nextActionTitle || !opportunity.nextActionDueAt),
      quotesAwaitingReturn: opportunityItems.filter((opportunity) => ["Orcamento enviado", "Negociacao"].includes(opportunity.stageName)),
      upcomingVisits: actionItems.filter((action) => /visita/i.test(action.title)),
      stalledOpportunities: opportunityItems.filter((opportunity) => opportunity.daysOpen >= 3 && !opportunity.nextActionDueAt),
      auvoInbox: { status: "homologation", pending: 0, message: "Nenhum atendimento recebido do Auvo. A integracao ainda esta em homologacao." },
      summary: {
        newCustomers: this.customers.length,
        newOpportunities: opportunities.length,
        approvedOpportunities: this.opportunities.filter((opportunity) => opportunity.status === "ganha").length,
        lostOpportunities: this.opportunities.filter((opportunity) => opportunity.status === "perdida").length,
        budgetValue: opportunities.reduce((sum, opportunity) => sum + (opportunity.valorOrcamento ?? 0), 0),
        approvedValue: this.opportunities.reduce((sum, opportunity) => sum + (opportunity.valorAprovado ?? 0), 0),
        simpleConversionRate: 0,
        averageApprovedTicket: 0,
      },
    };
  }

  async listNotifications(actor: Actor, filters: NotificationFilters): Promise<NotificationListRecord> {
    const filtered = this.notifications.filter((notification) => {
      if (notification.userId !== actor.id) return false;
      if (filters.status === "active" && !["unread", "read"].includes(notification.status)) return false;
      if (filters.status && filters.status !== "active" && notification.status !== filters.status) return false;
      if (filters.type && notification.type !== filters.type) return false;
      if (filters.severity && notification.severity !== filters.severity) return false;
      return true;
    });
    const limit = filters.limit ?? 20;
    return { notifications: filtered.slice(0, limit), nextCursor: filtered.length > limit ? filtered[limit - 1]?.id ?? null : null };
  }

  async getUnreadNotificationsCount(actor: Actor): Promise<{ count: number }> {
    return { count: this.notifications.filter((notification) => notification.userId === actor.id && notification.status === "unread" && !notification.archivedAt && !notification.resolvedAt).length };
  }

  async markNotificationRead(actor: Actor, id: string): Promise<NotificationRecord | null> {
    const notification = this.notifications.find((item) => item.id === id && item.userId === actor.id && !item.archivedAt && !item.resolvedAt);
    if (!notification) return null;
    notification.status = "read";
    notification.readAt = now;
    notification.updatedAt = now;
    return notification;
  }

  async markAllNotificationsRead(actor: Actor): Promise<{ updated: number }> {
    let updated = 0;
    for (const notification of this.notifications) {
      if (notification.userId === actor.id && notification.status === "unread" && !notification.archivedAt && !notification.resolvedAt) {
        notification.status = "read";
        notification.readAt = now;
        notification.updatedAt = now;
        updated += 1;
      }
    }
    return { updated };
  }

  async archiveNotification(actor: Actor, id: string): Promise<NotificationRecord | null> {
    const notification = this.notifications.find((item) => item.id === id && item.userId === actor.id && !item.resolvedAt);
    if (!notification) return null;
    notification.status = "archived";
    notification.archivedAt = now;
    notification.updatedAt = now;
    return notification;
  }

  async snoozeNotification(actor: Actor, id: string, input: SnoozeNotificationInput): Promise<NotificationRecord | null> {
    const notification = this.notifications.find((item) => item.id === id && item.userId === actor.id && !item.archivedAt && !item.resolvedAt);
    if (!notification) return null;
    notification.snoozedUntil = input.snoozedUntil;
    notification.updatedAt = now;
    return notification;
  }

  async reconcileNotifications(actor: Actor): Promise<NotificationReconcileResult> {
    if (actor.role !== "gestor") throw new ApiError(403, "forbidden", "Apenas gestor pode reconciliar notificacoes.");
    return { generated: 0, updated: 0, resolved: 0 };
  }

  async receiveAuvoWebhookEvent(input: ReceiveAuvoWebhookEventInput): Promise<ReceiveAuvoWebhookEventResult> {
    const payloadHash = createWebhookPayloadHash(input.payload);
    const existing = this.auvoEvents.find((event) => event.payloadHash === payloadHash);
    if (existing) return { event: existing, duplicate: true };

    const payload = input.payload;
    const event: AuvoWebhookEventRecord = {
      id: randomUUID(),
      provider: "auvo",
      externalEventId: typeof (payload as { id?: unknown }).id === "string" ? (payload as { id: string }).id : null,
      eventType: typeof (payload as { eventType?: unknown }).eventType === "string" ? (payload as { eventType: string }).eventType : null,
      payloadHash,
      sanitizedHeaders: input.headers,
      payload,
      sanitizedPayload: sanitizeWebhookPayload(payload),
      status: "received",
      attemptCount: 0,
      lastError: null,
      receivedAt: now,
      processingStartedAt: null,
      processedAt: null,
      ignoredAt: null,
      createdAt: now,
      updatedAt: now,
      sourceIpHash: input.sourceIpHash,
      contentLength: input.contentLength,
      schemaVersion: 1,
      nextRetryAt: null,
    };
    this.auvoEvents.unshift(event);
    return { event, duplicate: false };
  }

  async listAuvoWebhookEvents(_actor: Actor, filters: AuvoWebhookEventFilters): Promise<AuvoWebhookEventListRecord> {
    const limit = filters.limit ?? 20;
    const filtered = this.auvoEvents.filter((event) => {
      if (filters.status && event.status !== filters.status) return false;
      if (filters.eventType && event.eventType !== filters.eventType) return false;
      return true;
    });
    return { events: filtered.slice(0, limit), nextCursor: filtered.length > limit ? filtered[limit - 1]?.id ?? null : null };
  }

  async getAuvoWebhookEvent(_actor: Actor, id: string): Promise<AuvoWebhookEventRecord | null> {
    return this.auvoEvents.find((event) => event.id === id) ?? null;
  }

  async reprocessAuvoWebhookEvent(_actor: Actor, id: string): Promise<AuvoWebhookEventRecord | null> {
    const event = this.auvoEvents.find((item) => item.id === id);
    if (!event) return null;
    if (event.status === "processed") throw new ApiError(409, "bad_request", "Evento ja processado nao pode voltar para a fila.");
    event.status = "received";
    event.attemptCount += 1;
    event.lastError = null;
    event.processingStartedAt = null;
    event.processedAt = null;
    event.ignoredAt = null;
    event.updatedAt = now;
    return event;
  }

  async ignoreAuvoWebhookEvent(_actor: Actor, id: string): Promise<AuvoWebhookEventRecord | null> {
    const event = this.auvoEvents.find((item) => item.id === id);
    if (!event) return null;
    if (event.status === "processed") throw new ApiError(409, "bad_request", "Evento ja processado nao pode ser ignorado.");
    event.status = "ignored";
    event.ignoredAt = now;
    event.updatedAt = now;
    return event;
  }

  async getAuvoIntegrationStatus(_actor: Actor, configured: boolean): Promise<AuvoIntegrationStatusRecord> {
    return {
      configured,
      lastReceivedAt: this.auvoEvents[0]?.receivedAt ?? null,
      lastProcessedAt: this.auvoEvents.find((event) => event.status === "processed")?.processedAt ?? null,
      pendingCount: this.auvoEvents.filter((event) => event.status === "received" || event.status === "processing").length,
      failedCount: this.auvoEvents.filter((event) => event.status === "failed").length,
      recentEvents: this.auvoEvents.slice(0, 5),
    };
  }

  async getNextAction(actor: Actor, id: string): Promise<NextActionRecord | null> {
    const action = this.nextActions.find((item) => item.id === id) ?? null;
    if (actor.role === "vendedor" && action?.responsibleUserId !== actor.id) return null;
    return action;
  }

  async createNextAction(actor: Actor, input: CreateNextActionInput): Promise<NextActionRecord> {
    this.assertCustomerOpportunityMatch(input.customerId, input.opportunityId ?? null);
    this.assertActiveUser(input.responsibleUserId);
    if (actor.role === "vendedor" && input.responsibleUserId !== actor.id) {
      throw new ApiError(403, "forbidden", "Vendedor nao pode alterar acoes de outro responsavel.");
    }
    const action = makeNextAction({
      id: randomUUID(),
      customerId: input.customerId,
      opportunityId: input.opportunityId ?? null,
      responsibleUserId: input.responsibleUserId,
      category: input.category ?? "commercial",
      title: input.title,
      description: input.description ?? null,
      dueAt: input.dueAt,
      priority: input.priority ?? "normal",
      createdBy: actor.id,
    });
    this.nextActions.push(action);
    if (action.opportunityId) {
      const opportunity = this.opportunities.find((item) => item.id === action.opportunityId);
      if (opportunity) {
        opportunity.currentNextActionId = action.id;
        opportunity.proximaAcao = action.title;
        opportunity.proximaAcaoEm = action.dueAt;
      }
    }
    return action;
  }

  async updateNextAction(_actor: Actor, id: string, input: UpdateNextActionInput): Promise<NextActionRecord | null> {
    const action = this.nextActions.find((item) => item.id === id && item.status === "pending");
    if (!action) return null;
    Object.assign(action, input);
    return action;
  }

  async completeNextAction(actor: Actor, id: string, input: CompleteNextActionInput): Promise<NextActionRecord | null> {
    return this.closeAction(actor, id, "completed", input);
  }

  async postponeNextAction(actor: Actor, id: string, input: PostponeNextActionInput): Promise<NextActionRecord | null> {
    const action = await this.getNextAction(actor, id);
    if (!action || action.status !== "pending") return null;
    action.postponedFrom = action.dueAt;
    action.dueAt = input.dueAt;
    this.activities.push(makeActivity({ id: randomUUID(), customerId: action.customerId, opportunityId: action.opportunityId, type: "follow_up", title: "Proxima acao reagendada", description: `Reagendada para ${input.dueAt}.`, createdBy: actor.id, source: "system" }));
    return action;
  }

  async cancelNextAction(actor: Actor, id: string, input: CancelNextActionInput): Promise<NextActionRecord | null> {
    return this.closeAction(actor, id, "cancelled", input);
  }

  async listPipelineStages(): Promise<PipelineStageRecord[]> {
    return this.stages;
  }

  async listLossReasons(): Promise<LossReasonRecord[]> {
    return this.lossReasons;
  }

  async close(): Promise<void> {
    return undefined;
  }

  firstOpportunityId(): string {
    return this.opportunities[0]?.id ?? opportunityId;
  }

  private withDuplicatePhones(customer: CustomerRecord): CustomerRecord {
    return {
      ...customer,
      duplicatePhoneCustomerIds: this.customers
        .filter((item) => item.id !== customer.id && item.telefoneNormalizado === customer.telefoneNormalizado && item.telefoneNormalizado)
        .map((item) => item.id),
    };
  }

  private async closeAction(actor: Actor, id: string, status: "completed" | "cancelled", input: CompleteNextActionInput | CancelNextActionInput): Promise<NextActionRecord | null> {
    const action = await this.getNextAction(actor, id);
    if (!action || action.status !== "pending") return null;
    const opportunity = action.opportunityId ? this.opportunities.find((item) => item.id === action.opportunityId) : null;
    if (opportunity?.status === "ativa" && opportunity.currentNextActionId === action.id && !("nextAction" in input && input.nextAction)) {
      throw new ApiError(422, "bad_request", "Defina a proxima acao antes de concluir esta atividade.");
    }
    if ("nextAction" in input && input.nextAction) {
      this.assertActiveUser(input.nextAction.responsibleUserId);
      if (actor.role === "vendedor" && input.nextAction.responsibleUserId !== actor.id) {
        throw new ApiError(403, "forbidden", "Vendedor nao pode alterar acoes de outro responsavel.");
      }
      const replacement = await this.createNextAction(actor, input.nextAction);
      if (opportunity) {
        opportunity.currentNextActionId = replacement.id;
        opportunity.proximaAcao = replacement.title;
        opportunity.proximaAcaoEm = replacement.dueAt;
      }
    }
    if (status === "completed") {
      action.status = "completed";
      action.completedAt = now;
      action.completedBy = actor.id;
      action.completionResult = (input as CompleteNextActionInput).completionResult;
    } else {
      action.status = "cancelled";
      action.cancelledAt = now;
      action.cancelledBy = actor.id;
      action.cancellationReason = (input as CancelNextActionInput).cancellationReason;
    }
    this.activities.push(makeActivity({ id: randomUUID(), customerId: action.customerId, opportunityId: action.opportunityId, type: "follow_up", title: status === "completed" ? "Proxima acao concluida" : "Proxima acao cancelada", description: action.completionResult ?? action.cancellationReason ?? "", createdBy: actor.id, source: "manual" }));
    return action;
  }

  private assertActiveUser(userId: string): void {
    if (!this.activeUsers.has(userId)) throw new ApiError(422, "bad_request", "Informe um responsavel ativo no CRM.");
  }

  private assertCustomerOpportunityMatch(customerId: string, opportunityId: string | null): void {
    if (!this.customers.some((item) => item.id === customerId)) {
      throw new ApiError(422, "bad_request", "Cliente informado nao existe.");
    }
    if (!opportunityId) return;
    const opportunity = this.opportunities.find((item) => item.id === opportunityId && item.clienteId === customerId);
    if (!opportunity) throw new ApiError(400, "bad_request", "A oportunidade informada nao pertence ao cliente.");
  }

  private assertCustomerCanReceiveOpportunity(customerId: string): void {
    const customer = this.customers.find((item) => item.id === customerId);
    if (!customer) throw new ApiError(422, "bad_request", "Cliente informado nao existe.");
    if (customer.archivedAt) throw new ApiError(409, "bad_request", "Restaure o cliente antes de criar ou mover uma oportunidade.");
  }

  private assertStageExists(stageId: string): void {
    if (!this.stages.some((stage) => stage.id === stageId)) throw new ApiError(422, "bad_request", "Etapa informada nao existe.");
  }

  private assertActiveLossReason(lossReasonId: string): void {
    if (!this.lossReasons.some((reason) => reason.id === lossReasonId)) {
      throw new ApiError(422, "bad_request", "Motivo de perda informado nao existe ou esta inativo.");
    }
  }

  private assertCanAssignResponsible(actor: Actor, responsibleUserId: string): void {
    if (actor.role === "vendedor" && responsibleUserId !== actor.id) {
      throw new ApiError(403, "forbidden", "Vendedor nao pode atribuir oportunidade para outro responsavel.");
    }
  }

  private assertEditableOpportunity(opportunity: OpportunityRecord): void {
    if (opportunity.archivedAt || opportunity.status === "arquivada") throw new ApiError(409, "bad_request", "Oportunidade arquivada nao pode ser editada.");
    if (opportunity.status === "ganha") throw new ApiError(409, "bad_request", "Oportunidade aprovada nao pode ser editada por fluxo comum.");
    if (opportunity.status === "perdida") throw new ApiError(409, "bad_request", "Oportunidade perdida nao pode ser editada por fluxo comum.");
  }

  private assertTransition(opportunity: OpportunityRecord, nextStatus: "ganha" | "perdida"): void {
    if (opportunity.archivedAt) throw new ApiError(409, "bad_request", "Oportunidade arquivada nao pode mudar de status.");
    if (opportunity.status === "ganha" && nextStatus === "perdida") throw new ApiError(409, "bad_request", "Oportunidade aprovada nao pode ser marcada como perdida.");
    if (opportunity.status === "perdida" && nextStatus === "ganha") throw new ApiError(409, "bad_request", "Oportunidade perdida nao pode ser aprovada.");
    if (opportunity.status === nextStatus) throw new ApiError(409, "bad_request", "Esta transicao ja foi registrada.");
  }
}

class FakeDatabaseHealth implements DatabaseHealth {
  async check(): Promise<"connected"> {
    return "connected";
  }

  async close(): Promise<void> {
    return undefined;
  }
}

function makeCustomer(overrides: Partial<CustomerRecord>): CustomerRecord {
  return {
    id: overrides.id ?? customerId,
    tipoPessoa: overrides.tipoPessoa ?? "fisica",
    nome: overrides.nome ?? "Cliente",
    nomeFantasia: null,
    telefone: overrides.telefone ?? null,
    telefoneNormalizado: overrides.telefoneNormalizado ?? null,
    email: null,
    documento: null,
    empresa: null,
    bairro: null,
    cidade: null,
    estado: null,
    observacoes: null,
    auvoContactId: null,
    createdAt: now,
    updatedAt: now,
    createdBy: overrides.createdBy ?? actorId,
    updatedBy: overrides.updatedBy ?? null,
    archivedAt: null,
    opportunitiesCount: 0,
    duplicatePhoneCustomerIds: [],
  };
}

function makeOpportunity(overrides: Partial<OpportunityRecord> & { createdBy?: string }): OpportunityRecord {
  return {
    id: overrides.id ?? opportunityId,
    clienteId: overrides.clienteId ?? customerId,
    clienteNome: "Cliente Base",
    titulo: overrides.titulo ?? "Oportunidade",
    descricao: null,
    tipoDemanda: overrides.tipoDemanda ?? "instalacao",
    origem: null,
    responsavelId: overrides.responsavelId ?? actorId,
    etapaId: stageId,
    etapaNome: "Novo lead",
    situacao: overrides.situacao ?? "em andamento",
    valorEstimado: null,
    valorOrcamento: null,
    valorAprovado: null,
    formaPagamento: null,
    quantidadeParcelas: null,
    previsaoExecucao: null,
    proximaAcao: overrides.proximaAcao ?? "Enviar proposta",
    proximaAcaoEm: overrides.proximaAcaoEm ?? "2026-07-21T13:00:00.000Z",
    dataEntrada: now,
    dataOrcamento: null,
    dataAprovacao: null,
    dataPerda: null,
    motivoPerdaId: null,
    motivoPerdaNome: null,
    status: overrides.status ?? "ativa",
    currentNextActionId: overrides.currentNextActionId ?? null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };
}

function makeActivity(overrides: Partial<ActivityRecord>): ActivityRecord {
  return {
    id: overrides.id ?? randomUUID(),
    customerId: overrides.customerId ?? customerId,
    opportunityId: overrides.opportunityId ?? null,
    type: overrides.type ?? "note",
    title: overrides.title ?? null,
    description: overrides.description ?? "Atividade registrada.",
    occurredAt: now,
    createdBy: overrides.createdBy ?? actorId,
    source: overrides.source ?? "manual",
    metadata: {},
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };
}

function makeNextAction(overrides: Partial<NextActionRecord>): NextActionRecord {
  return {
    id: overrides.id ?? randomUUID(),
    customerId: overrides.customerId ?? customerId,
    customerName: "Cliente Base",
    opportunityId: overrides.opportunityId ?? null,
    opportunityTitle: overrides.opportunityTitle ?? null,
    responsibleUserId: overrides.responsibleUserId ?? actorId,
    category: overrides.category ?? "commercial",
    title: overrides.title ?? "Retornar ao cliente",
    description: overrides.description ?? null,
    dueAt: overrides.dueAt ?? "2026-07-21T13:00:00.000Z",
    priority: overrides.priority ?? "normal",
    status: overrides.status ?? "pending",
    completedAt: null,
    completedBy: null,
    completionResult: null,
    postponedFrom: null,
    createdBy: overrides.createdBy ?? actorId,
    createdAt: now,
    updatedAt: now,
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    archivedAt: null,
  };
}

function makeNotification(overrides: Partial<NotificationRecord>): NotificationRecord {
  const id = overrides.id ?? randomUUID();
  return {
    id,
    userId: overrides.userId ?? actorId,
    type: overrides.type ?? "overdue_next_action",
    priority: overrides.priority ?? "alta",
    severity: overrides.severity ?? "urgent",
    title: overrides.title ?? "Acao vencida",
    body: overrides.body ?? "Existe uma acao que exige atencao.",
    entityType: overrides.entityType ?? "next_action",
    entityId: overrides.entityId ?? id,
    customerId: overrides.customerId ?? customerId,
    opportunityId: overrides.opportunityId ?? null,
    nextActionId: overrides.nextActionId ?? null,
    actionUrl: overrides.actionUrl ?? `/app/notifications/${id}`,
    dedupeKey: overrides.dedupeKey ?? `notification:${id}`,
    status: overrides.status ?? "unread",
    readAt: overrides.readAt ?? null,
    archivedAt: overrides.archivedAt ?? null,
    snoozedUntil: overrides.snoozedUntil ?? null,
    resolvedAt: overrides.resolvedAt ?? null,
    metadata: overrides.metadata ?? {},
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function makeCreateOpportunityInput(): CreateOpportunityInput {
  return {
    clienteId: customerId,
    titulo: "Instalacao suite",
    tipoDemanda: "instalacao",
    responsavelId: actorId,
    situacao: "em andamento",
    proximaAcao: "Enviar proposta",
    proximaAcaoEm: "2026-07-21T13:00:00.000Z",
    status: "ativa",
  };
}
