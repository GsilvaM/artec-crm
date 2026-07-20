export type CrmRole = "gestor" | "vendedor" | "atendimento";

export type Permission =
  | "self:read"
  | "customers:read"
  | "customers:write"
  | "opportunities:read"
  | "opportunities:write"
  | "activities:read"
  | "activities:write"
  | "next_actions:read"
  | "next_actions:write"
  | "notifications:read"
  | "notifications:write"
  | "notifications:reconcile"
  | "users:manage"
  | "settings:read"
  | "settings:write"
  | "integrations:read"
  | "integrations:write"
  | "reports:read";

export const rolePermissions: Record<CrmRole, Permission[]> = {
  gestor: [
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
    "notifications:reconcile",
    "users:manage",
    "settings:read",
    "settings:write",
    "integrations:read",
    "integrations:write",
    "reports:read",
  ],
  vendedor: ["self:read", "customers:read", "customers:write", "opportunities:read", "opportunities:write", "activities:read", "activities:write", "next_actions:read", "next_actions:write", "notifications:read", "notifications:write"],
  atendimento: ["self:read", "customers:read", "customers:write", "opportunities:read", "opportunities:write", "activities:read", "activities:write", "next_actions:read", "next_actions:write", "notifications:read", "notifications:write"],
};

export function getPermissionsForRole(role: CrmRole): Permission[] {
  return rolePermissions[role];
}

export function roleHasPermission(role: CrmRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
