import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { getPermissionsForRole, roleHasPermission, type Permission } from "./auth/rbac.js";
import type { AuthenticatedUser, AuthVerifier, MembershipRepository } from "./auth/types.js";
import type { ServerConfig } from "./config.js";
import { AUVO_WEBHOOK_MAX_BYTES, sanitizeWebhookHeaders } from "./crm/auvo-webhook.js";
import { createRouteGuards, registerCrmRoutes } from "./crm/routes.js";
import type { CrmDataRepository } from "./crm/types.js";
import type { DatabaseHealth } from "./database/health.js";
import { ApiError, toPublicError } from "./errors.js";

declare module "fastify" {
  interface FastifyRequest {
    crmUser?: AuthenticatedUser;
  }
}

export type ServerDependencies = {
  config: Pick<ServerConfig, "corsOrigins" | "CRM_LOG_LEVEL" | "AUVO_WEBHOOK_SECRET">;
  authVerifier: AuthVerifier;
  membershipRepository: MembershipRepository;
  crmRepository: CrmDataRepository;
  databaseHealth: DatabaseHealth;
};

export function buildServer(dependencies: ServerDependencies): FastifyInstance {
  const app = Fastify({
    bodyLimit: AUVO_WEBHOOK_MAX_BYTES,
    logger: {
      level: dependencies.config.CRM_LOG_LEVEL,
      redact: ["req.headers.authorization", "request.headers.authorization", "req.headers.cookie", "request.headers.cookie"],
    },
    genReqId: () => randomUUID(),
  });

  void app.register(cors, {
    origin(origin, callback) {
      if (!origin || dependencies.config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new ApiError(403, "forbidden", "Origem nao autorizada pelo CORS."), false);
    },
    credentials: true,
  });

  void app.register(rateLimit, {
    global: false,
    errorResponseBuilder: () => new ApiError(429, "rate_limited", "Muitas requisicoes. Tente novamente em instantes."),
  });

  app.setErrorHandler((error, request, reply) => {
    const publicError = toPublicError(error);

    if (publicError.statusCode >= 500) {
      request.log.error({ err: error, requestId: request.id }, "crm_api_error");
    } else {
      request.log.info({ code: publicError.code, requestId: request.id }, "crm_api_rejected");
    }

    void reply.status(publicError.statusCode).send({
      error: {
        code: publicError.code,
        message: publicError.message,
        requestId: request.id,
      },
    });
  });

  app.addHook("onClose", async () => {
    await dependencies.membershipRepository.close();
    await dependencies.crmRepository.close();
    await dependencies.databaseHealth.close();
  });

  app.get("/api/health", async () => ({
    status: "ok",
    service: "artec-crm-api",
    database: await dependencies.databaseHealth.check(),
    timestamp: new Date().toISOString(),
  }));

  void app.register(async (instance) => {
    registerAuvoWebhookRoutes(instance, dependencies);
  });

  app.get("/api/me", { preHandler: [authenticate(dependencies), requirePermission("self:read")] }, async (request) => {
    const user = request.crmUser;
    if (!user) {
      throw new ApiError(401, "unauthorized", "Autenticacao obrigatoria.");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      membershipStatus: user.membershipStatus,
      permissions: user.permissions,
    };
  });

  registerCrmRoutes(app, dependencies, createRouteGuards(authenticate(dependencies), requirePermission));

  app.setNotFoundHandler((request, reply) => {
    void reply.status(404).send({
      error: {
        code: "not_found",
        message: "Rota nao encontrada.",
        requestId: request.id,
      },
    });
  });

  return app;
}

function registerAuvoWebhookRoutes(instance: FastifyInstance, dependencies: ServerDependencies): void {
  instance.post(
    "/api/webhooks/auvo/:secret",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const secret = readSecretParam(request);
      const expectedSecret = dependencies.config.AUVO_WEBHOOK_SECRET;
      if (!expectedSecret) throw new ApiError(503, "internal_error", "Webhook Auvo nao configurado.");
      if (!secretsMatch(secret, expectedSecret)) throw new ApiError(403, "forbidden", "Webhook Auvo recusado.");

      const contentType = request.headers["content-type"] ?? "";
      if (!String(contentType).toLowerCase().includes("application/json")) {
        throw new ApiError(415, "bad_request", "Webhook Auvo aceita somente application/json.");
      }

      const contentLength = readContentLength(request.headers["content-length"]);
      if (contentLength !== null && contentLength > AUVO_WEBHOOK_MAX_BYTES) {
        throw new ApiError(413, "bad_request", "Payload do webhook excede o limite permitido.");
      }

      if (!isJsonObject(request.body)) throw new ApiError(400, "bad_request", "Payload JSON obrigatorio.");

      const startedAt = Date.now();
      const result = await dependencies.crmRepository.receiveAuvoWebhookEvent({
        payload: request.body,
        headers: sanitizeWebhookHeaders(request.headers),
        sourceIpHash: hashSourceIp(request.ip),
        contentLength,
      });
      request.log.info(
        {
          eventId: result.event.id,
          status: result.event.status,
          eventType: result.event.eventType,
          duplicate: result.duplicate,
          durationMs: Date.now() - startedAt,
        },
        "auvo_webhook_received",
      );

      return reply.status(202).send({
        status: result.duplicate ? "duplicate" : "received",
        eventId: result.event.id,
        duplicate: result.duplicate,
      });
    },
  );

  instance.route({
    method: ["GET", "PUT", "PATCH", "DELETE"],
    url: "/api/webhooks/auvo/:secret",
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: async () => {
      throw new ApiError(405, "bad_request", "Use POST para enviar webhook Auvo.");
    },
  });
}

function authenticate(dependencies: ServerDependencies) {
  return async (request: FastifyRequest) => {
    const accessToken = readBearerToken(request.headers.authorization);
    const verifiedUser = await dependencies.authVerifier.verify(accessToken).catch(() => {
      throw new ApiError(401, "unauthorized", "Token invalido ou expirado.");
    });
    const membership = await dependencies.membershipRepository.findByUserId(verifiedUser.id);

    if (!membership) {
      throw new ApiError(403, "membership_missing", "Usuario autenticado sem acesso liberado ao CRM.");
    }

    if (!membership.isActive) {
      throw new ApiError(403, "membership_inactive", "Membership inativa para o CRM.");
    }

    request.crmUser = {
      id: verifiedUser.id,
      email: verifiedUser.email,
      role: membership.role,
      membershipStatus: "active",
      permissions: getPermissionsForRole(membership.role),
    };
  };
}

function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.crmUser;

    if (!user) {
      throw new ApiError(401, "unauthorized", "Autenticacao obrigatoria.");
    }

    if (!roleHasPermission(user.role, permission)) {
      throw new ApiError(403, "forbidden", "Seu papel nao tem permissao para acessar esta rota.");
    }
  };
}

function readBearerToken(header: string | undefined): string {
  if (!header) {
    throw new ApiError(401, "unauthorized", "Header Authorization Bearer obrigatorio.");
  }

  const [scheme, token, extra] = header.split(" ");
  if (scheme !== "Bearer" || !token || extra) {
    throw new ApiError(401, "unauthorized", "Header Authorization Bearer invalido.");
  }

  return token;
}

function secretsMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function readSecretParam(request: FastifyRequest): string {
  const params = request.params as { secret?: string };
  return params.secret ?? "";
}

function readContentLength(header: string | string[] | undefined): number | null {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hashSourceIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}
