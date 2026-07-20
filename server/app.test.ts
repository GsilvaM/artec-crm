import { describe, expect, it } from "vitest";
import { buildServer } from "./app.js";
import type { AuthVerifier, Membership, MembershipRepository, VerifiedTokenUser } from "./auth/types.js";

function createTestServer(options: {
  verifiedUser?: VerifiedTokenUser;
  verifyError?: Error;
  membership?: Membership | null;
}) {
  const authVerifier: AuthVerifier = {
    async verify() {
      if (options.verifyError) throw options.verifyError;
      return options.verifiedUser ?? { id: "00000000-0000-0000-0000-000000000001", email: "gestor@artec.local" };
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
    },
    authVerifier,
    membershipRepository,
  });
}

describe("CRM API auth and RBAC", () => {
  it("exposes production health without auth", async () => {
    const app = createTestServer({});
    const response = await app.inject({ method: "GET", url: "/api/health" });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ ok: true, app: "artec-crm" });
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
      membership: { userId: "00000000-0000-0000-0000-000000000001", role: "vendedor", isActive: false },
    });
    const response = await app.inject({ method: "GET", url: "/api/me", headers: { authorization: "Bearer valid" } });
    await app.close();

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("membership_inactive");
  });

  it("returns only the safe current user payload for active membership", async () => {
    const app = createTestServer({
      membership: { userId: "00000000-0000-0000-0000-000000000001", role: "atendimento", isActive: true },
    });
    const response = await app.inject({ method: "GET", url: "/api/me", headers: { authorization: "Bearer valid" } });
    await app.close();
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      id: "00000000-0000-0000-0000-000000000001",
      email: "gestor@artec.local",
      role: "atendimento",
      membershipStatus: "active",
      permissions: ["self:read"],
    });
  });
});
