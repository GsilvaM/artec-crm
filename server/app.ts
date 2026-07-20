import cors from "@fastify/cors";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { getPermissionsForRole, roleHasPermission, type Permission } from "./auth/rbac.js";
import type { AuthenticatedUser, AuthVerifier, MembershipRepository } from "./auth/types.js";
import type { ServerConfig } from "./config.js";
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
  config: Pick<ServerConfig, "corsOrigins" | "CRM_LOG_LEVEL">;
  authVerifier: AuthVerifier;
  membershipRepository: MembershipRepository;
  crmRepository: CrmDataRepository;
  databaseHealth: DatabaseHealth;
};

export function buildServer(dependencies: ServerDependencies): FastifyInstance {
  const app = Fastify({
    logger: {
      level: dependencies.config.CRM_LOG_LEVEL,
      redact: ["req.headers.authorization", "request.headers.authorization"],
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
