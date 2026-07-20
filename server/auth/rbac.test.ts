import { describe, expect, it } from "vitest";
import { getPermissionsForRole, roleHasPermission } from "./rbac.js";

describe("CRM RBAC", () => {
  it("derives manager permissions on the backend", () => {
    expect(getPermissionsForRole("gestor")).toContain("users:manage");
    expect(roleHasPermission("gestor", "settings:write")).toBe(true);
  });

  it("keeps vendedor and atendimento out of management permissions", () => {
    expect(roleHasPermission("vendedor", "users:manage")).toBe(false);
    expect(roleHasPermission("atendimento", "integrations:write")).toBe(false);
  });
});
