import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Permission } from "../auth/rbac.js";
import { ApiError } from "../errors.js";
import type { ServerDependencies } from "../app.js";
import type { Actor } from "./types.js";
import {
  activityCreateSchema,
  activityUpdateSchema,
  approveOpportunitySchema,
  cancelNextActionSchema,
  completeNextActionSchema,
  customerCreateSchema,
  customerUpdateSchema,
  loseOpportunitySchema,
  nextActionCreateSchema,
  nextActionUpdateSchema,
  opportunityCreateSchema,
  opportunityUpdateSchema,
  parseBody,
  postponeNextActionSchema,
} from "./validation.js";

type PreHandlerFactory = ReturnType<typeof createRouteGuards>;

export function registerCrmRoutes(app: FastifyInstance, dependencies: ServerDependencies, guards: PreHandlerFactory): void {
  const repository = dependencies.crmRepository;

  app.get("/api/customers", { preHandler: [guards.authenticate, guards.requirePermission("customers:read")] }, async (request) => {
    const query = request.query as { search?: string; archived?: string };
    return {
      customers: await repository.listCustomers(getActor(request), {
        search: query.search,
        archived: query.archived === "true",
      }),
    };
  });

  app.post("/api/customers", { preHandler: [guards.authenticate, guards.requirePermission("customers:write")] }, async (request, reply) => {
    const customer = await repository.createCustomer(getActor(request), parseBody(customerCreateSchema, request.body));
    return reply.status(201).send({ customer });
  });

  app.get("/api/customers/:id", { preHandler: [guards.authenticate, guards.requirePermission("customers:read")] }, async (request) => {
    const customer = await repository.getCustomer(getActor(request), readIdParam(request));
    if (!customer) throw new ApiError(404, "not_found", "Cliente nao encontrado.");
    return { customer };
  });

  app.patch("/api/customers/:id", { preHandler: [guards.authenticate, guards.requirePermission("customers:write")] }, async (request) => {
    const customer = await repository.updateCustomer(getActor(request), readIdParam(request), parseBody(customerUpdateSchema, request.body));
    if (!customer) throw new ApiError(404, "not_found", "Cliente nao encontrado.");
    return { customer };
  });

  app.post("/api/customers/:id/archive", { preHandler: [guards.authenticate, guards.requirePermission("customers:write")] }, async (request) => {
    const customer = await repository.setCustomerArchived(getActor(request), readIdParam(request), true);
    if (!customer) throw new ApiError(404, "not_found", "Cliente nao encontrado.");
    return { customer };
  });

  app.post("/api/customers/:id/restore", { preHandler: [guards.authenticate, guards.requirePermission("customers:write")] }, async (request) => {
    const customer = await repository.setCustomerArchived(getActor(request), readIdParam(request), false);
    if (!customer) throw new ApiError(404, "not_found", "Cliente nao encontrado.");
    return { customer };
  });

  app.get("/api/opportunities", { preHandler: [guards.authenticate, guards.requirePermission("opportunities:read")] }, async (request) => {
    const query = request.query as { search?: string; status?: string; etapaId?: string; responsavelId?: string };
    return {
      opportunities: await repository.listOpportunities(getActor(request), query),
    };
  });

  app.post("/api/opportunities", { preHandler: [guards.authenticate, guards.requirePermission("opportunities:write")] }, async (request, reply) => {
    const opportunity = await repository.createOpportunity(getActor(request), parseBody(opportunityCreateSchema, request.body));
    return reply.status(201).send({ opportunity });
  });

  app.get("/api/opportunities/:id", { preHandler: [guards.authenticate, guards.requirePermission("opportunities:read")] }, async (request) => {
    const opportunity = await repository.getOpportunity(getActor(request), readIdParam(request));
    if (!opportunity) throw new ApiError(404, "not_found", "Oportunidade nao encontrada.");
    return { opportunity };
  });

  app.patch("/api/opportunities/:id", { preHandler: [guards.authenticate, guards.requirePermission("opportunities:write")] }, async (request) => {
    const opportunity = await repository.updateOpportunity(getActor(request), readIdParam(request), parseBody(opportunityUpdateSchema, request.body));
    if (!opportunity) throw new ApiError(404, "not_found", "Oportunidade nao encontrada.");
    return { opportunity };
  });

  app.post("/api/opportunities/:id/approve", { preHandler: [guards.authenticate, guards.requirePermission("opportunities:write")] }, async (request) => {
    const opportunity = await repository.approveOpportunity(getActor(request), readIdParam(request), parseBody(approveOpportunitySchema, request.body));
    if (!opportunity) throw new ApiError(404, "not_found", "Oportunidade nao encontrada.");
    return { opportunity };
  });

  app.post("/api/opportunities/:id/lose", { preHandler: [guards.authenticate, guards.requirePermission("opportunities:write")] }, async (request) => {
    const opportunity = await repository.loseOpportunity(getActor(request), readIdParam(request), parseBody(loseOpportunitySchema, request.body));
    if (!opportunity) throw new ApiError(404, "not_found", "Oportunidade nao encontrada.");
    return { opportunity };
  });

  app.post("/api/opportunities/:id/archive", { preHandler: [guards.authenticate, guards.requirePermission("opportunities:write")] }, async (request) => {
    const opportunity = await repository.setOpportunityArchived(getActor(request), readIdParam(request), true);
    if (!opportunity) throw new ApiError(404, "not_found", "Oportunidade nao encontrada.");
    return { opportunity };
  });

  app.post("/api/opportunities/:id/restore", { preHandler: [guards.authenticate, guards.requirePermission("opportunities:write")] }, async (request) => {
    const opportunity = await repository.setOpportunityArchived(getActor(request), readIdParam(request), false);
    if (!opportunity) throw new ApiError(404, "not_found", "Oportunidade nao encontrada.");
    return { opportunity };
  });

  app.get("/api/pipeline-stages", { preHandler: [guards.authenticate, guards.requirePermission("opportunities:read")] }, async (request) => ({
    stages: await repository.listPipelineStages(getActor(request)),
  }));

  app.get("/api/loss-reasons", { preHandler: [guards.authenticate, guards.requirePermission("opportunities:read")] }, async (request) => ({
    lossReasons: await repository.listLossReasons(getActor(request)),
  }));

  app.get("/api/customers/:id/activities", { preHandler: [guards.authenticate, guards.requirePermission("activities:read")] }, async (request) => ({
    activities: await repository.listActivities(getActor(request), { customerId: readIdParam(request) }),
  }));

  app.get("/api/opportunities/:id/activities", { preHandler: [guards.authenticate, guards.requirePermission("activities:read")] }, async (request) => ({
    activities: await repository.listActivities(getActor(request), { opportunityId: readIdParam(request) }),
  }));

  app.post("/api/activities", { preHandler: [guards.authenticate, guards.requirePermission("activities:write")] }, async (request, reply) => {
    const activity = await repository.createActivity(getActor(request), parseBody(activityCreateSchema, request.body));
    return reply.status(201).send({ activity });
  });

  app.patch("/api/activities/:id", { preHandler: [guards.authenticate, guards.requirePermission("activities:write")] }, async (request) => {
    const activity = await repository.updateActivity(getActor(request), readIdParam(request), parseBody(activityUpdateSchema, request.body));
    if (!activity) throw new ApiError(404, "not_found", "Atividade nao encontrada.");
    return { activity };
  });

  app.post("/api/activities/:id/archive", { preHandler: [guards.authenticate, guards.requirePermission("activities:write")] }, async (request) => {
    const activity = await repository.setActivityArchived(getActor(request), readIdParam(request), true);
    if (!activity) throw new ApiError(404, "not_found", "Atividade nao encontrada.");
    return { activity };
  });

  app.get("/api/next-actions", { preHandler: [guards.authenticate, guards.requirePermission("next_actions:read")] }, async (request) => {
    const query = request.query as {
      responsibleUserId?: string;
      status?: "pending" | "completed" | "cancelled";
      category?: "commercial" | "warranty" | "support" | "after_sales";
      overdue?: string;
      today?: string;
      future?: string;
      dateFrom?: string;
      dateTo?: string;
      customerId?: string;
      opportunityId?: string;
      priority?: "low" | "normal" | "high";
    };
    return {
      nextActions: await repository.listNextActions(getActor(request), {
        ...query,
        overdue: query.overdue === "true",
        today: query.today === "true",
        future: query.future === "true",
      }),
    };
  });

  app.get("/api/next-actions/:id", { preHandler: [guards.authenticate, guards.requirePermission("next_actions:read")] }, async (request) => {
    const nextAction = await repository.getNextAction(getActor(request), readIdParam(request));
    if (!nextAction) throw new ApiError(404, "not_found", "Proxima acao nao encontrada.");
    return { nextAction };
  });

  app.post("/api/next-actions", { preHandler: [guards.authenticate, guards.requirePermission("next_actions:write")] }, async (request, reply) => {
    const nextAction = await repository.createNextAction(getActor(request), parseBody(nextActionCreateSchema, request.body));
    return reply.status(201).send({ nextAction });
  });

  app.patch("/api/next-actions/:id", { preHandler: [guards.authenticate, guards.requirePermission("next_actions:write")] }, async (request) => {
    const nextAction = await repository.updateNextAction(getActor(request), readIdParam(request), parseBody(nextActionUpdateSchema, request.body));
    if (!nextAction) throw new ApiError(404, "not_found", "Proxima acao nao encontrada.");
    return { nextAction };
  });

  app.post("/api/next-actions/:id/complete", { preHandler: [guards.authenticate, guards.requirePermission("next_actions:write")] }, async (request) => {
    const nextAction = await repository.completeNextAction(getActor(request), readIdParam(request), parseBody(completeNextActionSchema, request.body));
    if (!nextAction) throw new ApiError(404, "not_found", "Proxima acao pendente nao encontrada.");
    return { nextAction };
  });

  app.post("/api/next-actions/:id/postpone", { preHandler: [guards.authenticate, guards.requirePermission("next_actions:write")] }, async (request) => {
    const nextAction = await repository.postponeNextAction(getActor(request), readIdParam(request), parseBody(postponeNextActionSchema, request.body));
    if (!nextAction) throw new ApiError(404, "not_found", "Proxima acao pendente nao encontrada.");
    return { nextAction };
  });

  app.post("/api/next-actions/:id/cancel", { preHandler: [guards.authenticate, guards.requirePermission("next_actions:write")] }, async (request) => {
    const nextAction = await repository.cancelNextAction(getActor(request), readIdParam(request), parseBody(cancelNextActionSchema, request.body));
    if (!nextAction) throw new ApiError(404, "not_found", "Proxima acao pendente nao encontrada.");
    return { nextAction };
  });
}

export function createRouteGuards(
  authenticate: (request: FastifyRequest) => Promise<void>,
  requirePermission: (permission: Permission) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>,
) {
  return { authenticate, requirePermission };
}

function getActor(request: FastifyRequest): Actor {
  const user = request.crmUser;
  if (!user) throw new ApiError(401, "unauthorized", "Autenticacao obrigatoria.");
  return { id: user.id, role: user.role };
}

function readIdParam(request: FastifyRequest): string {
  const params = request.params as { id?: string };
  if (!params.id) throw new ApiError(400, "bad_request", "ID obrigatorio.");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)) {
    throw new ApiError(400, "bad_request", "ID invalido.");
  }
  return params.id;
}
